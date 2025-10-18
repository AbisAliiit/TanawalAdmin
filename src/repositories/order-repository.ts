import apiClient from '../common/axios-config';
import { AdminEndpoint } from '../common/endpoints';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  price: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface UpdateOrderRequest {
  id: string;
  status?: OrderStatus;
  notes?: string;
}

export class OrderRepository {
  // Get all orders
  static async getOrders(): Promise<any> {
    const response = await apiClient.get(AdminEndpoint.PURCHASE.GET_ORDERS);
    return response.data;
  }

  // Get order by ID
  static async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get(`${AdminEndpoint.PURCHASE.GET_ORDER_BY_ID}/${orderId}`);
    return response.data;
  }

  // Update order
  static async updateOrder(orderData: UpdateOrderRequest): Promise<Order> {
    const response = await apiClient.put(AdminEndpoint.PURCHASE.UPDATE_ORDER, orderData);
    return response.data;
  }

  // Delete order
  static async deleteOrder(orderId: string): Promise<void> {
    await apiClient.delete(`${AdminEndpoint.PURCHASE.DELETE_ORDER}/${orderId}`);
  }
}