import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { isAuthenticated, isApproved, isLoading, signOut, refreshUserData, profile } = useAuthContext();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Redirect if approved - this will now be triggered by realtime updates
  useEffect(() => {
    if (!isLoading && isAuthenticated && isApproved) {
      navigate("/", { replace: true });
    }
  }, [isApproved, isLoading, isAuthenticated, navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    // Navigate after sign out completes
    navigate("/auth", { replace: true });
  }, [signOut, navigate]);

  const handleRefresh = useCallback(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking your status...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if approved (will redirect)
  if (isApproved) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl">Pending Approval</CardTitle>
          <CardDescription>
            Your account is waiting for admin approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Hello{profile?.full_name ? `, ${profile.full_name}` : ""}! Your account has been created successfully.
            An administrator will review and approve your access soon.
          </p>
          
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            This page will automatically update when your account is approved.
          </p>
          
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Status
            </Button>
            <Button onClick={handleSignOut} variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground pt-2">
            Need help? Contact your clinic administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
