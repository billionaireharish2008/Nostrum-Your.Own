import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { displayRole } from "@/lib/roles";
import {
  ShieldAlert, Activity, Flag, History, Users, Bot, ScrollText, SlidersHorizontal, Server, LogOut, ArrowLeft, Receipt, Inbox,
} from "lucide-react";
import AdminTopbar from "@/components/AdminTopbar";
import AIAssistant from "@/components/AIAssistant";

const sections = [
  { label: "Live Monitor", icon: Activity, to: "/admin", end: true },
  { label: "Flagged Sessions", icon: Flag, to: "/admin/flagged" },
  { label: "Session Replay", icon: History, to: "/admin/replay" },
  { label: "Transactions", icon: Receipt, to: "/admin/transactions" },
  { label: "User Reports", icon: Inbox, to: "/admin/reports" },
  { label: "Users & Roles", icon: Users, to: "/admin/users" },
  { label: "AI Agents", icon: Bot, to: "/admin/agents" },
  { label: "AI Agent Builder", icon: SlidersHorizontal, to: "/admin/agent-config" },
  { label: "Audit Logs", icon: ScrollText, to: "/admin/audit-logs" },
  { label: "System Health", icon: Server, to: "/admin/system-health" },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <div className="leading-tight">
            <div className="font-display font-semibold text-sm">Nostrum</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">SOC console</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sections.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors " +
                (isActive
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60")
              }
            >
              <s.icon className="w-4 h-4" />
              <span className="flex-1">{s.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium truncate">{user?.email}</div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-mono">{displayRole(user)}</div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Customer view
          </button>
          <button
            onClick={() => base44.auth.logout("/login")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <AdminTopbar />
        <Outlet />
      </main>

      <AIAssistant />
    </div>
  );
}