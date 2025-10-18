'use client'

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, Loader2 } from "lucide-react"
import { UserRepository } from "@/repositories"

// Backend note: Status is boolean (true=Active, false=Blocked). Some APIs might still return strings.
// Make the type flexible and normalize.
type ApiUser = {
  UserID: number
  FirstName: string | null
  LastName: string | null
  Gender: string | null
  Status: boolean | string | number | null
  Type: string | null
  DateAdded: string | null // ISO
  DateUpdated: string | null // ISO
}

/** Convert whatever the backend sends into a simple boolean (or null if unknown) */
function toBoolStatus(s: ApiUser["Status"]): boolean | null {
  if (typeof s === "boolean") return s
  if (typeof s === "number") return s !== 0
  if (typeof s === "string") {
    const t = s.trim().toLowerCase()
    if (["active", "true", "1", "yes", "y"].includes(t)) return true
    if (["blocked", "false", "0", "no", "n", "inactive", "not active"].includes(t)) return false
  }
  return null
}

function statusLabel(u: ApiUser): "Active" | "Blocked" | "—" {
  const b = toBoolStatus(u.Status)
  return b === true ? "Active" : b === false ? "Blocked" : "—"
}
function isBlocked(u: ApiUser): boolean {
  const b = toBoolStatus(u.Status)
  return b === false
}

/** Normalize one raw row to ApiUser, covering various casings/aliases from backend */
function normalizeUser(raw: any): ApiUser {
  const status =
    raw?.Status ?? raw?.status ?? raw?.IsActive ?? raw?.isActive ?? raw?.Active ?? raw?.active ?? null

  return {
    UserID: Number(raw?.UserID ?? raw?.userId ?? raw?.id ?? 0),
    FirstName: raw?.FirstName ?? raw?.firstName ?? raw?.first_name ?? null,
    LastName: raw?.LastName ?? raw?.lastName ?? raw?.last_name ?? null,
    Gender: raw?.Gender ?? raw?.gender ?? null,
    Status: status,
    Type: raw?.Type ?? raw?.type ?? null,
    DateAdded: raw?.DateAdded ?? raw?.dateAdded ?? raw?.CreatedAt ?? raw?.createdAt ?? null,
    DateUpdated: raw?.DateUpdated ?? raw?.dateUpdated ?? raw?.UpdatedAt ?? raw?.updatedAt ?? null,
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([])
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
        const res = await UserRepository.getUsers()
      
        const listRaw: any =
          res?.Value?.Users ?? res?.Users ?? (Array.isArray(res) ? res : []) ?? []
        const list: ApiUser[] = (Array.isArray(listRaw) ? listRaw : []).map(normalizeUser)
        if (mounted) setUsers(list)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load users")
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

  const fullName = (u: ApiUser) => {
    const f = u.FirstName ?? ""
    const l = u.LastName ?? ""
    const name = `${f} ${l}`.trim()
    return name || "—"
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => {
      const values = [
        String(u.UserID ?? ""),
        u.FirstName ?? "",
        u.LastName ?? "",
        u.Gender ?? "",
        statusLabel(u), // use normalized label for searching
        u.Type ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return values.includes(q)
    })
  }, [users, query])

  // --- KPIs
  const totalUsers = users.length
  const now = new Date()

  const newThisMonth = useMemo(() => {
    const m = now.getMonth()
    const y = now.getFullYear()
    return users.filter(u => {
      if (!u.DateAdded) return false
      const d = new Date(u.DateAdded)
      return !Number.isNaN(d.getTime()) && d.getMonth() === m && d.getFullYear() === y
    }).length
  }, [users])

  const activeUsers = useMemo(() => {
    console.log(users,'User is this')
    return users.filter(u => toBoolStatus(u.Status) === true).length
  }, [users])

  const avgOrdersPerUser = "—"

  // --- UPDATE STATUS ACTION (Block/Unblock)
  const toggleStatus = async (u: ApiUser) => {
    const currentlyBlocked = isBlocked(u)
    const targetBlocked = !currentlyBlocked // true means "we're going to block now"
    const verb = targetBlocked ? "Block" : "Unblock"
    if (!confirm(`${verb} user ${u.UserID} (${fullName(u)})?`)) return
    const reason = targetBlocked ? (prompt("Reason (optional):") ?? "") : ""

    setBusyId(u.UserID)

    // optimistic update: set boolean Status (true=Active, false=Blocked)
    setUsers(prev =>
      prev.map(x =>
        x.UserID === u.UserID ? { ...x, Status: targetBlocked ? false : true } : x
      )
    )

    try {
      await UserRepository.updateUserStatus({
        userId: u.UserID,
        block: targetBlocked,
        reason: reason || undefined,
      })
      // keep optimistic state on success
    } catch (e) {
      // rollback to original
      const oldBool = toBoolStatus(u.Status)
      setUsers(prev =>
        prev.map(x => (x.UserID === u.UserID ? { ...x, Status: oldBool } : x))
      )
      alert(`Failed to ${verb.toLowerCase()} user. Please try again.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage your app users and their information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>Export Users</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : totalUsers}
            </div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "…" : activeUsers}
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

       
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search by name, ID, status…"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users…
            </div>
          ) : error ? (
            <div className="text-red-600">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const label = statusLabel(u)
                  const active = label === "Active"
                  return (
                    <TableRow key={u.UserID}>
                      <TableCell className="text-sm text-gray-600">{u.UserID}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{fullName(u)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={active ? "default" : "secondary"}>
                          {label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{fmtDate(u.DateAdded)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{fmtDate(u.DateUpdated)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === u.UserID}
                          onClick={() => toggleStatus(u)}
                        >
                          {busyId === u.UserID ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
                            </span>
                          ) : isBlocked(u) ? (
                            "Unblock"
                          ) : (
                            "Block"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
