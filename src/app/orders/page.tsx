'use client'

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, MoreHorizontal, Eye, Loader2 } from "lucide-react"
import { OrderRepository } from "@/repositories"

// ---------- Types (matches your API) ----------
type RawPurchase = {
  PurchaseID: number
  FoodID: number
  FoodName: string | null
  FinalPrice: number
  IsCustomized: boolean
  Description: string | null
  Note: string | null
  Rating: number
  Status: number | string | null // API shows 1; be flexible
  PaymentMethod: number | string | null // API shows 1
  PurchaseDate: string // ISO
  DateAdded: string
  DateUpdated: string
  AddedBy: string | null
  UpdatedBy: string | null
}

type Purchase = {
  id: number
  foodId: number
  foodName: string
  finalPrice: number
  isCustomized: boolean
  description: string | null
  note: string | null
  rating: number
  status: "pending" | "in_progress" | "delivered" | "cancelled" | "unknown"
  paymentMethod: string
  purchaseDate: string | null
  dateAdded: string | null
  dateUpdated: string | null
  addedBy: string | null
  updatedBy: string | null
}

// ---------- Normalizers ----------
function normalizeStatus(s: RawPurchase["Status"]): Purchase["status"] {
  if (typeof s === "number") {
    // adjust if your backend uses a different mapping
    if (s === 0) return "pending"
    if (s === 1) return "delivered"
    if (s === 2) return "cancelled"
    if (s === 3) return "in_progress"
    return "unknown"
  }
  if (typeof s === "string") {
    const t = s.trim().toLowerCase().replace(/\s+/g, "_")
    if (["pending", "in_progress", "delivered", "cancelled"].includes(t)) return t as Purchase["status"]
    if (["paid", "completed", "success"].includes(t)) return "delivered"
    if (["processing", "preparing"].includes(t)) return "in_progress"
    if (["fail", "failed"].includes(t)) return "cancelled"
  }
  return "unknown"
}

function normalizePaymentMethod(p: RawPurchase["PaymentMethod"]): string {
  if (typeof p === "number") {
    // tweak to match your codes; 1 looked like PayPal in your mock
    if (p === 1) return "PayPal"
    if (p === 2) return "Stripe"
    if (p === 3) return "Cash"
    if (p === 4) return "Card"
    return `Method ${p}`
  }
  if (typeof p === "string") {
    const t = p.trim()
    if (!t) return "—"
    // prettify snake_case
    return t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  }
  return "—"
}

function normalizeRow(raw: RawPurchase): Purchase {
  return {
    id: Number(raw.PurchaseID),
    foodId: Number(raw.FoodID),
    foodName: raw.FoodName ?? "—",
    finalPrice: Number(raw.FinalPrice ?? 0),
    isCustomized: !!raw.IsCustomized,
    description: raw.Description ?? null,
    note: raw.Note ?? null,
    rating: Number(raw.Rating ?? 0),
    status: normalizeStatus(raw.Status),
    paymentMethod: normalizePaymentMethod(raw.PaymentMethod),
    purchaseDate: raw.PurchaseDate ?? null,
    dateAdded: raw.DateAdded ?? null,
    dateUpdated: raw.DateUpdated ?? null,
    addedBy: raw.AddedBy ?? null,
    updatedBy: raw.UpdatedBy ?? null,
  }
}

// ---------- UI helpers ----------
const getStatusColor = (status: Purchase["status"]) => {
  switch (status) {
    case "delivered":
      return "default" as const
    case "in_progress":
      return "secondary" as const
    case "pending":
      return "outline" as const
    case "cancelled":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString()
}

const fmtMoney = (n: number) => {
  if (Number.isNaN(n)) return "—"
  // adjust currency/locale if needed
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n)
}

export default function OrdersPage() {
  const [rows, setRows] = useState<Purchase[]>([])
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
        const res = await OrderRepository.getOrders()
        // Accept { FoodPurchase: [...] } | { Value: { FoodPurchase: [...] } } | direct array
        const rawList: RawPurchase[] =
          (res?.Value?.FoodPurchase ??
            res?.FoodPurchase ??
            (Array.isArray(res) ? res : [])) as RawPurchase[]
        const list = (rawList || []).map(normalizeRow)

        // optional: sort newest first by PurchaseDate
        list.sort((a, b) => {
          const ta = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0
          const tb = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0
          return tb - ta
        })

        if (mounted) setRows(list)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load orders")
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
        r.foodName,
        r.paymentMethod,
        r.status,
        r.addedBy ?? "",
        r.updatedBy ?? "",
        r.description ?? "",
        r.note ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return blob.includes(q)
    })
  }, [rows, query])

  // ------- KPIs (simple examples) -------
  const totalOrders = rows.length
  const deliveredCount = rows.filter(r => r.status === "delivered").length
  const pendingCount = rows.filter(r => r.status === "pending" || r.status === "in_progress").length
  const avgOrderValue =
    totalOrders > 0
      ? rows.reduce((s, r) => s + (r.finalPrice || 0), 0) / totalOrders
      : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage all food orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button className="flex-1 sm:flex-none">Export Orders</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : totalOrders}
            </div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending / In-Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : pendingCount}
            </div>
            <p className="text-xs text-gray-600">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : deliveredCount}
            </div>
            <p className="text-xs text-gray-600">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : fmtMoney(avgOrderValue)}
            </div>
            <p className="text-xs text-gray-600">Across all orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Orders</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search by ID, food, method, status…"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading orders…
            </div>
          ) : error ? (
            <div className="text-red-600">Error: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Order ID</TableHead>
                    <TableHead className="min-w-[150px]">Food</TableHead>
                    <TableHead className="min-w-[100px] hidden sm:table-cell">Customized</TableHead>
                    <TableHead className="min-w-[100px]">Total</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[140px] hidden lg:table-cell">Purchase Date</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Payment</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">#{r.id}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        <div className="font-medium">{r.foodName}</div>
                        <div className="text-xs text-gray-500">FoodID: {r.foodId}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {r.isCustomized ? "Customized" : "Standard"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 hidden sm:table-cell">
                        {r.isCustomized ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {fmtMoney(r.finalPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(r.status)}>
                          {r.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 hidden lg:table-cell">
                        {fmtDateTime(r.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 hidden md:table-cell">
                        {r.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="More">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-8">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
