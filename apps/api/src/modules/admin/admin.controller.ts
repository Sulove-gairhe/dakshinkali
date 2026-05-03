import { ProductRepositoryImpl } from '../products/repositories/product.repository.impl';
import { OrderRepository } from '../orders/order.repository';
import { ProfileRepository } from '../profiles/profile.repository';

export class AdminDashboardController {
    constructor(
        private readonly productRepository: ProductRepositoryImpl,
        private readonly orderRepository: OrderRepository,
        private readonly profileRepository: ProfileRepository
    ) { }

    async stats() {
        const [activeProducts, inactiveProducts, outOfStockProducts, orderStats, userStats] = await Promise.all([
            this.productRepository.findAll({ status: 'active', includeDeleted: false }, { page: 1, pageSize: 1 }),
            this.productRepository.findAll({ status: 'inactive', includeDeleted: false }, { page: 1, pageSize: 1 }),
            this.productRepository.findAll({ status: 'out_of_stock', includeDeleted: false }, { page: 1, pageSize: 1 }),
            this.orderRepository.stats(),
            this.profileRepository.stats(),
        ]);

        return {
            status: 200,
            data: {
                products: {
                    active: activeProducts.total,
                    inactive: inactiveProducts.total,
                    outOfStock: outOfStockProducts.total,
                    total: activeProducts.total + inactiveProducts.total + outOfStockProducts.total,
                },
                orders: {
                    total: orderStats.totalOrders,
                    pending: orderStats.pendingOrders,
                    revenue: orderStats.revenue,
                    recent: orderStats.recentOrders.map(order => ({
                        id: order.id,
                        orderNumber: order.orderNumber,
                        status: order.status,
                        total: order.total,
                        createdAt: order.createdAt.toISOString(),
                    })),
                },
                users: userStats,
            },
        };
    }
}
