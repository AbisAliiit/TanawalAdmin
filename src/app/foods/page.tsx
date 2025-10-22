'use client'

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { FoodRepository } from "@/repositories"

// Backend note: Status is boolean (true=Available, false=Unavailable). Some APIs might still return strings.
// Make the type flexible and normalize.
type ApiFood = {
  FoodID: number
  FoodName: string | null
  Description: string | null
  Price: number | null
  Category: string | null
  ImageUrl: string | null
  IsAvailable: boolean | string | number | null
  DateAdded: string | null // ISO
  DateUpdated: string | null // ISO
}

/** Convert whatever the backend sends into a simple boolean (or null if unknown) */
function toBoolStatus(s: ApiFood["IsAvailable"]): boolean | null {
  if (typeof s === "boolean") return s
  if (typeof s === "number") return s !== 0
  if (typeof s === "string") {
    const t = s.trim().toLowerCase()
    if (["available", "true", "1", "yes", "y"].includes(t)) return true
    if (["unavailable", "false", "0", "no", "n", "inactive", "not available"].includes(t)) return false
  }
  return null
}

function statusLabel(f: ApiFood): "Available" | "Unavailable" | "—" {
  const b = toBoolStatus(f.IsAvailable)
  return b === true ? "Available" : b === false ? "Unavailable" : "—"
}
function isAvailable(f: ApiFood): boolean {
  const b = toBoolStatus(f.IsAvailable)
  return b === true
}

/** Normalize one raw row to ApiFood, covering various casings/aliases from backend */
function normalizeFood(raw: any): ApiFood {
  const status =
    raw?.IsAvailable ?? raw?.isAvailable ?? raw?.Available ?? raw?.available ?? raw?.Status ?? raw?.status ?? null

  return {
    FoodID: Number(raw?.FoodID ?? raw?.foodId ?? raw?.id ?? 0),
    FoodName: raw?.FoodName ?? raw?.foodName ?? raw?.name ?? null,
    Description: raw?.Description ?? raw?.description ?? null,
    Price: Number(raw?.Price ?? raw?.price ?? 0),
    Category: raw?.Category ?? raw?.category ?? null,
    ImageUrl: raw?.ImageUrl ?? raw?.imageUrl ?? raw?.image ?? null,
    IsAvailable: status,
    DateAdded: raw?.DateAdded ?? raw?.dateAdded ?? raw?.CreatedAt ?? raw?.createdAt ?? null,
    DateUpdated: raw?.DateUpdated ?? raw?.dateUpdated ?? raw?.UpdatedAt ?? raw?.updatedAt ?? null,
  }
}

export default function FoodsPage() {
  const [foods, setFoods] = useState<ApiFood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await FoodRepository.getFoods()
      
        const listRaw: any =
          res?.Value?.Foods ?? res?.Foods ?? (Array.isArray(res) ? res : []) ?? []
        const list: ApiFood[] = (Array.isArray(listRaw) ? listRaw : []).map(normalizeFood)
        if (mounted) setFoods(list)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load foods")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // --- Helpers
  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleString()
  }

  const fmtPrice = (price?: number | null) => {
    if (!price || price === 0) return "—"
    return `$${price.toFixed(2)}`
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods
    return foods.filter(f => {
      const values = [
        String(f.FoodID ?? ""),
        f.FoodName ?? "",
        f.Description ?? "",
        f.Category ?? "",
        statusLabel(f), // use normalized label for searching
        fmtPrice(f.Price),
      ]
        .join(" ")
        .toLowerCase()
      return values.includes(q)
    })
  }, [foods, query])

  // --- KPIs
  const totalFoods = foods.length
  const now = new Date()

  const newThisMonth = useMemo(() => {
    const m = now.getMonth()
    const y = now.getFullYear()
    return foods.filter(f => {
      if (!f.DateAdded) return false
      const d = new Date(f.DateAdded)
      return !Number.isNaN(d.getTime()) && d.getMonth() === m && d.getFullYear() === y
    }).length
  }, [foods])

  const availableFoods = useMemo(() => {
    return foods.filter(f => toBoolStatus(f.IsAvailable) === true).length
  }, [foods])

  const avgPrice = useMemo(() => {
    const validPrices = foods.filter(f => f.Price && f.Price > 0).map(f => f.Price!)
    if (validPrices.length === 0) return 0
    return validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
  }, [foods])

  // --- UPDATE STATUS ACTION (Available/Unavailable)
  const toggleStatus = async (f: ApiFood) => {
    const currentlyAvailable = isAvailable(f)
    const targetAvailable = !currentlyAvailable // true means "we're going to make available now"
    const verb = targetAvailable ? "Make Available" : "Make Unavailable"
    if (!confirm(`${verb} food item ${f.FoodID} (${f.FoodName})?`)) return

    setBusyId(f.FoodID)

    // optimistic update: set boolean IsAvailable (true=Available, false=Unavailable)
    setFoods(prev =>
      prev.map(x =>
        x.FoodID === f.FoodID ? { ...x, IsAvailable: targetAvailable ? true : false } : x
      )
    )

    try {
      await FoodRepository.updateFood({
        id: f.FoodID.toString(),
        isAvailable: targetAvailable,
      })
      // keep optimistic state on success
    } catch (e) {
      // rollback to original
      const oldBool = toBoolStatus(f.IsAvailable)
      setFoods(prev =>
        prev.map(x => (x.FoodID === f.FoodID ? { ...x, IsAvailable: oldBool } : x))
      )
      alert(`Failed to ${verb.toLowerCase()}. Please try again.`)
    } finally {
      setBusyId(null)
    }
  }

  // --- DELETE ACTION
  const deleteFood = async (f: ApiFood) => {
    if (!confirm(`Delete food item ${f.FoodID} (${f.FoodName})? This action cannot be undone.`)) return

    setBusyId(f.FoodID)

    // optimistic update: remove from list
    setFoods(prev => prev.filter(x => x.FoodID !== f.FoodID))

    try {
      await FoodRepository.deleteFood(f.FoodID.toString())
      // keep optimistic state on success
    } catch (e) {
      // rollback to original
      setFoods(prev => [...prev, f])
      alert(`Failed to delete food item. Please try again.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Food Items</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your food menu and items</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Add Food
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Food Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : totalFoods}
            </div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : availableFoods}
            </div>
            <p className="text-xs text-gray-600"></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : newThisMonth}
            </div>
            <p className="text-xs text-gray-600">
              {now.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : fmtPrice(avgPrice)}
            </div>
            <p className="text-xs text-gray-600">Per item</p>
          </CardContent>
        </Card>
      </div>

      {/* Foods Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Food Items</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search by name, category, price…"
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
              Loading food items…
            </div>
          ) : error ? (
            <div className="text-red-600">Error: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">Price</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[140px] hidden sm:table-cell">Date Added</TableHead>
                    <TableHead className="w-[200px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => {
                    const label = statusLabel(f)
                    const available = label === "Available"
                    return (
                      <TableRow key={f.FoodID}>
                        <TableCell className="text-sm text-gray-600">{f.FoodID}</TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{f.FoodName || "—"}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {f.Category && `Category: ${f.Category}`}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">
                          {fmtPrice(f.Price)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 hidden sm:table-cell">
                          {f.Category || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={available ? "default" : "secondary"}>
                            {label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 hidden sm:table-cell">{fmtDate(f.DateAdded)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === f.FoodID}
                              onClick={() => toggleStatus(f)}
                              className="w-full sm:w-auto"
                            >
                              {busyId === f.FoodID ? (
                                <span className="inline-flex items-center gap-1">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
                                </span>
                              ) : isAvailable(f) ? (
                                "Make Unavailable"
                              ) : (
                                "Make Available"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === f.FoodID}
                              className="w-full sm:w-auto"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === f.FoodID}
                              onClick={() => deleteFood(f)}
                              className="w-full sm:w-auto text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                        No food items found.
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
