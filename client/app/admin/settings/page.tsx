/*
 * SETTINGS PAGE
 *
 * Real-world replacements needed:
 * 1. Replace ministry/category CRUD operations with real API
 * 2. Add database persistence for all settings
 * 3. Implement validation and conflict checking
 * 4. Add audit logging for configuration changes
 * 5. Connect to admin configuration service
 * 6. Add system-wide settings (timeouts, thresholds, etc.)
 */

"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import type { Ministry, ComplaintCategory } from "@/lib/types"
import { Plus, Trash2, Edit, Building2, Tags } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  const { toast } = useToast()

  // TODO: Replace with real state management and API
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [categories, setCategories] = useState<ComplaintCategory[]>([])

  const [isMinistryDialogOpen, setIsMinistryDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  const [newMinistry, setNewMinistry] = useState({
    name: "",
    code: "",
    description: "",
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const [ministryRes, categoryRes] = await Promise.all([
          fetch("/api/admin/ministries"),
          fetch("/api/admin/categories"),
        ])

        if (ministryRes.ok) {
          const data = await ministryRes.json()
          setMinistries(data)
        }

        if (categoryRes.ok) {
          const data = await categoryRes.json()
          setCategories(data)
        }
      } catch {
        // Leave fallback state if API fails; UI will still render.
      }
    }

    loadTaxonomy()
  }, [])

  const handleCreateMinistry = async () => {
    if (!newMinistry.name || !newMinistry.code) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/admin/ministries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMinistry),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create ministry")
      }

      const created: Ministry = await res.json()
      setMinistries([...ministries, created])
      setIsMinistryDialogOpen(false)
      setNewMinistry({ name: "", code: "", description: "" })

      toast({
        title: "Ministry Created",
        description: `${created.name} has been added`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ministry",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMinistry = async (id: string, name: string) => {
    // Remove immediately without confirmation dialog
    try {
      const res = await fetch(`/api/admin/ministries/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete ministry")
      }
      setMinistries(ministries.filter((m) => m.id !== id))

      toast({
        title: "Ministry deleted",
        description: `${name} has been removed successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete ministry",
        variant: "destructive",
      })
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Validation Error",
        description: "Please provide a category name",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newCategory,
          ministries: ministries.map((m) => m.id), // Allow for all ministries by default
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create category")
      }

      const created: ComplaintCategory = await res.json()
      setCategories([...categories, created])
      setIsCategoryDialogOpen(false)
      setNewCategory({ name: "", description: "" })

      toast({
        title: "Category Created",
        description: `${created.name} has been added`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete category")
      }
      setCategories(categories.filter((c) => c.id !== id))

      toast({
        title: "Category Deleted",
        description: `${name} has been removed`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage ministries, categories, and system configuration</p>
        </div>

        <Tabs defaultValue="ministries" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ministries" className="gap-2">
              <Building2 className="h-4 w-4" />
              Ministries
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Ministries Tab */}
          <TabsContent value="ministries">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ministries</CardTitle>
                    <CardDescription>{ministries.length} ministries in the system</CardDescription>
                  </div>

                  <Dialog open={isMinistryDialogOpen} onOpenChange={setIsMinistryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Ministry
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Ministry</DialogTitle>
                        <DialogDescription>Add a new government ministry to the system</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ministryName">Ministry Name *</Label>
                          <Input
                            id="ministryName"
                            value={newMinistry.name}
                            onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
                            placeholder="Ministry of..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="ministryCode">Code *</Label>
                          <Input
                            id="ministryCode"
                            value={newMinistry.code}
                            onChange={(e) => setNewMinistry({ ...newMinistry, code: e.target.value.toUpperCase() })}
                            placeholder="MOX"
                            maxLength={10}
                          />
                        </div>

                        <div>
                          <Label htmlFor="ministryDesc">Description</Label>
                          <Textarea
                            id="ministryDesc"
                            value={newMinistry.description}
                            onChange={(e) => setNewMinistry({ ...newMinistry, description: e.target.value })}
                            placeholder="Brief description of the ministry's responsibilities"
                            rows={3}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMinistryDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateMinistry}>Create Ministry</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ministries.map((ministry) => (
                      <TableRow key={ministry.id}>
                        <TableCell className="font-medium">{ministry.name}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-sm">{ministry.code}</code>
                        </TableCell>
                        <TableCell className="max-w-md">{ministry.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              onClick={() => handleDeleteMinistry(ministry.id, ministry.name)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Complaint Categories</CardTitle>
                    <CardDescription>{categories.length} categories available for complaints</CardDescription>
                  </div>

                  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                        <DialogDescription>Add a new complaint category type</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="categoryName">Category Name *</Label>
                          <Input
                            id="categoryName"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            placeholder="e.g., Service Delay"
                          />
                        </div>

                        <div>
                          <Label htmlFor="categoryDesc">Description</Label>
                          <Textarea
                            id="categoryDesc"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            placeholder="Brief description of this complaint type"
                            rows={3}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCategory}>Create Category</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="max-w-md">{category.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
