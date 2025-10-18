// Authentication utilities for Tanawal Admin Portal

export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

export interface AuthResponse {
  token: string
  user: User
  expiresIn: number
}

export class AuthService {
  private static readonly TOKEN_KEY = 'authToken'
  private static readonly USER_KEY = 'user'
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.azurewebsites.net'

  // Login user
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data: AuthResponse = await response.json()
      
      // Store token and user data
      this.setToken(data.token)
      this.setUser(data.user)
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout user
  static logout(): void {
    this.removeToken()
    this.removeUser()
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!this.getToken()
  }

  // Get current user
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem(this.USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }

  // Get token
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.TOKEN_KEY)
  }

  // Set token
  private static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  // Set user
  private static setUser(user: User): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  // Remove token
  private static removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.TOKEN_KEY)
  }

  // Remove user
  private static removeUser(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.USER_KEY)
  }

  // Refresh token
  static async refreshToken(): Promise<string | null> {
    try {
      const token = this.getToken()
      if (!token) return null

      const response = await fetch(`${this.API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        this.logout()
        return null
      }

      const data = await response.json()
      this.setToken(data.token)
      return data.token
    } catch (error) {
      console.error('Token refresh error:', error)
      this.logout()
      return null
    }
  }

  // Get auth headers for API calls
  static getAuthHeaders(): HeadersInit {
    const token = this.getToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  // Validate token
  static async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken()
      if (!token) return false

      const response = await fetch(`${this.API_BASE_URL}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }
}
