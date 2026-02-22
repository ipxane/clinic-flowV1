import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarClock,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/patients", icon: Users, label: "Patients" },
  { to: "/services", icon: Stethoscope, label: "Services" },
  { to: "/booking-requests", icon: CalendarClock, label: "Booking Requests" },
  { to: "/appointments", icon: Calendar, label: "Appointments" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary shadow-sm">
            <Building2 className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base tracking-tight text-sidebar-foreground">
              Clinic Pro
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0 transition-colors",
              "group-hover:text-sidebar-foreground"
            )} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
            collapsed ? "justify-center px-0" : "justify-start px-3"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
