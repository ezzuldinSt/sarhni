"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialogProvider, useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toggleBan, updateUserRole, deleteUserCompletely } from "@/lib/actions/admin";
import { toastSuccess, toastError } from "@/lib/toast";
import { Shield, ShieldAlert, Ban, Trash2, CheckCircle } from "lucide-react";

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
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          user.role === 'OWNER' ? 'bg-warning text-leather-900' :
          user.role === 'ADMIN' ? 'bg-danger text-white' : 'bg-leather-600'
      }`}>
        {user.role === 'OWNER' ? '👑' : user.username[0].toUpperCase()}
      </div>
      <div>
        <p className="font-bold flex items-center gap-2">
          {user.username}
          {user.isBanned && <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">BANNED</span>}
        </p>
        <p className="text-xs text-leather-500 font-mono">{user.role}</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {/* ADMIN ACTIONS */}
      {user.role !== "OWNER" && (
        <Button
          onClick={() => onBan(user.id, user.username, user.isBanned)}
          size="sm"
          className={`${user.isBanned ? 'bg-success hover:bg-success/80' : 'bg-warning hover:bg-warning/90'}`}
          aria-label={user.isBanned ? "Unban User" : "Ban User"}
        >
          {user.isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
        </Button>
      )}

      {/* OWNER ONLY ACTIONS */}
      {viewerRole === "OWNER" && user.role !== "OWNER" && (
        <>
          <Button
            onClick={() => onPromote(user.id, user.role, user.username)}
            size="sm"
            className="bg-info hover:bg-info/90"
            aria-label={user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
          >
            <Shield size={14} />
          </Button>

          <Button
            onClick={() => onDelete(user.id, user.username)}
            size="sm"
            className="bg-danger hover:bg-danger-hover"
            aria-label="Delete User"
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
  const { confirm } = useConfirmDialog();

  const handleBan = async (id: string, username: string, isCurrentlyBanned: boolean) => {
    const confirmed = await confirm({
      title: isCurrentlyBanned ? "Unban User" : "Ban User",
      message: `Are you sure you want to ${isCurrentlyBanned ? "unban" : "ban"} @${username}?`,
      confirmText: isCurrentlyBanned ? "Unban" : "Ban",
      cancelText: "Cancel",
      variant: "warning"
    });

    if (!confirmed) return;

    const res = await toggleBan(id);
    if (res?.error) return toastError(res.error);

    // Optimistic Update
    setUserList(prev => prev.map(u => u.id === id ? { ...u, isBanned: !u.isBanned } : u));
    toastSuccess("User status updated");
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

    const res = await updateUserRole(id, newRole);
    if (res?.error) return toastError(res.error);

    setUserList(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    toastSuccess(`User is now ${newRole}`);
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

    const res = await deleteUserCompletely(id);
    if (res?.error) return toastError(res.error);

    setUserList(prev => prev.filter(u => u.id !== id));
    toastSuccess("User erased from existence.");
  };

  return (
    <div className="space-y-4">
      {userList.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          viewerRole={viewerRole}
          onBan={handleBan}
          onPromote={handlePromote}
          onDelete={handleDelete}
        />
      ))}
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

