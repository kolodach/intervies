"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Shield, ShieldOff, Search, X, ArrowUpDown, ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  is_admin: boolean | null;
  created_at: string;
  subscription_status: string;
  interview_count: number;
  total_cost: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: User | null;
    newAdminStatus: boolean;
  }>({ open: false, user: null, newAdminStatus: false });
  const [updating, setUpdating] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState<"all" | "admin" | "user">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "active" | "trialing" | "canceled">("all");

  // Sorting state
  const [sortBy, setSortBy] = useState<"created_at" | "total_cost" | null>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = users.filter((user) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower);

      // Admin filter
      const matchesAdmin =
        adminFilter === "all" ||
        (adminFilter === "admin" && user.is_admin) ||
        (adminFilter === "user" && !user.is_admin);

      // Plan filter
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "free" && (user.subscription_status === "none" || !user.subscription_status)) ||
        (planFilter === "active" && user.subscription_status === "active") ||
        (planFilter === "trialing" && user.subscription_status === "trialing") ||
        (planFilter === "canceled" && user.subscription_status === "canceled");

      return matchesSearch && matchesAdmin && matchesPlan;
    });

    // Sort
    if (sortBy) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "created_at") {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === "total_cost") {
          comparison = a.total_cost - b.total_cost;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [users, searchQuery, adminFilter, planFilter, sortBy, sortOrder]);

  function toggleSort(column: "created_at" | "total_cost") {
    if (sortBy === column) {
      // Toggle order or clear
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else {
        setSortBy(null);
      }
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  }

  function SortIcon({ column }: { column: "created_at" | "total_cost" }) {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortOrder === "desc" ? (
      <ArrowDown className="ml-1 h-3 w-3" />
    ) : (
      <ArrowUp className="ml-1 h-3 w-3" />
    );
  }

  const hasActiveFilters = searchQuery !== "" || adminFilter !== "all" || planFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setAdminFilter("all");
    setPlanFilter("all");
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleAdminToggle(user: User, newStatus: boolean) {
    setConfirmDialog({
      open: true,
      user,
      newAdminStatus: newStatus,
    });
  }

  async function confirmAdminToggle() {
    const { user, newAdminStatus } = confirmDialog;
    if (!user) return;

    setConfirmDialog({ open: false, user: null, newAdminStatus: false });
    setUpdating(user.id);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: newAdminStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_admin: newAdminStatus } : u
        )
      );

      toast.success(
        newAdminStatus
          ? `${user.name || user.email} is now an admin`
          : `${user.name || user.email} is no longer an admin`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdating(null);
    }
  }

  function getInitials(user: User): string {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() ?? "?";
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getSubscriptionBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Pro</Badge>;
      case "trialing":
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Past Due</Badge>;
      case "canceled":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Canceled</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load users</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts and admin permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.is_admin).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pro Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.subscription_status === "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>

              {/* Admin Filter */}
              <Select value={adminFilter} onValueChange={(v) => setAdminFilter(v as typeof adminFilter)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>

              {/* Plan Filter */}
              <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="active">Pro</SelectItem>
                  <SelectItem value="trialing">Trial</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Interviews</TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => toggleSort("total_cost")}
                    className="inline-flex items-center hover:text-foreground transition-colors"
                  >
                    AI Cost
                    <SortIcon column="total_cost" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("created_at")}
                    className="inline-flex items-center hover:text-foreground transition-colors"
                  >
                    Joined
                    <SortIcon column="created_at" />
                  </button>
                </TableHead>
                <TableHead className="text-center">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {hasActiveFilters ? "No users match your filters" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : null}
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.name || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{getSubscriptionBadge(user.subscription_status)}</TableCell>
                  <TableCell className="text-center">
                    {user.interview_count > 0 ? (
                      <Button variant="ghost" size="sm" className="h-7 px-2 font-mono" asChild>
                        <Link href={`/admin/users/${user.id}/interviews`}>
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          {user.interview_count}
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground font-mono">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-400">
                    ${user.total_cost.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {updating === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={user.is_admin ?? false}
                          onCheckedChange={(checked) =>
                            handleAdminToggle(user, checked)
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, user: null, newAdminStatus: false })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.newAdminStatus ? (
                <Shield className="h-5 w-5 text-emerald-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-amber-500" />
              )}
              {confirmDialog.newAdminStatus ? "Grant Admin Access" : "Revoke Admin Access"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.newAdminStatus ? (
                <>
                  Are you sure you want to make{" "}
                  <span className="font-medium text-foreground">
                    {confirmDialog.user?.name || confirmDialog.user?.email}
                  </span>{" "}
                  an admin? They will have full access to the admin dashboard.
                </>
              ) : (
                <>
                  Are you sure you want to remove admin access from{" "}
                  <span className="font-medium text-foreground">
                    {confirmDialog.user?.name || confirmDialog.user?.email}
                  </span>
                  ? They will no longer have access to the admin dashboard.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAdminToggle}>
              {confirmDialog.newAdminStatus ? "Grant Access" : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

