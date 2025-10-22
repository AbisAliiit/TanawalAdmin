import apiClient from '../common/axios-config';
import { FoodEndpoint } from '../common/endpoints';

export interface Food {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodRequest {
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface UpdateFoodRequest {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export class FoodRepository {
  // Get all food items
  static async getFoods(): Promise<any> {
    try {
      const response = await apiClient.get(FoodEndpoint.FOOD.GETFOOD);
      return response.data;
    } catch (error) {
      console.error('Error fetching foods:', error);
      throw error;
    }
  }

  // Add new food item
  static async addFood(foodData: CreateFoodRequest): Promise<Food> {
    try {
      const response = await apiClient.post(FoodEndpoint.FOOD.ADDFOOD, foodData);
      return response.data;
    } catch (error) {
      console.error('Error adding food:', error);
      throw error;
    }
  }

  // Update food item
  static async updateFood(foodData: UpdateFoodRequest): Promise<Food> {
    try {
      const response = await apiClient.put(FoodEndpoint.FOOD.UPDATEFOOD, foodData);
      return response.data;
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  }

  // Delete food item
  static async deleteFood(foodId: string): Promise<void> {
    try {
      await apiClient.delete(`${FoodEndpoint.FOOD.DELETEFOOD}/${foodId}`);
    } catch (error) {
      console.error('Error deleting food:', error);
      throw error;
    }
  }
}
