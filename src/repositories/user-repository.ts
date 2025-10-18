import apiClient from '../common/axios-config';
import { AdminEndpoint } from '../common/endpoints';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface AuthenticateRequest {
  email: string;
  password: string;
}

export interface AuthenticateResponse {
  token: string;
  user: User;
}

export class UserRepository {
  // Example API call with MSAL token
  static async getUsers(): Promise<any> {
    try {
      const response = await apiClient.get(AdminEndpoint.USER.GET_USERS);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
// inside UserRepository class

// PUT /ChangeUserStatus?UserId=123
static async updateUserStatus(payload: {
  userId: number
  block: boolean
  reason?: string
  actedByUserId?: number
}): Promise<any> {
  try {
    const { userId, block, reason, actedByUserId } = payload
    const response = await apiClient.put(
      `${AdminEndpoint.USER.UPDATE_USER_STATUS}?UserId=${userId}`,
      {
        block,
        reason,
        actedByUserId,
      }
    )
    return response.data
  } catch (error) {
    console.error("Error updating user status:", error)
    throw error
  }
}

  // Example API call for updating user
  static async updateUser(userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put(AdminEndpoint.USER.UPDATE_USER, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Example API call for deleting user
  static async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`${AdminEndpoint.USER.DELETE_USER}/${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Example API call for adding address
  static async addAddress(userId: string, address: string): Promise<void> {
    try {
      await apiClient.post(AdminEndpoint.USER.ADD_ADDRESS, {
        userId,
        address,
      });
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  // Example API call for getting address
  static async getAddressByUserId(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get(`${AdminEndpoint.USER.GET_ADDRESS}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    }
  }
}