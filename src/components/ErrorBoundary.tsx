import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or refresh the page.
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3 font-mono max-w-full overflow-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={this.handleRetry}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleRefresh}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
