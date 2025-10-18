
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Tanawal Admin Portal</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <OrdersChart />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New order #1234 from John Doe</span>
            </div>
            <span className="text-xs text-gray-500">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">User Sarah Wilson registered</span>
            </div>
            <span className="text-xs text-gray-500">5 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Order #1231 completed</span>
            </div>
            <span className="text-xs text-gray-500">8 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New restaurant "Bella Vista" joined</span>
            </div>
            <span className="text-xs text-gray-500">12 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
