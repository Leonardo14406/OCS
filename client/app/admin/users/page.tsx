/*
 * USER MANAGEMENT PAGE
 *
 * Real-world replacements needed:
 * 1. Replace createOfficer with real API endpoint
 * 2. Replace updateOfficer with real API endpoint
 * 3. Replace deleteOfficer with real API endpoint
 * 4. Add real authentication and authorization checks
 * 5. Implement server-side pagination for large datasets
 * 6. Add form validation and error handling
 * 7. Connect to real user database
 */

"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Officer, OfficerRole, Ministry } from "@/lib/types"
import { UserPlus, Trash2, Edit, Search, Slash, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type OfficerRow = Officer & { isActive?: boolean }

export default function UserManagementPage() {
  const { toast } = useToast()
  const [officers, setOfficers] = useState<OfficerRow[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(true)
  const [isLoadingMinistries, setIsLoadingMinistries] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [officerToDeactivate, setOfficerToDeactivate] = useState<OfficerRow | null>(null)
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("")
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [newOfficer, setNewOfficer] = useState({
    fullName: "",
    email: "",
    department: "",
    role: "investigator" as OfficerRole,
  })

  const filteredOfficers = officers.filter((officer) => {
    const q = searchQuery.toLowerCase()
    return (
      officer.fullName.toLowerCase().includes(q) ||
      officer.email.toLowerCase().includes(q) ||
      (officer.employeeId ?? "").toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoadingOfficers(true)
      try {
        const res = await fetch("/api/admin/accounts")
        if (!res.ok) {
          throw new Error("Failed to fetch accounts")
        }
        const accounts = await res.json()

        const mapped: OfficerRow[] = accounts
          .filter((a: any) => a.role === "officer")
          .map((a: any): OfficerRow => ({
            id: a.id,
            fullName: a.fullName ?? a.email ?? "",
            email: a.email ?? "",
            employeeId: a.employeeId ?? "",
            department: a.department ?? "",
            role: (a.officerRole as OfficerRole) ?? "investigator",
            assignedComplaints: a.assignedComplaints ?? 0,
            resolvedComplaints: a.resolvedComplaints ?? 0,
            joinedAt: a.createdAt ? new Date(a.createdAt) : new Date(),
            isActive: a.isActive ?? true,
          }))

        setOfficers(mapped)
      } catch (error) {
        console.error("Failed to load officers:", error)
        toast({
          title: "Error",
          description: "Failed to load officers. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingOfficers(false)
      }
    }

    loadAccounts()
  }, [toast])

  useEffect(() => {
    const loadMinistries = async () => {
      setIsLoadingMinistries(true)
      try {
        const res = await fetch("/api/ministries")
        if (!res.ok) {
          throw new Error("Failed to fetch ministries")
        }
        const data = await res.json()
        setMinistries(data)
      } catch (error) {
        console.error("Failed to load ministries:", error)
        toast({
          title: "Error",
          description: "Failed to load ministries. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingMinistries(false)
      }
    }

    loadMinistries()
  }, [toast])

  const handleCreateOfficer = async () => {
    if (!newOfficer.fullName || !newOfficer.email || !newOfficer.department) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Persist internal user in the real database (Account model)
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newOfficer.email,
          fullName: newOfficer.fullName,
          role: "officer",
          department: newOfficer.department,
          officerRole: newOfficer.role,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create user")
      }

      const account = await res.json()

      const created: OfficerRow = {
        id: account.id,
        fullName: account.fullName ?? account.email ?? newOfficer.fullName,
        email: account.email ?? newOfficer.email,
        employeeId: account.employeeId ?? "",
        department: account.department ?? newOfficer.department,
        role: (account.officerRole as OfficerRole) ?? newOfficer.role,
        assignedComplaints: account.assignedComplaints ?? 0,
        resolvedComplaints: account.resolvedComplaints ?? 0,
        joinedAt: account.createdAt ? new Date(account.createdAt) : new Date(),
        isActive: account.isActive ?? true,
      }

      setOfficers([...officers, created])
      setIsCreateDialogOpen(false)
      setNewOfficer({
        fullName: "",
        email: "",
        department: "",
        role: "investigator",
      })

      toast({
        title: "User created",
        description: `${created.fullName} has been added to the system`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleDeactivateOfficer = (officer: OfficerRow) => {
    setOfficerToDeactivate(officer)
    setDeactivateConfirmText("")
    setIsDeactivateDialogOpen(true)
  }

  const getRoleBadgeVariant = (role: OfficerRole) => {
    switch (role) {
      case "supervisor":
        return "default"
      case "senior_investigator":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage officers and investigators</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Officers</CardTitle>
                <CardDescription>
                  {isLoadingOfficers ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading officers...
                    </span>
                  ) : (
                    `${officers.length} total officers in the system`
                  )}
                </CardDescription>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search officers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Officer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Officer</DialogTitle>
                      <DialogDescription>Add a new investigator or officer to the system</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={newOfficer.fullName}
                          onChange={(e) => setNewOfficer({ ...newOfficer, fullName: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newOfficer.email}
                          onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                          placeholder="john.smith@ombudsman.gov"
                        />
                      </div>

                      <div>
                        <Label htmlFor="department">Ministry *</Label>
                        {isLoadingMinistries ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select
                            value={newOfficer.department}
                            onValueChange={(value) => setNewOfficer({ ...newOfficer, department: value })}
                          >
                            <SelectTrigger id="department">
                              <SelectValue placeholder="Select ministry" />
                            </SelectTrigger>
                            <SelectContent>
                              {ministries.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">No ministries available</div>
                              ) : (
                                ministries.map((ministry) => (
                                  <SelectItem key={`${ministry.id}-${ministry.name}`} value={ministry.name}>
                                    {ministry.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="role">Role *</Label>
                        <Select
                          value={newOfficer.role}
                          onValueChange={(value: OfficerRole) => setNewOfficer({ ...newOfficer, role: value })}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="investigator">Investigator</SelectItem>
                            <SelectItem value="senior_investigator">Senior Investigator</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateOfficer}>Create Officer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOfficers ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="animate-pulse">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-8 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-8 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredOfficers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UserPlus className="h-8 w-8 opacity-50" />
                        <p className="text-sm font-medium">No officers found</p>
                        <p className="text-xs">
                          {searchQuery ? "Try adjusting your search query" : "Get started by adding your first officer"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOfficers.map((officer) => (
                    <TableRow key={officer.id} className={!officer.isActive ? "opacity-60" : ""}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {officer.fullName}
                        {!officer.isActive && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{officer.email}</TableCell>
                      <TableCell>{officer.employeeId}</TableCell>
                      <TableCell>{officer.department}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(officer.role)}>{officer.role.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{officer.assignedComplaints}</TableCell>
                      <TableCell className="text-right">{officer.resolvedComplaints}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={officer.isActive === false ? "Already inactive" : "Deactivate"}
                            disabled={officer.isActive === false}
                            onClick={() => handleDeactivateOfficer(officer)}
                          >
                            <Slash className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate officer account</DialogTitle>
              <DialogDescription>
                This will revoke the officer&apos;s ability to log in. To confirm, type
                <span className="font-semibold"> DEACTIVATE </span>
                below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <p className="text-sm">
                Officer: <span className="font-medium">{officerToDeactivate?.fullName}</span>
                <br />
                Email: <span className="font-mono text-xs">{officerToDeactivate?.email}</span>
              </p>
              <div>
                <Label htmlFor="deactivate-confirm">Type DEACTIVATE to confirm</Label>
                <Input
                  id="deactivate-confirm"
                  value={deactivateConfirmText}
                  onChange={(e) => setDeactivateConfirmText(e.target.value.toUpperCase())}
                  placeholder="DEACTIVATE"
                  autoComplete="off"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeactivateDialogOpen(false)
                  setOfficerToDeactivate(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deactivateConfirmText !== "DEACTIVATE" || !officerToDeactivate || isDeactivating}
                onClick={async () => {
                  if (!officerToDeactivate || deactivateConfirmText !== "DEACTIVATE") return

                  try {
                    setIsDeactivating(true)
                    const res = await fetch("/api/admin/accounts", {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        id: officerToDeactivate.id,
                        isActive: false,
                      }),
                    })

                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}))
                      throw new Error(data.error || "Failed to deactivate user")
                    }

                    setOfficers((prev) =>
                      prev.map((o) =>
                        o.id === officerToDeactivate.id
                          ? {
                              ...o,
                              isActive: false,
                            }
                          : o,
                      ),
                    )

                    toast({
                      title: "User deactivated",
                      description: `${officerToDeactivate.fullName} has been deactivated`,
                    })

                    setIsDeactivateDialogOpen(false)
                    setOfficerToDeactivate(null)
                    setDeactivateConfirmText("")
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to deactivate user",
                      variant: "destructive",
                    })
                  } finally {
                    setIsDeactivating(false)
                  }
                }}
              >
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
