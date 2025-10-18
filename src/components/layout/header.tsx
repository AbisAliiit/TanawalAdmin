"use client"

import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import { AuthService } from "@/lib/auth"
import { useEffect, useState } from "react"

export function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Portal</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || 'admin@tanawal.com'}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
