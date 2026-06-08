import { SupabaseClient } from '@supabase/supabase-js';
import { type CouponRecord } from '@dakshinkali/database';
import {
    CreateOrderRecord,
    OrderEntity,
    OrderItemEntity,
    OrderListQuery,
    OrderStatus,
    OrderStatusHistoryEntity,
    OrderWithItemsEntity,
    PaginatedOrders,
} from './types';

export class OrderRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    async createFromCart(record: CreateOrderRecord, cartId: string): Promise<OrderWithItemsEntity> {
        const { data, error } = await this.supabase.rpc('create_order_from_cart', {
            p_cart_id: cartId,
            p_user_id: record.userId,
            p_order_number: record.orderNumber,
            p_customer_email: record.customerEmail,
            p_customer_name: record.customerName,
            p_customer_phone: record.customerPhone || null,
            p_shipping_address_line1: record.shippingAddress.line1,
            p_shipping_address_line2: record.shippingAddress.line2 || null,
            p_shipping_city: record.shippingAddress.city,
            p_shipping_state: record.shippingAddress.state,
            p_shipping_postal_code: record.shippingAddress.postalCode,
            p_shipping_country: record.shippingAddress.country,
            p_subtotal: record.subtotal,
            p_shipping_cost: record.shippingCost,
            p_tax: record.tax,
            p_total: record.total,
            p_payment_method: record.paymentMethod,
            p_payment_status: record.paymentStatus,
            p_notes: record.notes || null,
            p_items: record.items,
            p_coupon_code: record.couponCode || null,
            p_discount_amount: record.discountAmount || 0,
            p_original_subtotal: record.originalSubtotal ?? record.subtotal,
        });

        if (error) {
            throw new Error(`Failed to create order from cart: ${error.message}`);
        }

        const orderId = typeof data === 'string' ? data : data?.[0]?.create_order_from_cart || data?.[0]?.order_id;
        if (!orderId) {
            throw new Error('Failed to create order from cart: No order ID returned');
        }

        const created = await this.findById(orderId);
        if (!created) {
            throw new Error('Failed to load created order');
        }
        return created;
    }

    async create(record: CreateOrderRecord): Promise<OrderWithItemsEntity> {
        const orderRow = {
            user_id: record.userId,
            order_number: record.orderNumber,
            customer_email: record.customerEmail,
            customer_name: record.customerName,
            customer_phone: record.customerPhone || null,
            shipping_address_line1: record.shippingAddress.line1,
            shipping_address_line2: record.shippingAddress.line2 || null,
            shipping_city: record.shippingAddress.city,
            shipping_state: record.shippingAddress.state,
            shipping_postal_code: record.shippingAddress.postalCode,
            shipping_country: record.shippingAddress.country,
            subtotal: record.subtotal,
            shipping_cost: record.shippingCost,
            tax: record.tax,
            total: record.total,
            coupon_code: record.couponCode || null,
            discount_amount: record.discountAmount || 0,
            original_subtotal: record.originalSubtotal ?? record.subtotal,
            payment_method: record.paymentMethod,
            payment_status: record.paymentStatus,
            notes: record.notes || null,
        };

        const { data: orderData, error: orderError } = await this.supabase
            .from('orders')
            .insert(orderRow)
            .select()
            .single();

        if (orderError || !orderData) {
            throw new Error(`Failed to create order: ${orderError?.message || 'No data returned'}`);
        }

        const itemRows = record.items.map((item) => ({
            order_id: orderData.id,
            product_id: item.productId,
            product_name: item.productName,
            product_image_url: item.productImageUrl,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
        }));

        const { error: itemsError } = await this.supabase.from('order_items').insert(itemRows);
        if (itemsError) {
            throw new Error(`Failed to create order items: ${itemsError.message}`);
        }

        await this.addStatusHistory(orderData.id, orderData.status, 'Order created', record.userId);

        const created = await this.findById(orderData.id);
        if (!created) {
            throw new Error('Failed to load created order');
        }

        return created;
    }

    async findById(orderId: string): Promise<OrderWithItemsEntity | null> {
        const { data, error } = await this.supabase.from('orders').select().eq('id', orderId).single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to find order: ${error.message}`);
        }

        const [items, statusHistory] = await Promise.all([
            this.findItems(orderId),
            this.findStatusHistory(orderId),
        ]);

        return { ...this.mapOrder(data), items, statusHistory };
    }

    async list(query: OrderListQuery): Promise<PaginatedOrders> {
        let dbQuery = this.supabase.from('orders').select('*', { count: 'exact' });

        if (query.userId) dbQuery = dbQuery.eq('user_id', query.userId);
        if (query.status) dbQuery = dbQuery.eq('status', query.status);

        const offset = (query.page - 1) * query.pageSize;
        const { data, error, count } = await dbQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + query.pageSize - 1);

        if (error) {
            throw new Error(`Failed to list orders: ${error.message}`);
        }

        const orders = await Promise.all((data || []).map(async (row) => {
            const details = await this.findById(row.id);
            return details!;
        }));

        const total = count || 0;
        return {
            data: orders,
            total,
            page: query.page,
            pageSize: query.pageSize,
            totalPages: Math.ceil(total / query.pageSize),
        };
    }

    async updateStatus(orderId: string, status: OrderStatus, notes: string | null, changedBy: string): Promise<OrderWithItemsEntity> {
        const { data, error } = await this.supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Failed to update order status: ${error?.message || 'Order not found'}`);
        }

        await this.addStatusHistory(orderId, status, notes, changedBy);
        const updated = await this.findById(orderId);
        if (!updated) {
            throw new Error('Failed to load updated order');
        }
        return updated;
    }

    async stats(): Promise<{ totalOrders: number; revenue: number; pendingOrders: number; recentOrders: OrderWithItemsEntity[] }> {
        const { data, error, count } = await this.supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to load order stats: ${error.message}`);
        }

        const orders = (data || []).map(row => this.mapOrder(row));
        const revenue = orders
            .filter(order => order.status !== 'cancelled')
            .reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const recentOrders = await Promise.all((data || []).slice(0, 5).map(async row => (await this.findById(row.id))!));

        return {
            totalOrders: count || 0,
            revenue,
            pendingOrders,
            recentOrders,
        };
    }

    async findCouponByCode(code: string): Promise<CouponRecord | null> {
        const { data, error } = await this.supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .is('archived_at', null)
            .maybeSingle();

        if (error) throw new Error(`Failed to find coupon: ${error.message}`);
        if (!data) return null;

        return {
            ...data,
            discount_value: this.toRequiredNumber(data.discount_value),
            max_discount_amount: this.toOptionalNumber(data.max_discount_amount),
            minimum_order_amount: this.toOptionalNumber(data.minimum_order_amount),
            usage_limit: this.toOptionalNumber(data.usage_limit),
            used_count: this.toRequiredNumber(data.used_count),
            applicable_category_ids: data.applicable_category_ids ?? [],
            applicable_product_ids: data.applicable_product_ids ?? [],
        } as CouponRecord;
    }

    async findProductCategoryIds(productIds: string[]): Promise<Map<string, string | null>> {
        if (productIds.length === 0) return new Map();

        const { data, error } = await this.supabase
            .from('products')
            .select('id,category_id')
            .in('id', productIds);

        if (error) throw new Error(`Failed to load coupon product categories: ${error.message}`);
        return new Map((data ?? []).map((row: any) => [row.id as string, row.category_id as string | null]));
    }

    private async findItems(orderId: string): Promise<OrderItemEntity[]> {
        const { data, error } = await this.supabase.from('order_items').select().eq('order_id', orderId);
        if (error) throw new Error(`Failed to find order items: ${error.message}`);
        return (data || []).map(row => ({
            id: row.id,
            orderId: row.order_id,
            productId: row.product_id,
            productName: row.product_name,
            productImageUrl: row.product_image_url,
            quantity: row.quantity,
            unitPrice: Number(row.unit_price),
            totalPrice: Number(row.total_price),
            createdAt: new Date(row.created_at),
        }));
    }

    private async findStatusHistory(orderId: string): Promise<OrderStatusHistoryEntity[]> {
        const { data, error } = await this.supabase
            .from('order_status_history')
            .select()
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
        if (error) throw new Error(`Failed to find order status history: ${error.message}`);
        return (data || []).map(row => ({
            id: row.id,
            orderId: row.order_id,
            status: row.status,
            notes: row.notes,
            changedBy: row.changed_by,
            createdAt: new Date(row.created_at),
        }));
    }

    private async addStatusHistory(orderId: string, status: string, notes: string | null, changedBy: string): Promise<void> {
        const { error } = await this.supabase.from('order_status_history').insert({
            order_id: orderId,
            status,
            notes,
            changed_by: changedBy,
        });
        if (error) throw new Error(`Failed to add order status history: ${error.message}`);
    }

    private mapOrder(row: any): OrderEntity {
        return {
            id: row.id,
            userId: row.user_id,
            orderNumber: row.order_number,
            status: row.status,
            customerEmail: row.customer_email,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            shippingAddress: {
                line1: row.shipping_address_line1,
                line2: row.shipping_address_line2,
                city: row.shipping_city,
                state: row.shipping_state,
                postalCode: row.shipping_postal_code,
                country: row.shipping_country,
            },
            subtotal: Number(row.subtotal),
            shippingCost: Number(row.shipping_cost),
            tax: Number(row.tax),
            couponCode: row.coupon_code,
            discountAmount: Number(row.discount_amount ?? 0),
            originalSubtotal: row.original_subtotal === null ? null : Number(row.original_subtotal),
            total: Number(row.total),
            paymentMethod: row.payment_method,
            paymentStatus: row.payment_status,
            notes: row.notes,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }

    private toOptionalNumber(value: unknown): number | null {
        if (value === null || value === undefined || value === '') return null;
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : null;
    }

    private toRequiredNumber(value: unknown): number {
        const numberValue = Number(value ?? 0);
        return Number.isFinite(numberValue) ? numberValue : 0;
    }
}
