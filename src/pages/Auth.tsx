import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const { isAuthenticated, isApproved, isLoading, signIn, signUp } = useAuthContext();
  
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sign In form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  
  // Sign Up form state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpError, setSignUpError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isApproved) {
        navigate("/", { replace: true });
      } else {
        navigate("/pending-approval", { replace: true });
      }
    }
  }, [isAuthenticated, isApproved, isLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await signIn(signInEmail, signInPassword);
    
    if (!error) {
      // Navigation will happen via useEffect
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    
    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Passwords do not match");
      return;
    }
    
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters");
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await signUp(signUpEmail, signUpPassword, signUpFullName);
    
    if (!error) {
      setActiveTab("signin");
      setSignUpEmail("");
      setSignUpPassword("");
      setSignUpConfirmPassword("");
      setSignUpFullName("");
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ClinicPro</CardTitle>
          <CardDescription>
            Clinic Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@clinic.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@clinic.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {signUpError && (
                  <p className="text-sm text-destructive">{signUpError}</p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  New accounts require admin approval before access is granted.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
