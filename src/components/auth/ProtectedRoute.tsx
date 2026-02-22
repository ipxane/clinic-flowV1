import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const MAX_LOADING_TIME = 15000; // 15 seconds max loading

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isApproved, isAdmin, isLoading } = useAuthContext();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("Protected route loading timeout reached");
        setLoadingTimeout(true);
      }
    }, MAX_LOADING_TIME);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Show loading spinner while checking auth state (with timeout protection)
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If loading timed out, show error with retry option
  if (loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Loading Timeout</h2>
          <p className="text-sm text-muted-foreground">
            The application is taking too long to load. This might be due to network issues.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to pending approval if authenticated but not approved
  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Redirect to home if admin is required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
