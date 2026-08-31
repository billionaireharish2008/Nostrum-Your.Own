import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Server, Database, Activity, AlertTriangle, Users, Wallet, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";

const latencyTone = (ms) => (ms < 200 ? "text-primary" : ms < 500 ? "text-amber-400" : "text-destructive");

function Metric({ icon: Icon, label, value, tone, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className={"mt-1 font-display text-2xl font-semibold " + (tone || "text-foreground")}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{sub}</div>}
    </div>
  );
}

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("systemHealth", {});
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [load]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-semibold flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" /> System Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live infrastructure overview — refreshes every 15 seconds.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={"w-3.5 h-3.5 " + (loading ? "animate-spin" : "")} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm mb-4">
          Failed to load health data: {error}
        </div>
      )}

      {!data && loading && <div className="p-10 text-center text-sm text-muted-foreground">Sampling system metrics…</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Metric
              icon={Clock}
              label="DB latency"
              value={`${data.dbLatencyMs}ms`}
              tone={latencyTone(data.dbLatencyMs)}
              sub="round-trip probe"
            />
            <Metric icon={Database} label="Active connections" value={data.activeConnections} sub="live sessions" />
            <Metric
              icon={AlertTriangle}
              label="Flagged sessions"
              value={data.flaggedSessions}
              tone={data.flaggedSessions > 0 ? "text-destructive" : "text-foreground"}
              sub="blocked / flagged"
            />
            <Metric icon={Activity} label="Events captured" value={data.totalEvents} sub={`${data.totalSessions} sessions`} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Metric icon={Users} label="Users" value={data.totalUsers} />
            <Metric icon={Wallet} label="Accounts" value={data.totalAccounts} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                event throughput · last 12h
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> events</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> errors</span>
              </span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.eventBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="evt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="err" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#evt)" />
                  <Area type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#err)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                recent system errors
              </span>
            </div>
            <div className="divide-y divide-border max-h-[40vh] overflow-y-auto">
              {data.recentErrors.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">No recent errors. All systems nominal.</div>
              )}
              {data.recentErrors.map((e) => (
                <div key={e.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs font-mono">
                  <div className="col-span-3 text-muted-foreground">
                    {e.event_time ? new Date(e.event_time).toLocaleTimeString() : "—"}
                  </div>
                  <div className="col-span-2 text-muted-foreground truncate">{e.ip || "—"}</div>
                  <div className="col-span-4 text-destructive">{e.action_type}</div>
                  <div className="col-span-3 text-muted-foreground truncate text-right">
                    {(e.user_id || "").slice(-8) || "anon"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}