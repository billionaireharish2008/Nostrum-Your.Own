import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { History, Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const actionTone = (a) => {
  if (a === "unauthorized_admin_access" || a === "blocked_attempt") return "text-destructive";
  if (a === "login_attempt" || a === "transfer") return "text-amber-400";
  return "text-primary";
};

export default function SessionReplay() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    base44.entities.Session.list("-created_date", 100).then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingEvents(true);
    setPlaying(false);
    setCursor(0);
    setEvents([]);
    (async () => {
      const [evs, sess] = await Promise.all([
        base44.entities.SessionEvent.filter({ session_id: selected }),
        base44.entities.Session.get(selected).catch(() => null),
      ]);
      evs.sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
      setEvents(evs);
      setSession(sess);
      setLoadingEvents(false);
    })();
  }, [selected]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= events.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setCursor((c) => c + 1), 850);
    return () => clearTimeout(t);
  }, [playing, cursor, events.length]);

  const reset = () => {
    setPlaying(false);
    setCursor(0);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-primary" /> Session Replay
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Step through a session's telemetry timeline event by event.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">sessions</span>
          </div>
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {sessions.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No sessions.</div>}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={
                  "w-full text-left px-4 py-3 transition-colors " +
                  (selected === s.id ? "bg-accent" : "hover:bg-accent/40")
                }
              >
                <div className="font-mono text-xs truncate">{(s.user_id || "").slice(-8) || "anon"}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {s.ip || "—"} · risk {Math.round(s.risk_score || 0)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          {!selected && (
            <div className="p-10 text-center text-sm text-muted-foreground">Select a session to replay.</div>
          )}
          {selected && (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="font-mono text-xs text-muted-foreground">
                  session {(selected || "").slice(-8)} · risk {Math.round(session?.risk_score || 0)} · {session?.status || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPlaying((p) => !p)} disabled={loadingEvents || events.length === 0}>
                    {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {playing ? "Pause" : "Play"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCursor((c) => Math.min(events.length, c + 1))} disabled={loadingEvents || cursor >= events.length}>
                    <SkipForward className="w-3.5 h-3.5" /> Step
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reset} disabled={loadingEvents}>
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {loadingEvents && <div className="text-sm text-muted-foreground">Loading events…</div>}
                {!loadingEvents && events.length === 0 && (
                  <div className="text-sm text-muted-foreground">No events recorded for this session.</div>
                )}
                <div className="relative pl-6 space-y-3">
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                  {events.slice(0, cursor).map((e, i) => (
                    <div key={e.id || i} className="relative">
                      <span className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-xs font-mono text-muted-foreground">
                        {e.event_time ? new Date(e.event_time).toLocaleTimeString() : "—"} · {e.ip || "—"}
                      </div>
                      <div className={"text-sm font-medium " + actionTone(e.action_type)}>{e.action_type}</div>
                      {e.payload && Object.keys(e.payload).length > 0 && (
                        <pre className="mt-1 text-[10px] font-mono text-muted-foreground bg-background/60 rounded p-2 overflow-x-auto">
                          {JSON.stringify(e.payload, null, 0)}
                        </pre>
                      )}
                    </div>
                  ))}
                  {!loadingEvents && cursor < events.length && (
                    <div className="text-xs text-muted-foreground font-mono pl-0.5">
                      {cursor} / {events.length} events
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}