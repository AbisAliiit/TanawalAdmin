"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart,
  UtensilsCrossed,
  ChefHat,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
  },
  {
    name: "Food Items",
    href: "/foods",
    icon: ChefHat,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
]

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <UtensilsCrossed className="h-8 w-8 text-sky-600" />
          <span className="text-xl font-bold text-gray-900">Tanawal Admin</span>
        </div>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose} // Close sidebar on mobile when navigating
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-sky-50 text-sky-700 border-r-2 border-sky-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-sky-600" : "text-gray-400 group-hover:text-gray-500"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Tanawal Admin Portal
        </div>
      </div>
    </div>
  )
}
