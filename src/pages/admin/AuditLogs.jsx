import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    base44.entities.AuditLog
      .list("-created_date", 200)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return logs;
    return logs.filter(
      (l) =>
        (l.actor_email || "").toLowerCase().includes(s) ||
        (l.action || "").toLowerCase().includes(s)
    );
  }, [logs, q]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" /> Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Immutable record of administrative actions, with the responsible staff member.
        </p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or action…"
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {filtered.length} entries
          </span>
        </div>
        <div className="divide-y divide-border max-h-[68vh] overflow-y-auto">
          {loading && <div className="p-8 text-center text-sm text-muted-foreground">Loading audit trail…</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No audit entries found.</div>
          )}
          {!loading &&
            filtered.map((l) => (
              <div key={l.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-start text-xs">
                <div className="col-span-3 font-mono text-muted-foreground">
                  {l.created_date ? new Date(l.created_date).toLocaleString() : "—"}
                </div>
                <div className="col-span-4">
                  <div className="font-medium truncate">{l.actor_email || "system"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{l.actor_id || ""}</div>
                </div>
                <div className="col-span-3 font-mono text-primary">{l.action}</div>
                <div className="col-span-2 text-muted-foreground font-mono truncate text-right">
                  {l.target_id ? l.target_id.slice(-8) : "—"}
                </div>
                {l.details && Object.keys(l.details).length > 0 && (
                  <div className="col-span-12 mt-1">
                    <pre className="text-[10px] font-mono text-muted-foreground bg-background/60 rounded p-2 overflow-x-auto">
                      {JSON.stringify(l.details, null, 0)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}