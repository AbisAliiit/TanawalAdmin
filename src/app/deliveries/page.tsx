'use client'

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, MoreHorizontal, Eye, Loader2, Truck, MapPin, Clock, User } from "lucide-react"
import { DeliveryRepository, DeliveryStatus } from "@/repositories"

// ---------- Types (matches your API) ----------
type RawDelivery = {
  DeliveryID: number
  OrderID: number
  CustomerName: string
  CustomerEmail: string
  CustomerPhone: string
  DeliveryAddress: string
  Status: number | string | null
  EstimatedDeliveryTime: string
  ActualDeliveryTime?: string
  DeliveryFee: number
  DriverName?: string
  DriverPhone?: string
  Notes?: string
  CreatedAt: string
  UpdatedAt: string
}

type Delivery = {
  id: number
  orderId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "failed" | "unknown"
  estimatedDeliveryTime: string | null
  actualDeliveryTime: string | null
  deliveryFee: number
  driverName: string | null
  driverPhone: string | null
  notes: string | null
  createdAt: string | null
  updatedAt: string | null
}

// ---------- Normalizers ----------
function normalizeStatus(s: RawDelivery["Status"]): Delivery["status"] {
  if (s === null || s === undefined) return "unknown"
  const num = typeof s === "string" ? parseInt(s, 10) : s
  switch (num) {
    case 0: return "pending"
    case 1: return "assigned"
    case 2: return "picked_up"
    case 3: return "in_transit"
    case 4: return "delivered"
    case 5: return "cancelled"
    case 6: return "failed"
    default: return "unknown"
  }
}

function normalizeRow(raw: RawDelivery): Delivery {
  return {
    id: raw.DeliveryID,
    orderId: raw.OrderID,
    customerName: raw.CustomerName || "Unknown Customer",
    customerEmail: raw.CustomerEmail || "",
    customerPhone: raw.CustomerPhone || "",
    deliveryAddress: raw.DeliveryAddress || "",
    status: normalizeStatus(raw.Status),
    estimatedDeliveryTime: raw.EstimatedDeliveryTime || null,
    actualDeliveryTime: raw.ActualDeliveryTime || null,
    deliveryFee: raw.DeliveryFee || 0,
    driverName: raw.DriverName || null,
    driverPhone: raw.DriverPhone || null,
    notes: raw.Notes || null,
    createdAt: raw.CreatedAt || null,
    updatedAt: raw.UpdatedAt || null,
  }
}

// ---------- Status Badge Component ----------
function StatusBadge({ status }: { status: Delivery["status"] }) {
  const variants: Record<Delivery["status"], "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    assigned: "outline",
    picked_up: "outline",
    in_transit: "outline",
    delivered: "default",
    cancelled: "destructive",
    failed: "destructive",
    unknown: "secondary",
  }

  const colors: Record<Delivery["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    assigned: "bg-blue-100 text-blue-800",
    picked_up: "bg-purple-100 text-purple-800",
    in_transit: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800",
  }

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  )
}

// ---------- Utility Functions ----------
const fmtMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const fmtDate = (s: string | null) => {
  if (!s) return "N/A"
  try {
    return new Date(s).toLocaleString()
  } catch {
    return "Invalid Date"
  }
}

export default function DeliveriesPage() {
  const [rows, setRows] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // ------- Fetch -------
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await DeliveryRepository.getDeliveries()
        // Accept { Deliveries: [...] } | { Value: { Deliveries: [...] } } | direct array
        const rawList: RawDelivery[] =
          (res?.Value?.Deliveries ??
            res?.Deliveries ??
            (Array.isArray(res) ? res : [])) as RawDelivery[]
        const list = (rawList || []).map(normalizeRow)

        // optional: sort newest first by CreatedAt
        list.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return tb - ta
        })

        if (mounted) setRows(list)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load deliveries")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // ------- Search / filter -------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => {
      const blob = [
        r.id,
        r.orderId,
        r.customerName,
        r.customerEmail,
        r.customerPhone,
        r.deliveryAddress,
        r.status,
        r.driverName ?? "",
        r.driverPhone ?? "",
        r.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return blob.includes(q)
    })
  }, [rows, query])

  // ------- KPIs (simple examples) -------
  const totalDeliveries = rows.length
  const deliveredCount = rows.filter(r => r.status === "delivered").length
  const pendingCount = rows.filter(r => r.status === "pending" || r.status === "assigned").length
  const inTransitCount = rows.filter(r => r.status === "picked_up" || r.status === "in_transit").length
  const totalRevenue = rows.filter(r => r.status === "delivered").reduce((sum, r) => sum + r.deliveryFee, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading deliveries...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading deliveries</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-600">Manage and track delivery orders</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inTransitCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{fmtMoney(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, address, driver, or status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Deliveries ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Delivery Fee</TableHead>
                  <TableHead>Estimated Time</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">{delivery.id}</TableCell>
                    <TableCell>{delivery.orderId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{delivery.customerName}</div>
                        <div className="text-sm text-gray-500">{delivery.customerEmail}</div>
                        <div className="text-sm text-gray-500">{delivery.customerPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="max-w-[200px] truncate">{delivery.deliveryAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={delivery.status} />
                    </TableCell>
                    <TableCell>
                      {delivery.driverName ? (
                        <div>
                          <div className="font-medium">{delivery.driverName}</div>
                          <div className="text-sm text-gray-500">{delivery.driverPhone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{fmtMoney(delivery.deliveryFee)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{fmtDate(delivery.estimatedDeliveryTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{fmtDate(delivery.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No deliveries found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

