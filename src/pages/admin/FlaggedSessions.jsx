import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Flag, ShieldCheck, Ban, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusBadge = (s) => {
  const map = {
    flagged: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    blocked: "bg-destructive/15 text-destructive border-destructive/30",
    watching: "bg-primary/15 text-primary border-primary/30",
    ended: "bg-muted text-muted-foreground border-border",
  };
  return map[s] || map.ended;
};

const riskTone = (r) => (r >= 70 ? "bg-destructive" : r >= 40 ? "bg-amber-400" : "bg-primary");

export default function FlaggedSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Session.list("-created_date", 100);
      setSessions(all.filter((s) => s.status === "flagged" || s.status === "blocked"));
    } catch {
      toast({ title: "Failed to load sessions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await base44.entities.Session.update(id, { status });
      setSessions((p) =>
        p
          .map((s) => (s.id === id ? { ...s, status } : s))
          .filter((s) => s.status === "flagged" || s.status === "blocked")
      );
      toast({ title: "Session updated", description: `Status set to ${status}` });
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Flag className="w-5 h-5 text-amber-400" /> Flagged Sessions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sessions flagged or blocked by adaptive risk scoring. Review and take action.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {sessions.length} flagged · blocked sessions
          </span>
        </div>
        <div className="divide-y divide-border">
          {loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          )}
          {!loading && sessions.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No flagged or blocked sessions. All clear.
            </div>
          )}
          {!loading &&
            sessions.map((s) => (
              <div key={s.id} className="px-4 py-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <div className="font-mono text-sm truncate">{(s.user_id || "").slice(-8) || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.ip || "—"}</div>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                      <div className={"h-full " + riskTone(s.risk_score || 0)} style={{ width: `${Math.min(100, s.risk_score || 0)}%` }} />
                    </div>
                    <span className="font-mono text-xs">{Math.round(s.risk_score || 0)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {s.started_at ? new Date(s.started_at).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className={statusBadge(s.status)}>{s.status}</Badge>
                </div>
                <div className="col-span-4 flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "watching")}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Unflag
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "blocked")}>
                    <Ban className="w-3.5 h-3.5" /> Block
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "ended")}>
                    <Power className="w-3.5 h-3.5" /> End
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}