import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const titles = [
  { match: "/admin/flagged", label: "Flagged Sessions" },
  { match: "/admin/replay", label: "Session Replay" },
  { match: "/admin/users", label: "Users & Roles" },
  { match: "/admin/agents", label: "AI Agents" },
  { match: "/admin/agent-config", label: "AI Agent Builder" },
  { match: "/admin/audit-logs", label: "Audit Logs" },
  { match: "/admin/system-health", label: "System Health" },
  { match: "/admin", label: "Live Monitor" },
];

export default function AdminTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const entry =
    titles.find(
      (t) => location.pathname === t.match || location.pathname.startsWith(t.match + "/")
    ) || titles[titles.length - 1];

  return (
    <div className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center gap-3 px-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="h-5 w-px bg-border" />
      <div className="font-display text-sm font-semibold">{entry.label}</div>
      <div className="flex-1" />
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> operational
        <span className="ml-1.5">{now.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}