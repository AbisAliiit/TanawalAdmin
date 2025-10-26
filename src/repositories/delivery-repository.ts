import apiClient from '../common/axios-config';
import { AdminEndpoint } from '../common/endpoints';

export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  deliveryFee: number;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export interface UpdateDeliveryRequest {
  id: string;
  status: DeliveryStatus;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

export class DeliveryRepository {
  // Get all deliveries
  static async getDeliveries(): Promise<any> {
    const response = await apiClient.get(AdminEndpoint.DELIVERY.GET_DELIVERIES);
    return response.data;
  }

  // Get delivery by ID
  static async getDeliveryById(deliveryId: string): Promise<Delivery> {
    const response = await apiClient.get(`${AdminEndpoint.DELIVERY.GET_DELIVERIES}/${deliveryId}`);
    return response.data;
  }

  // Update delivery
  static async updateDelivery(deliveryData: UpdateDeliveryRequest): Promise<Delivery> {
    const response = await apiClient.put(`${AdminEndpoint.DELIVERY.GET_DELIVERIES}/${deliveryData.id}`, deliveryData);
    return response.data;
  }

  // Cancel delivery
  static async cancelDelivery(deliveryId: string): Promise<void> {
    await apiClient.delete(`${AdminEndpoint.DELIVERY.GET_DELIVERIES}/${deliveryId}`);
  }
}

