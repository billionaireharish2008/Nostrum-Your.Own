import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Flag, Sparkles, Loader2, Search } from "lucide-react";

const statusTone = {
  open: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  reviewing: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  resolved: "bg-primary/15 text-primary border-primary/30",
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiBusy, setAiBusy] = useState(null);
  const [aiResult, setAiResult] = useState({});
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.SuspiciousReport.list("-created_date", 200);
      setReports(all);
    } catch (e) {
      toast({ title: "Failed to load reports", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await base44.entities.SuspiciousReport.update(id, { status });
      setReports((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
      toast({ title: "Report updated", description: `Status: ${status}` });
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const runAI = async (report) => {
    setAiBusy(report.id);
    try {
      const res = await base44.functions.invoke("analyzeReport", {
        description: report.description,
      });
      const text = (res.data && res.data.analysis) || "No analysis returned.";
      setAiResult((p) => ({ ...p, [report.id]: text }));
    } catch (e) {
      toast({ title: "AI analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAiBusy(null);
    }
  };

  const visible = reports.filter((r) => (filter === "all" ? true : r.status === filter));

  const counts = {
    open: reports.filter((r) => r.status === "open").length,
    reviewing: reports.filter((r) => r.status === "reviewing").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Flag className="w-5 h-5 text-amber-400" /> User Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review suspicious-activity reports submitted by customers. Use AI to triage and suggest resolutions.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Total" value={reports.length} />
        <Stat label="Open" value={counts.open} tone="text-amber-400" />
        <Stat label="Reviewing" value={counts.reviewing} tone="text-sky-400" />
        <Stat label="Resolved" value={counts.resolved} tone="text-primary" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reports</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading reports…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No reports in this view.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={statusTone[r.status] || statusTone.open}>{r.status}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(r.created_date).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{r.description}</p>
                  </div>
                </div>

                {aiResult[r.id] && (
                  <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI Triage & Suggested Resolution
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{aiResult[r.id]}</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Set status:</span>
                  <Select value={r.status} onValueChange={(s) => setStatus(r.id, s)}>
                    <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">open</SelectItem>
                      <SelectItem value="reviewing">reviewing</SelectItem>
                      <SelectItem value="resolved">resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={aiBusy === r.id}
                  onClick={() => runAI(r)}
                >
                  {aiBusy === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span className="ml-1">{aiBusy === r.id ? "Analyzing…" : "AI Assist"}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className={"text-2xl font-display font-semibold " + (tone || "")}>{value}</div>
    </div>
  );
}