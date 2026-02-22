import { useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "admin" | "doctor" | "staff" | "pending";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const isMountedRef = useRef(true);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fetchInProgressRef = useRef(false);

  // Fetch user profile and role with timeout protection
  const fetchUserData = useCallback(async (userId: string): Promise<boolean> => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      return false;
    }
    fetchInProgressRef.current = true;

    // Add timeout to prevent infinite loading if Supabase is slow
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Fetch timeout")), 10000)
    );

    try {
      // Fetch profile and role in parallel with timeout
      const [profileResult, roleResult] = await Promise.race([
        Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()
        ]),
        timeoutPromise
      ]) as [any, any];

      if (!isMountedRef.current) {
        fetchInProgressRef.current = false;
        return false;
      }

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
      } else {
        setProfile(profileResult.data);
      }

      if (roleResult.error) {
        console.error("Error fetching role:", roleResult.error);
      } else if (roleResult.data) {
        setRole(roleResult.data.role);
      } else {
        // No role found - set to null
        setRole(null);
      }

      setIsUserDataLoaded(true);
      fetchInProgressRef.current = false;
      return true;
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Always mark as loaded even on error to prevent infinite loading
      if (isMountedRef.current) {
        setIsUserDataLoaded(true);
      }
      fetchInProgressRef.current = false;
      return false;
    }
  }, []);

  // Subscribe to realtime profile and role changes
  const subscribeToUserChanges = useCallback((userId: string) => {
    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`user-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setProfile(payload.new as Profile);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setRole((payload.new as UserRole).role);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, []);

  // Cleanup realtime subscription
  const unsubscribeFromUserChanges = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    isMountedRef.current = true;
    let initialLoadComplete = false;
    let initializationStarted = false;

    // Helper to handle user data loading
    const handleUserSession = async (currentSession: Session | null) => {
      if (!isMountedRef.current) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserData(currentSession.user.id);
        if (isMountedRef.current) {
          subscribeToUserChanges(currentSession.user.id);
        }
      } else {
        // No user - ensure we mark as loaded
        setProfile(null);
        setRole(null);
        setIsUserDataLoaded(true);
        unsubscribeFromUserChanges();
      }

      if (isMountedRef.current) {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMountedRef.current) return;

        // Skip the initial event if we haven't finished initial load
        // This prevents double-processing
        if (!initialLoadComplete && event === "INITIAL_SESSION") {
          return;
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
          setProfile(null);
          setRole(null);
          setIsUserDataLoaded(true);
          unsubscribeFromUserChanges();
          if (isMountedRef.current) {
            setIsLoading(false);
          }
          return;
        }

        await handleUserSession(currentSession);
      }
    );

    // Check for existing session on mount - with debounce protection
    const initializeSession = async () => {
      if (initializationStarted) return;
      initializationStarted = true;

      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;
        
        await handleUserSession(existingSession);
      } catch (error) {
        console.error("Error getting session:", error);
        // On error, still mark as loaded to prevent infinite loading
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsUserDataLoaded(true);
        }
      } finally {
        initialLoadComplete = true;
      }
    };

    initializeSession();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
      unsubscribeFromUserChanges();
    };
  }, [fetchUserData, subscribeToUserChanges, unsubscribeFromUserChanges]);

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Your account has been created. Please wait for admin approval.",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have signed in successfully.",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Clear local state first to prevent UI flash
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setIsUserDataLoaded(false);
      unsubscribeFromUserChanges();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      // Profile will be updated via realtime subscription
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  // Refresh user data manually
  const refreshUserData = useCallback(() => {
    if (user) {
      fetchUserData(user.id);
    }
  }, [user, fetchUserData]);

  // Only consider fully loaded when both auth and user data are loaded
  const isFullyLoaded = !isLoading && (user ? isUserDataLoaded : true);
  
  const isAuthenticated = !!user && !!session;
  const isApproved = isAuthenticated && profile?.is_approved === true && role !== "pending";
  const isAdmin = isApproved && role === "admin";

  return {
    user,
    session,
    profile,
    role,
    isLoading: !isFullyLoaded,
    isAuthenticated,
    isApproved,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshUserData,
  };
}
