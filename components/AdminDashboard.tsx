"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialogProvider, useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toggleBan, updateUserRole, deleteUserCompletely } from "@/lib/actions/admin";
import { toastSuccess, toastError } from "@/lib/toast";
import { Shield, ShieldAlert, Ban, Trash2, CheckCircle, Crown, Search, Users, UserCheck, UserX } from "lucide-react";

interface User {
  id: string;
  username: string;
  role: string;
  isBanned: boolean;
}

// OPTIMIZATION: Memoized UserCard component to prevent re-renders when other users change
const UserCard = memo(({ user, viewerRole, onBan, onPromote, onDelete }: {
  user: User;
  viewerRole: string;
  onBan: (id: string, username: string, isBanned: boolean) => void;
  onPromote: (id: string, currentRole: string, username: string) => void;
  onDelete: (id: string, username: string) => void;
}) => (
  <Card className="flex flex-col md:flex-row items-center justify-between p-4 gap-4 bg-leather-800/50">
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
          user.role === 'OWNER' ? 'bg-warning text-leather-900' :
          user.role === 'ADMIN' ? 'bg-info text-white' : 'bg-leather-600 text-leather-accent'
      }`}>
        {user.role === 'OWNER' ? '👑' : user.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold flex items-center gap-2 text-leather-accent">
          {user.username}
          {user.isBanned && (
            <span className="text-xs bg-danger/20 text-danger-light px-2 py-0.5 rounded border border-danger/30 flex items-center gap-1">
              <Ban size={10} /> BANNED
            </span>
          )}
        </p>
        <p className="text-xs text-leather-500 font-mono">{user.role}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      {/* ADMIN ACTIONS - Ban/Unban */}
      {user.role !== "OWNER" && (
        <Button
          onClick={() => onBan(user.id, user.username, user.isBanned)}
          size="sm"
          className={`${user.isBanned ? 'bg-success hover:bg-success/80' : 'bg-warning hover:bg-warning/90'}`}
          aria-label={user.isBanned ? "Unban User" : "Ban User"}
          title={user.isBanned ? "Unban this user" : "Ban this user"}
        >
          {user.isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
        </Button>
      )}

      {/* OWNER ONLY ACTIONS - Promote/Demote & Delete */}
      {viewerRole === "OWNER" && user.role !== "OWNER" && (
        <>
          <Button
            onClick={() => onPromote(user.id, user.role, user.username)}
            size="sm"
            className="bg-info hover:bg-info/90"
            aria-label={user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
            title={user.role === "ADMIN" ? "Demote to regular user" : "Promote to admin"}
          >
            <Shield size={14} />
          </Button>

          <Button
            onClick={() => onDelete(user.id, user.username)}
            size="sm"
            className="bg-danger hover:bg-danger-hover"
            aria-label="Delete User"
            title="Delete user and all data permanently"
          >
            <Trash2 size={14} />
          </Button>
        </>
      )}
    </div>
  </Card>
));

UserCard.displayName = "UserCard";

// OPTIMIZATION: Memoized AdminDashboardContent to prevent unnecessary re-renders
const AdminDashboardContent = memo(function AdminDashboardContent({ users, viewerRole }: { users: User[], viewerRole: string }) {
  const [userList, setUserList] = useState(users);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN" | "OWNER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "BANNED" | "ACTIVE">("ALL");
  const { confirm } = useConfirmDialog();

  // Filter users based on search and filters
  const filteredUsers = userList.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" ||
      (statusFilter === "BANNED" && user.isBanned) ||
      (statusFilter === "ACTIVE" && !user.isBanned);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const stats = {
    total: userList.length,
    owners: userList.filter(u => u.role === "OWNER").length,
    admins: userList.filter(u => u.role === "ADMIN").length,
    users: userList.filter(u => u.role === "USER").length,
    banned: userList.filter(u => u.isBanned).length,
  };

  const handleBan = async (id: string, username: string, isCurrentlyBanned: boolean) => {
    const confirmed = await confirm({
      title: isCurrentlyBanned ? "Unban User" : "Ban User",
      message: `Are you sure you want to ${isCurrentlyBanned ? "unban" : "ban"} @${username}?`,
      confirmText: isCurrentlyBanned ? "Unban" : "Ban",
      cancelText: "Cancel",
      variant: "warning"
    });

    if (!confirmed) return;

    // Optimistic Update: update UI immediately
    const newBanState = !isCurrentlyBanned;
    setUserList(prev => prev.map(u => u.id === id ? { ...u, isBanned: newBanState } : u));

    try {
      const res = await toggleBan(id);
      if (res?.error) {
        // Revert optimistic update on error
        setUserList(prev => prev.map(u => u.id === id ? { ...u, isBanned: isCurrentlyBanned } : u));
        toastError(res.error);
        return;
      }
      toastSuccess(isCurrentlyBanned ? "User has been unbanned" : "User has been banned");
    } catch (error) {
      // Revert optimistic update on exception
      setUserList(prev => prev.map(u => u.id === id ? { ...u, isBanned: isCurrentlyBanned } : u));
      toastError("Failed to update ban status");
    }
  };

  const handlePromote = async (id: string, currentRole: string, username: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    const confirmed = await confirm({
      title: `${newRole === "ADMIN" ? "Promote" : "Demote"} User`,
      message: `Are you sure you want to ${newRole === "ADMIN" ? "promote" : "demote"} @${username} to ${newRole}?`,
      confirmText: newRole === "ADMIN" ? "Promote" : "Demote",
      cancelText: "Cancel",
      variant: "info"
    });

    if (!confirmed) return;

    // Optimistic Update: update UI immediately
    setUserList(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));

    try {
      const res = await updateUserRole(id, newRole);
      if (res?.error) {
        // Revert optimistic update on error
        setUserList(prev => prev.map(u => u.id === id ? { ...u, role: currentRole } : u));
        toastError(res.error);
        return;
      }
      toastSuccess(`User is now ${newRole}`);
    } catch (error) {
      // Revert optimistic update on exception
      setUserList(prev => prev.map(u => u.id === id ? { ...u, role: currentRole } : u));
      toastError("Failed to update user role");
    }
  };

  const handleDelete = async (id: string, username: string) => {
    const confirmed = await confirm({
      title: "Delete User",
      message: `NUCLEAR WARNING: This will erase @${username} and ALL their data forever. This action cannot be undone.`,
      confirmText: "Delete Forever",
      cancelText: "Cancel",
      variant: "danger"
    });

    if (!confirmed) return;

    // Store user data for potential revert
    const deletedUser = userList.find(u => u.id === id);

    // Optimistic Update: remove from UI immediately
    setUserList(prev => prev.filter(u => u.id !== id));

    try {
      const res = await deleteUserCompletely(id);
      if (res?.error) {
        // Revert optimistic update on error
        if (deletedUser) {
          setUserList(prev => [...prev, deletedUser]);
        }
        toastError(res.error);
        return;
      }
      toastSuccess("User erased from existence.");
    } catch (error) {
      // Revert optimistic update on exception
      if (deletedUser) {
        setUserList(prev => [...prev, deletedUser]);
      }
      toastError("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 bg-leather-800/50 border-leather-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-leather-pop" />
            <div>
              <p className="text-2xl font-bold text-leather-accent">{stats.total}</p>
              <p className="text-xs text-leather-500">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-leather-800/50 border-leather-700">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-warning" />
            <div>
              <p className="text-2xl font-bold text-leather-accent">{stats.owners}</p>
              <p className="text-xs text-leather-500">Owners</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-leather-800/50 border-leather-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-info" />
            <div>
              <p className="text-2xl font-bold text-leather-accent">{stats.admins}</p>
              <p className="text-xs text-leather-500">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-leather-800/50 border-leather-700">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-leather-500" />
            <div>
              <p className="text-2xl font-bold text-leather-accent">{stats.users}</p>
              <p className="text-xs text-leather-500">Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-leather-800/50 border-leather-700">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-danger" />
            <div>
              <p className="text-2xl font-bold text-leather-accent">{stats.banned}</p>
              <p className="text-xs text-leather-500">Banned</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-leather-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 bg-leather-800 border border-leather-700 rounded-lg text-leather-accent placeholder:text-leather-500 focus:outline-none focus:ring-2 focus:ring-leather-pop/50"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="px-4 py-2.5 bg-leather-800 border border-leather-700 rounded-lg text-leather-accent focus:outline-none focus:ring-2 focus:ring-leather-pop/50"
        >
          <option value="ALL">All Roles</option>
          <option value="OWNER">Owners</option>
          <option value="ADMIN">Admins</option>
          <option value="USER">Users</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2.5 bg-leather-800 border border-leather-700 rounded-lg text-leather-accent focus:outline-none focus:ring-2 focus:ring-leather-pop/50"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      {/* Owner Actions Legend */}
      {viewerRole === "OWNER" && (
        <Card className="p-3 bg-info/10 border-info/30">
          <p className="text-sm text-info-light flex items-center gap-2">
            <ShieldAlert size={16} />
            <span className="font-bold">Owner Mode:</span> You can promote/demote admins and permanently delete users.
          </p>
        </Card>
      )}

      {/* User List */}
      <div className="space-y-4">
        <p className="text-sm text-leather-500">
          Showing {filteredUsers.length} of {userList.length} users
        </p>

        {filteredUsers.length === 0 ? (
          <Card className="p-8 text-center bg-leather-800/50 border-leather-700">
            <Users className="w-12 h-12 text-leather-600 mx-auto mb-4" />
            <p className="text-leather-accent font-bold mb-2">No users found</p>
            <p className="text-sm text-leather-500">
              {searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "No users exist yet."}
            </p>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              viewerRole={viewerRole}
              onBan={handleBan}
              onPromote={handlePromote}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
});

AdminDashboardContent.displayName = "AdminDashboardContent";

// Wrapper component that provides the ConfirmDialog context
// NOTE: Since ConfirmDialogProvider is now in root layout, this wrapper is redundant
// but kept for backwards compatibility
export default function AdminDashboard({ users, viewerRole }: { users: User[], viewerRole: string }) {
  return (
    <AdminDashboardContent users={users} viewerRole={viewerRole} />
  );
}

