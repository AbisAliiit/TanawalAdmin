
import { KPICard } from "@/components/dashboard/kpi-card"
import { RevenueChart, OrdersChart } from "@/components/dashboard/chart"
import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react"

export default function Dashboard() {
 
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Welcome to Tanawal Admin Portal</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="Total Revenue"
          value="$125,430"
          change="+12.5% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <KPICard
          title="Total Users"
          value="2,847"
          change="+8.2% from last month"
          changeType="positive"
          icon={Users}
        />
        <KPICard
          title="Total Orders"
          value="1,234"
          change="+15.3% from last month"
          changeType="positive"
          icon={ShoppingCart}
        />
        <KPICard
          title="Growth Rate"
          value="23.1%"
          change="+2.1% from last month"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <KPICard
          title="Pending Orders"
          value="47"
          change="12 orders in queue"
          changeType="neutral"
          icon={Clock}
        />
        <KPICard
          title="Completed Today"
          value="156"
          change="98.7% completion rate"
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Active Restaurants"
          value="89"
          change="+3 new this week"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <RevenueChart />
        <OrdersChart />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-gray-600 truncate">New order #1234 from John Doe</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">2 min ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-gray-600 truncate">User Sarah Wilson registered</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">5 min ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-gray-600 truncate">Order #1231 completed</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">8 min ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-gray-600 truncate">New restaurant "Bella Vista" joined</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">12 min ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
