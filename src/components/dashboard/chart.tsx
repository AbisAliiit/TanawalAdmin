"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const revenueData = [
  { month: "Jan", revenue: 12000, orders: 240 },
  { month: "Feb", revenue: 19000, orders: 320 },
  { month: "Mar", revenue: 15000, orders: 280 },
  { month: "Apr", revenue: 22000, orders: 380 },
  { month: "May", revenue: 18000, orders: 310 },
  { month: "Jun", revenue: 25000, orders: 420 },
]

const orderData = [
  { day: "Mon", orders: 45 },
  { day: "Tue", orders: 52 },
  { day: "Wed", orders: 38 },
  { day: "Thu", orders: 67 },
  { day: "Fri", orders: 89 },
  { day: "Sat", orders: 95 },
  { day: "Sun", orders: 78 },
]

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function OrdersChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
