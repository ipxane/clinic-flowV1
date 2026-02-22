import { Bell, Search, LogOut, User, Settings as SettingsIcon, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

export function Header() {
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuthContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    doctor: "Doctor",
    staff: "Staff",
    pending: "Pending",
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-8 shadow-sm z-10">
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients, appointments..."
            className="w-80 pl-10 h-10 border-border/60 bg-muted/20 focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-muted">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background">
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 mt-2 p-0 overflow-hidden rounded-lg shadow-xl border-border">
            <div className="flex items-center justify-between p-4 bg-muted/30">
              <DropdownMenuLabel className="p-0 font-bold text-sm">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary font-semibold hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto divide-y divide-border/40">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start gap-1.5 p-4 cursor-pointer focus:bg-accent/50 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      markAsRead(notification.id);
                      navigate("/booking-requests");
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-bold text-sm">{notification.title}</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/90 leading-relaxed pl-4">
                      {notification.description}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem
              className="justify-center p-3 text-sm text-primary font-bold bg-muted/20 hover:bg-muted/40 cursor-pointer"
              onClick={() => navigate("/booking-requests")}
            >
              View all requests
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-8 w-px bg-border/40 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2 py-1.5 h-auto hover:bg-muted group transition-all">
              <Avatar className="h-9 w-9 border-2 border-border/10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(profile?.full_name || null)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{profile?.full_name || "User"}</p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {role ? roleLabels[role] : "Staff"}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 mt-2 p-1 rounded-lg shadow-xl border-border">
            <DropdownMenuLabel className="p-3 font-normal">
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="text-sm font-bold leading-none">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{profile?.email}</p>
                </div>
                <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-wider font-bold h-5 bg-muted/60 text-muted-foreground border-none">
                  {role ? roleLabels[role] : "Staff"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-1" />
            <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-md mx-1 my-0.5 p-2 font-medium">
              <SettingsIcon className="mr-3 h-4 w-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-1" />
            <DropdownMenuItem onClick={handleSignOut} className="rounded-md mx-1 my-0.5 p-2 font-medium text-destructive focus:bg-destructive/5 focus:text-destructive">
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
