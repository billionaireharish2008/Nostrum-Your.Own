import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Clock, MapPin } from "lucide-react";

const riskColor = (action) => {
  if (action === "unauthorized_admin_access" || action === "blocked_attempt") return "text-destructive";
  if (action === "login_attempt" || action === "transfer") return "text-amber-400";
  return "text-primary";
};

const dotColor = (action) => {
  if (action === "unauthorized_admin_access" || action === "blocked_attempt") return "bg-destructive";
  if (action === "login_attempt" || action === "transfer") return "bg-amber-400";
  return "bg-primary";
};

export default function AdminHome() {
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [evs, sess] = await Promise.all([
          base44.entities.SessionEvent.list("-event_time", 80),
          base44.entities.Session.list("-created_date", 50),
        ]);
        if (mounted) {
          setEvents(evs);
          setSessions(sess);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    load();
    const unsub = base44.entities.SessionEvent.subscribe((event) => {
      if (event.type === "create") setEvents((p) => [event.data, ...p].slice(0, 80));
    });
    return () => {
      mounted = false;
      unsub && unsub();
    };
  }, []);

  const flagged = sessions.filter((s) => s.status === "flagged" || s.status === "blocked");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Live Monitor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Realtime feed of session telemetry. Flagged sessions and replay land here in the next build.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Events captured" value={events.length} />
        <Stat label="Active sessions" value={sessions.filter((s) => s.status === "watching").length} />
        <Stat label="Flagged / blocked" value={flagged.length} accent />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            session_events · live
          </span>
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> streaming
          </span>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading telemetry…</div>
          )}
          {!loading && events.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No events yet.</div>
          )}
          {events.map((e) => (
            <div key={e.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs font-mono">
              <div className="col-span-3 text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {e.event_time ? new Date(e.event_time).toLocaleTimeString() : "—"}
              </div>
              <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{e.ip || "—"}</span>
              </div>
              <div className="col-span-2 text-muted-foreground truncate">{(e.session_id || "").slice(-8) || "—"}</div>
              <div className="col-span-3 flex items-center gap-2">
                <span className={"w-1.5 h-1.5 rounded-full " + dotColor(e.action_type)} />
                <span className={riskColor(e.action_type)}>{e.action_type}</span>
              </div>
              <div className="col-span-2 text-muted-foreground truncate text-right">
                {e.user_id ? e.user_id.slice(-6) : "anon"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className={"mt-1 font-display text-2xl font-semibold " + (accent ? "text-destructive" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
