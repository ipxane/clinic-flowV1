import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, Profile } from "@/hooks/useAuth";

export interface UserWithRole extends Profile {
  role: AppRole;
}

export function useUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all profiles (admin only - RLS will handle this)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role as AppRole) || "pending",
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Approve a user and assign a role
  const approveUser = async (userId: string, role: AppRole) => {
    try {
      // Update profile to approved
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      // Update or insert role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (roleError) throw roleError;

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId
            ? { ...user, is_approved: true, approved_at: new Date().toISOString(), role }
            : user
        )
      );

      toast({
        title: "User approved",
        description: `User has been approved as ${role}.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error approving user:", error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;

      // If changing to pending, also revoke approval
      if (role === "pending") {
        await supabase
          .from("profiles")
          .update({ is_approved: false })
          .eq("user_id", userId);
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId
            ? { ...user, role, is_approved: role !== "pending" ? user.is_approved : false }
            : user
        )
      );

      toast({
        title: "Role updated",
        description: `User role changed to ${role}.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
      return false;
    }
  };

  // Revoke user approval
  const revokeApproval = async (userId: string) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_approved: false })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      // Set role to pending
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: "pending" })
        .eq("user_id", userId);

      if (roleError) throw roleError;

      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId
            ? { ...user, is_approved: false, role: "pending" }
            : user
        )
      );

      toast({
        title: "Access revoked",
        description: "User access has been revoked.",
      });

      return true;
    } catch (error: any) {
      console.error("Error revoking approval:", error);
      toast({
        title: "Error",
        description: "Failed to revoke user access",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get counts
  const pendingCount = users.filter((u) => !u.is_approved || u.role === "pending").length;
  const approvedCount = users.filter((u) => u.is_approved && u.role !== "pending").length;

  return {
    users,
    isLoading,
    approveUser,
    updateUserRole,
    revokeApproval,
    refetch: fetchUsers,
    pendingCount,
    approvedCount,
  };
}
