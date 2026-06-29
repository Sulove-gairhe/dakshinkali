import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifyAdminsOfDeliveredOrder } from './admin-order-notifications';
import type { OrderWithItemsEntity } from '../modules/orders/types';
import { createSupabaseClient } from '@dakshinkali/database';
import { sendAdminDeliveredOrderPush } from './admin-push-notifications';

// Mock dependencies
vi.mock('@dakshinkali/database');
vi.mock('./admin-push-notifications');

describe('Delivered Order Notifications (Task 5)', () => {
    let mockSupabaseClient: any;
    let mockOrderData: OrderWithItemsEntity;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock order data
        mockOrderData = {
            id: 'order-123',
            orderNumber: 'ORD-001',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            customerPhone: '9841234567',
            total: 1500,
            subtotal: 1400,
            shippingCost: 100,
            discountAmount: 0,
            couponCode: null,
            notes: null,
            status: 'delivered',
            paymentMethod: 'cod',
            paymentStatus: 'paid',
            shippingAddress: {
                line1: '123 Main St',
                line2: null,
                city: 'Kathmandu',
                state: 'Bagmati',
                postalCode: '44600',
                country: 'Nepal',
            },
            items: [
                {
                    id: 'item-1',
                    orderId: 'order-123',
                    productId: 'prod-1',
                    productName: 'Test Product',
                    quantity: 2,
                    unitPrice: 700,
                    productImageUrl: 'https://example.com/image.jpg',
                },
            ],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
        } as OrderWithItemsEntity;

        // Setup Supabase mock
        mockSupabaseClient = {
            from: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { id: 'bell-1' },
                error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'existing-bell' },
                error: null,
            }),
        };

        (createSupabaseClient as any).mockReturnValue(mockSupabaseClient);
    });

    describe('Task 5.1: claimDeliveredNotification atomic function', () => {
        it('should claim notification successfully when status is pending', async () => {
            // Arrange
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: { id: 'order-123' },
                error: null,
            });

            (sendAdminDeliveredOrderPush as any).mockResolvedValue(undefined);

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - verify atomic claim UPDATE query
            expect(mockSupabaseClient.update).toHaveBeenCalledWith({
                delivered_notification_status: 'sending',
            });
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'order-123');
            expect(mockSupabaseClient.in).toHaveBeenCalledWith(
                'delivered_notification_status',
                ['pending', 'failed']
            );
        });

        it('should skip notification when already claimed (returns no rows)', async () => {
            // Arrange
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: null,
                error: null,
            });

            (sendAdminDeliveredOrderPush as any).mockResolvedValue(undefined);

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - should not call sendAdminDeliveredOrderPush
            expect(sendAdminDeliveredOrderPush).not.toHaveBeenCalled();
        });

        it('should log error on claim failure', async () => {
            // Arrange
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
            });

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - verify error logging with correct prefix
            expect(consoleSpy).toHaveBeenCalledWith(
                '[DELIVERED_ORDER_NOTIFY_CLAIM_ERROR]',
                expect.objectContaining({
                    orderId: 'order-123',
                    message: 'Database error',
                })
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Task 5.2: notifyAdminsOfDeliveredOrder orchestration', () => {
        it('should update status to sent on successful notification', async () => {
            // Arrange
            mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
                data: { id: 'order-123' },
                error: null,
            });

            (sendAdminDeliveredOrderPush as any).mockResolvedValue(undefined);

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - verify status update to 'sent' with timestamp
            const updateCalls = mockSupabaseClient.update.mock.calls;
            const sentUpdateCall = updateCalls.find((call: any) =>
                call[0].delivered_notification_status === 'sent'
            );

            expect(sentUpdateCall).toBeDefined();
            expect(sentUpdateCall[0]).toMatchObject({
                delivered_notification_status: 'sent',
                delivered_notification_sent_at: expect.any(String),
            });
        });

        it('should update status to failed when FCM fails', async () => {
            // Arrange
            mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
                data: { id: 'order-123' },
                error: null,
            });

            (sendAdminDeliveredOrderPush as any).mockRejectedValue(
                new Error('FCM send failed')
            );

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - verify status update to 'failed'
            const updateCalls = mockSupabaseClient.update.mock.calls;
            const failedUpdateCall = updateCalls.find((call: any) =>
                call[0].delivered_notification_status === 'failed'
            );

            expect(failedUpdateCall).toBeDefined();
            expect(failedUpdateCall[0]).toEqual({
                delivered_notification_status: 'failed',
            });
        });

        it('should call sendAdminDeliveredOrderPush with order data', async () => {
            // Arrange
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: { id: 'order-123' },
                error: null,
            });

            (sendAdminDeliveredOrderPush as any).mockResolvedValue(undefined);

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert
            expect(sendAdminDeliveredOrderPush).toHaveBeenCalledWith(mockOrderData);
            expect(sendAdminDeliveredOrderPush).toHaveBeenCalledTimes(1);
        });

        it('should NOT touch admin_notification_status field', async () => {
            // Arrange
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: { id: 'order-123' },
                error: null,
            });

            (sendAdminDeliveredOrderPush as any).mockResolvedValue(undefined);

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - verify admin_notification_status is never updated
            const updateCalls = mockSupabaseClient.update.mock.calls;
            const hasAdminNotificationStatus = updateCalls.some((call: any) =>
                'admin_notification_status' in call[0]
            );

            expect(hasAdminNotificationStatus).toBe(false);
        });

        it('should handle concurrent notification attempts (idempotency)', async () => {
            // Arrange - simulate second process trying to claim
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: null, // Already claimed by another process
                error: null,
            });

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - should skip without error
            expect(sendAdminDeliveredOrderPush).not.toHaveBeenCalled();
        });
    });

    describe('Task 5 Requirements Validation', () => {
        it('should satisfy Requirement 4.1-4.4: Delivered order notification trigger', async () => {
            // Arrange
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: { id: 'order-123' },
                error: null,
            });

            (sendAdminDeliveredOrderPush as any).mockResolvedValue(undefined);

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert
            expect(sendAdminDeliveredOrderPush).toHaveBeenCalled();
        });

        it('should satisfy Requirement 10.1-10.4: Prevent duplicate notifications', async () => {
            // Arrange - first attempt
            mockSupabaseClient.maybeSingle
                .mockResolvedValueOnce({
                    data: { id: 'order-123' },
                    error: null,
                })
                .mockResolvedValueOnce({
                    data: { delivered_notification_status: 'sending' },
                    error: null,
                })
                .mockResolvedValueOnce({
                    data: { id: 'existing-bell' },
                    error: null,
                })
                .mockResolvedValueOnce({
                    data: null,
                    error: null,
                });

            (sendAdminDeliveredOrderPush as any).mockResolvedValue(undefined);

            // Act - first notification
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Act - second notification attempt
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - FCM only called once
            expect(sendAdminDeliveredOrderPush).toHaveBeenCalledTimes(1);
        });

        it('should satisfy Requirement 20.5: Error handling', async () => {
            // Arrange
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockSupabaseClient.maybeSingle.mockResolvedValue({
                data: null,
                error: { message: 'Database connection lost' },
            });

            // Act
            await notifyAdminsOfDeliveredOrder('order-123', mockOrderData);

            // Assert - verify error logging
            expect(consoleSpy).toHaveBeenCalledWith(
                '[DELIVERED_ORDER_NOTIFY_CLAIM_ERROR]',
                expect.any(Object)
            );

            consoleSpy.mockRestore();
        });
    });
});
