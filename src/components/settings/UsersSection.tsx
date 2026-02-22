import { useState } from "react";
import { Check, X, MoreHorizontal, Shield, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUsers, UserWithRole } from "@/hooks/useUsers";
import { AppRole } from "@/hooks/useAuth";
import { useAuthContext } from "@/contexts/AuthContext";

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  doctor: "Doctor",
  staff: "Staff",
  pending: "Pending",
};

const roleBadgeVariants: Record<AppRole, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "default",
  doctor: "secondary",
  staff: "outline",
  pending: "destructive",
};

export function UsersSection() {
  const { user: currentUser } = useAuthContext();
  const { users, isLoading, approveUser, updateUserRole, revokeApproval, pendingCount, approvedCount } = useUsers();
  
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingUsers = users.filter((u) => !u.is_approved || u.role === "pending");
  const approvedUsers = users.filter((u) => u.is_approved && u.role !== "pending");

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "??";
  };

  const handleApproveClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole("staff");
    setIsApproveDialogOpen(true);
  };

  const handleRevokeClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsRevokeDialogOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    await approveUser(selectedUser.user_id, selectedRole);
    setIsSubmitting(false);
    setIsApproveDialogOpen(false);
    setSelectedUser(null);
  };

  const confirmRevoke = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    await revokeApproval(selectedUser.user_id);
    setIsSubmitting(false);
    setIsRevokeDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = async (user: UserWithRole, newRole: AppRole) => {
    await updateUserRole(user.user_id, newRole);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const renderUserRow = (user: UserWithRole, showApproveAction: boolean) => (
    <div
      key={user.id}
      className="flex items-center justify-between rounded-lg border border-border p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(user.full_name, user.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.full_name || "Unnamed User"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge variant={roleBadgeVariants[user.role]}>
          {roleLabels[user.role]}
        </Badge>
        
        {showApproveAction ? (
          <Button size="sm" onClick={() => handleApproveClick(user)}>
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
        ) : (
          // Don't show actions for current user (can't revoke yourself)
          user.user_id !== currentUser?.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange(user, "admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange(user, "doctor")}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Set as Doctor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange(user, "staff")}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Set as Staff
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleRevokeClick(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Revoke Access
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage staff accounts and access permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-3">
              {pendingUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending approval requests.
                </p>
              ) : (
                pendingUsers.map((user) => renderUserRow(user, true))
              )}
            </TabsContent>
            
            <TabsContent value="approved" className="space-y-3">
              {approvedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No approved users.
                </p>
              ) : (
                approvedUsers.map((user) => renderUserRow(user, false))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User</DialogTitle>
            <DialogDescription>
              Approve {selectedUser?.full_name || selectedUser?.email} and assign a role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Assign Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={isSubmitting}>
              {isSubmitting ? "Approving..." : "Approve User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access for {selectedUser?.full_name || selectedUser?.email}?
              They will need to be approved again to access the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRevoke} disabled={isSubmitting}>
              {isSubmitting ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
