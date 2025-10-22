'use client'

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, Loader2, Plus, Edit, Trash2, Info, Star, ChefHat, Clock } from "lucide-react"
import { FoodRepository } from "@/repositories"

// ---------- Types & Normalization ----------

type RawFood = any

type ApiFood = {
  // Core
  FoodID: number
  FoodName: string | null
  Price: number | null
  Category: string | null // using FoodType → Category column
  IsAvailable: boolean | string | number | null
  DateAdded: string | null
  DateUpdated: string | null

  // Expanded fields from your payload
  ChefID?: string | null
  AddressID?: number | null
  FoodOriginCode?: number | null
  IngredientTypeCode?: number | null
  IngredientsRaw?: string | null
  Ingredients?: string[]
  Rating?: number | null
  foodDescription?: string | null
  cookingTime?: number | null
  AddedBy?: string | null
  EstimatedCalories?: number | null
  Confidence?: number | null
  Tags?: string[]
  Cuisine?: string | null
  ServingSize?: string | number | null
  ProteinGrams?: number | null
  CarbsGrams?: number | null
  FatGrams?: number | null
  SugarGrams?: number | null
  Fiber?: number | null
  Sodium?: number | null
  Origin?: string | null
  Disclaimer?: string | null
}

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
  return toBoolStatus(f.IsAvailable) === true
}

function safeNumber(n: any): number | null {
  const v = Number(n)
  return Number.isFinite(v) ? v : null
}

function parseTags(maybeJson: any): string[] {
  if (!maybeJson) return []
  if (Array.isArray(maybeJson)) return maybeJson.map(String).filter(Boolean)
  if (typeof maybeJson === "string") {
    try {
      const arr = JSON.parse(maybeJson)
      return Array.isArray(arr) ? arr.map(String).filter(Boolean) : []
    } catch {
      // fallback: comma-separated
      return maybeJson.split(",").map((t) => t.trim()).filter(Boolean)
    }
  }
  return []
}

function parseIngredients(s: any): string[] {
  if (!s) return []
  return String(s)
    .split(/[,\n]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    // de-dup, case-insensitive
    .filter((v, i, arr) => arr.findIndex(a => a.toLowerCase() === v.toLowerCase()) === i)
}

function normalizeFood(raw: RawFood): ApiFood {
  const status = raw?.IsAvailable ?? raw?.isAvailable ?? raw?.Available ?? raw?.available ?? raw?.Status ?? raw?.status ?? null

  const FoodType = raw?.FoodType ?? raw?.foodType ?? raw?.Category ?? raw?.category ?? null
  const Cuisine = raw?.Cuisine ?? raw?.cuisine ?? null

  const Tags = parseTags(raw?.TagsJson ?? raw?.tagsJson ?? raw?.Tags ?? raw?.tags)

  const ingredientsRaw = raw?.Ingredients ?? raw?.ingredients ?? null
  const Ingredients = parseIngredients(ingredientsRaw)

  return {
    // Core
    FoodID: Number(raw?.FoodID ?? raw?.foodId ?? raw?.id ?? 0),
    FoodName: raw?.FoodName ?? raw?.foodName ?? raw?.name ?? null,
    Price: safeNumber(raw?.Price ?? raw?.price),
    Category: FoodType, // show FoodType in table's Category column
    IsAvailable: status,
    DateAdded: raw?.DateAdded ?? raw?.dateAdded ?? raw?.CreatedAt ?? raw?.createdAt ?? null,
    DateUpdated: raw?.DateUpdated ?? raw?.dateUpdated ?? raw?.UpdatedAt ?? raw?.updatedAt ?? null,

    // Expanded
    ChefID: raw?.ChefID ?? null,
    AddressID: safeNumber(raw?.AddressID),
    FoodOriginCode: safeNumber(raw?.FoodOriginCode),
    IngredientTypeCode: safeNumber(raw?.IngredientTypeCode),
    IngredientsRaw: ingredientsRaw,
    Ingredients,
    Rating: safeNumber(raw?.Rating),
    foodDescription: raw?.foodDescription ?? raw?.Description ?? raw?.description ?? null,
    cookingTime: safeNumber(raw?.cookingTime),
    AddedBy: raw?.AddedBy ?? null,
    EstimatedCalories: safeNumber(raw?.EstimatedCalories),
    Confidence: safeNumber(raw?.Confidence),
    Tags,
    Cuisine,
    ServingSize: raw?.ServingSize ?? null,
    ProteinGrams: safeNumber(raw?.ProteinGrams),
    CarbsGrams: safeNumber(raw?.CarbsGrams),
    FatGrams: safeNumber(raw?.FatGrams),
    SugarGrams: safeNumber(raw?.SugarGrams),
    Fiber: safeNumber(raw?.Fiber),
    Sodium: safeNumber(raw?.Sodium),
    Origin: raw?.Origin ?? null,
    Disclaimer: raw?.Disclaimer ?? null,
  }
}

// ---------- Helpers (formatting, smart bits) ----------

const allergens = [
  "milk", "cream", "butter", "cheese", "yogurt", "lactose",
  "egg", "eggs",
  "peanut", "peanuts",
  "tree nut", "almond", "walnut", "cashew", "pecan", "hazelnut", "pistachio",
  "soy", "soybean",
  "wheat", "gluten", "flour",
  "fish", "salmon", "tuna", "cod",
  "shellfish", "shrimp", "prawn", "lobster", "crab", "clam", "clams", "oyster", "mussel",
  "sesame"
]

function hasAllergen(token: string): boolean {
  const t = token.toLowerCase()
  return allergens.some(a => t.includes(a))
}

function kcalFromMacros(p?: number | null, c?: number | null, f?: number | null): number | null {
  if (p == null && c == null && f == null) return null
  const pp = Number(p ?? 0), cc = Number(c ?? 0), ff = Number(f ?? 0)
  return Math.round(pp * 4 + cc * 4 + ff * 9)
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString()
}
function fmtPrice(price?: number | null) {
  if (!price || price === 0) return "—"
  return `₨${price.toFixed(0)}` // change to your currency; previously `$`
}
function plural(n: number, s: string) {
  return `${n} ${s}${n === 1 ? "" : "s"}`
}

function Stars({ value = 0 }: { value?: number | null }) {
  const v = Math.max(0, Math.min(5, Number(value ?? 0)))
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < v ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  )
}

// ---------- Component ----------

export default function FoodsPage() {
  const [foods, setFoods] = useState<ApiFood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  // quick filters
  const [cuisine, setCuisine] = useState<string>("all")
  const [foodType, setFoodType] = useState<string>("all")
  const [minRating, setMinRating] = useState<string>("all")

  // details dialog
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ApiFood | null>(null)

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

  const cuisines = useMemo(() => {
    const set = new Set(foods.map(f => f.Cuisine || "").filter(Boolean))
    return Array.from(set).sort()
  }, [foods])

  const foodTypes = useMemo(() => {
    const set = new Set(foods.map(f => f.Category || "").filter(Boolean))
    return Array.from(set).sort()
  }, [foods])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return foods.filter(f => {
      if (cuisine !== "all" && (f.Cuisine || "").toLowerCase() !== cuisine.toLowerCase()) return false
      if (foodType !== "all" && (f.Category || "").toLowerCase() !== foodType.toLowerCase()) return false
      if (minRating !== "all" && Number(f.Rating ?? 0) < Number(minRating)) return false

      if (!q) return true
      const values = [
        String(f.FoodID ?? ""),
        f.FoodName ?? "",
        f.foodDescription ?? "",
        f.Category ?? "",
        f.Cuisine ?? "",
        statusLabel(f),
        fmtPrice(f.Price),
        (f.Ingredients ?? []).join(" "),
        (f.Tags ?? []).join(" "),
        f.AddedBy ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return values.includes(q)
    })
  }, [foods, query, cuisine, foodType, minRating])

  const toggleStatus = async (f: ApiFood) => {
    const targetAvailable = !isAvailable(f)
    const verb = targetAvailable ? "Make Available" : "Make Unavailable"
    if (!confirm(`${verb} food item ${f.FoodID} (${f.FoodName})?`)) return

    setBusyId(f.FoodID)
    setFoods(prev => prev.map(x => x.FoodID === f.FoodID ? { ...x, IsAvailable: targetAvailable } : x))

    try {
      await FoodRepository.updateFood({
        id: f.FoodID.toString(),
        isAvailable: targetAvailable,
      })
    } catch {
      // rollback
      setFoods(prev => prev.map(x => x.FoodID === f.FoodID ? { ...x, IsAvailable: !targetAvailable } : x))
      alert(`Failed to ${verb.toLowerCase()}. Please try again.`)
    } finally {
      setBusyId(null)
    }
  }

  const deleteFood = async (f: ApiFood) => {
    if (!confirm(`Delete food item ${f.FoodID} (${f.FoodName})? This action cannot be undone.`)) return
    setBusyId(f.FoodID)
    const snapshot = foods
    setFoods(prev => prev.filter(x => x.FoodID !== f.FoodID))
    try {
      await FoodRepository.deleteFood(f.FoodID.toString())
    } catch {
      setFoods(snapshot)
      alert(`Failed to delete food item. Please try again.`)
    } finally {
      setBusyId(null)
    }
  }

  const openDetails = (f: ApiFood) => {
    setSelected(f)
    setOpen(true)
  }

  // KPI
  const totalFoods = foods.length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Food Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{loading ? "…" : totalFoods}</div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{loading ? "…" : availableFoods}</div>
            <p className="text-xs text-gray-600"></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{loading ? "…" : newThisMonth}</div>
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
            <div className="text-2xl font-bold text-gray-900">{loading ? "…" : fmtPrice(avgPrice)}</div>
            <p className="text-xs text-gray-600">Per item</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-gray-800">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ingredient, cuisine, tag, price…"
              className="pl-10"
            />
          </div>
          <Select value={cuisine} onValueChange={setCuisine}>
            <SelectTrigger><SelectValue placeholder="Cuisine" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {cuisines.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={foodType} onValueChange={setFoodType}>
            <SelectTrigger><SelectValue placeholder="Food Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {foodTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger><SelectValue placeholder="Min Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Rating</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Food Items</CardTitle>
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
                    <TableHead className="min-w-[70px]">ID</TableHead>
                    <TableHead className="min-w-[220px]">Name</TableHead>
                    <TableHead className="min-w-[90px]">Price</TableHead>
                    <TableHead className="min-w-[120px]">Cuisine</TableHead>
                    <TableHead className="min-w-[120px]">Type</TableHead>
                    <TableHead className="min-w-[120px]">Rating</TableHead>
                    <TableHead className="min-w-[120px]">Cook Time</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[160px]" />
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
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {f.FoodName || "—"}
                            {f.AddedBy && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <ChefHat className="h-3.5 w-3.5" /> {f.AddedBy}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[320px]">
                            {f.foodDescription || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">
                          {fmtPrice(f.Price)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{f.Cuisine || "—"}</TableCell>
                        <TableCell className="text-sm text-gray-700">{f.Category || "—"}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Stars value={f.Rating ?? 0} />
                            <span className="text-gray-600 text-xs">{f.Rating ?? 0}/5</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {f.cookingTime ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {plural(f.cookingTime, "min")}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={available ? "default" : "secondary"}>{label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetails(f)}
                              className="w-full sm:w-auto"
                            >
                              <Info className="h-3.5 w-3.5 mr-1" /> Details
                            </Button>
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
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
                      <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-8">
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

      {/* Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.FoodName ?? "Food Details"}
              {selected?.Cuisine && (
                <Badge variant="outline">{selected.Cuisine}</Badge>
              )}
              {selected?.Category && (
                <Badge variant="secondary">{selected.Category}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              ID #{selected?.FoodID} • {selected?.DateAdded ? `Added ${fmtDate(selected?.DateAdded)}` : "—"}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {selected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: Meta + Ingredients */}
              <div className="space-y-4">
                {selected.foodDescription && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                    <p className="text-sm text-gray-800">{selected.foodDescription}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Meta label="Price" value={fmtPrice(selected.Price)} />
                  <Meta label="Status" value={statusLabel(selected)} />
                  <Meta label="Chef ID" value={selected.ChefID || "—"} />
                  <Meta label="Added By" value={selected.AddedBy || "—"} />
                  <Meta label="Cook Time" value={selected.cookingTime ? plural(selected.cookingTime, "min") : "—"} />
                  <Meta label="Rating" value={`${selected.Rating ?? 0}/5`} />
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Ingredients</div>
                  {selected.Ingredients && selected.Ingredients.length > 0 ? (
                    <ScrollArea className="h-28 rounded border p-2">
                      <div className="flex flex-wrap gap-2">
                        {selected.Ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-full text-xs border ${
                              hasAllergen(ing) ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                            title={hasAllergen(ing) ? "Potential allergen" : ""}
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                  {selected.Tags && selected.Tags.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selected.Tags.map((t, i) => (
                          <Badge key={i} variant="outline">#{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Nutrition */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700">Nutrition (per item)</div>
                <div className="grid grid-cols-2 gap-3">
                  <NutChip label="Calories" value={(() => {
                    const calc = kcalFromMacros(selected.ProteinGrams, selected.CarbsGrams, selected.FatGrams)
                    const est = selected.EstimatedCalories
                    if (est != null && calc != null && Math.abs(est - calc) / Math.max(1, est) > 0.15) {
                      return `${est} kcal (est), ~${calc} kcal (calc)`
                    }
                    return `${est ?? calc ?? "—"} kcal`
                  })()} />
                  <NutChip label="Protein" value={selected.ProteinGrams != null ? `${selected.ProteinGrams} g` : "—"} />
                  <NutChip label="Carbs" value={selected.CarbsGrams != null ? `${selected.CarbsGrams} g` : "—"} />
                  <NutChip label="Fat" value={selected.FatGrams != null ? `${selected.FatGrams} g` : "—"} />
                  <NutChip label="Sugar" value={selected.SugarGrams != null ? `${selected.SugarGrams} g` : "—"} />
                  <NutChip label="Fiber" value={selected.Fiber != null ? `${selected.Fiber} g` : "—"} />
                  <NutChip label="Sodium" value={selected.Sodium != null ? `${selected.Sodium} mg` : "—"} />
                  <NutChip label="Serving Size" value={selected.ServingSize != null ? String(selected.ServingSize) : "—"} />
                </div>
                {selected.Disclaimer && (
                  <p className="text-xs text-gray-500 leading-relaxed">{selected.Disclaimer}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- Small UI helpers ----------

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  )
}

function NutChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2 flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
