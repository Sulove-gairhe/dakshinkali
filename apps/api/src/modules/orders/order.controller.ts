import { AuthUser } from '../../common/middleware/auth.middleware';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { CreateOrderRequest, mapOrderToDTO, UpdateOrderStatusRequest } from './order.dto';
import { OrderService } from './order.service';
import { OrderListQuery, OrderStatus } from './types';

export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    async createOrder(user: AuthUser | undefined, body: CreateOrderRequest) {
        const currentUser = this.requireUser(user);
        const order = await this.orderService.createOrder(currentUser.id, body);
        return { status: 201, data: mapOrderToDTO(order) };
    }

    async listMyOrders(user: AuthUser | undefined, query: any) {
        const currentUser = this.requireUser(user);
        const result = await this.orderService.listUserOrders(currentUser.id, this.parseListQuery(query));
        return {
            status: 200,
            data: {
                ...result,
                data: result.data.map(mapOrderToDTO),
            },
        };
    }

    async getMyOrder(user: AuthUser | undefined, id: string) {
        const currentUser = this.requireUser(user);
        this.validateUUID(id, 'id');
        const order = await this.orderService.getUserOrder(currentUser.id, id);
        return { status: 200, data: mapOrderToDTO(order) };
    }

    async cancelMyOrder(user: AuthUser | undefined, id: string) {
        const currentUser = this.requireUser(user);
        this.validateUUID(id, 'id');
        const order = await this.orderService.cancelUserOrder(currentUser.id, id);
        return { status: 200, data: mapOrderToDTO(order) };
    }

    async listAdminOrders(query: any) {
        const result = await this.orderService.listAdminOrders(this.parseListQuery(query));
        return {
            status: 200,
            data: {
                ...result,
                data: result.data.map(mapOrderToDTO),
            },
        };
    }

    async getAdminOrder(id: string) {
        this.validateUUID(id, 'id');
        const order = await this.orderService.getAdminOrder(id);
        return { status: 200, data: mapOrderToDTO(order) };
    }

    async updateAdminOrderStatus(user: AuthUser | undefined, id: string, body: UpdateOrderStatusRequest) {
        const currentUser = this.requireUser(user);
        this.validateUUID(id, 'id');
        const status = this.validateStatus(body?.status);
        const order = await this.orderService.updateOrderStatus(id, status, body?.notes || null, currentUser.id);
        return { status: 200, data: mapOrderToDTO(order) };
    }

    async adminStats() {
        const stats = await this.orderService.stats();
        return {
            status: 200,
            data: {
                ...stats,
                recentOrders: stats.recentOrders.map(mapOrderToDTO),
            },
        };
    }

    private requireUser(user: AuthUser | undefined): AuthUser {
        if (!user) throw new UnauthorizedException('Authentication required.');
        return user;
    }

    private parseListQuery(query: any): Partial<OrderListQuery> {
        const page = query.page ? Number(query.page) : 1;
        const pageSize = query.pageSize ? Number(query.pageSize) : 20;
        const parsed: Partial<OrderListQuery> = { page, pageSize };

        if (!Number.isInteger(page) || page < 1) {
            throw new ValidationException('Invalid pagination', [{ field: 'page', message: 'Page must be a positive integer' }]);
        }
        if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
            throw new ValidationException('Invalid pagination', [{ field: 'pageSize', message: 'Page size must be between 1 and 100' }]);
        }
        if (query.status) parsed.status = this.validateStatus(query.status);
        if (query.userId) parsed.userId = this.validateUUID(query.userId, 'userId');
        return parsed;
    }

    private validateStatus(value: unknown): OrderStatus {
        const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (typeof value !== 'string' || !statuses.includes(value as OrderStatus)) {
            throw new ValidationException('Invalid order status', [
                { field: 'status', message: `Status must be one of: ${statuses.join(', ')}` },
            ]);
        }
        return value as OrderStatus;
    }

    private validateUUID(value: unknown, field: string): string {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
            throw new ValidationException('Invalid UUID', [{ field, message: `${field} must be a valid UUID` }]);
        }
        return value;
    }
}
