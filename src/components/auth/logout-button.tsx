"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useAuth } from "./auth-provider"

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { logout } = useAuth()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="text-gray-600 hover:text-gray-900"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="ml-2 hidden sm:inline">Logout</span>
    </Button>
  )
}
