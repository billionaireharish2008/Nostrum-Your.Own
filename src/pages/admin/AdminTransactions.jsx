import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Receipt, Activity, Loader2 } from "lucide-react";

const statusTone = {
  completed: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const fmt = (n) =>
  (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminTransactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);
  const { toast } = useToast();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const all = await base44.entities.Transaction.list("-created_date", 200);
      setTxns(all);
    } catch (e) {
      toast({ title: "Failed to load transactions", description: e.message, variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 15000);
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type === "create") {
        setTxns((p) => [event.data, ...p].slice(0, 200));
        setPulse((p) => p + 1);
      } else if (event.type === "update") {
        setTxns((p) => p.map((x) => (x.id === event.data.id ? event.data : x)));
      } else if (event.type === "delete") {
        setTxns((p) => p.filter((x) => x.id !== event.data.id));
      }
    });
    return () => {
      clearInterval(t);
      if (typeof unsub === "function") unsub();
    };
  }, [load]);

  const total = txns.length;
  const volume = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const debits = txns.filter((t) => t.type === "debit").length;
  const credits = txns.filter((t) => t.type === "credit").length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" /> Transactions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live ledger of every transaction across all accounts — sender, receiver, bank, amount and originating IPs.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live count
          </div>
          <div key={pulse} className="text-2xl font-display font-semibold text-primary tabular-nums animate-[ping_0.6s_ease-out]">
            {total}
          </div>
        </div>
        <Stat label="Total volume" value={"$" + fmt(volume)} />
        <Stat label="Debits" value={debits} />
        <Stat label="Credits" value={credits} />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {txns.length} transactions · auto-refreshing
          </span>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading ledger…
          </div>
        ) : txns.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-border">
                  <th className="px-4 py-2.5 font-medium">Sender</th>
                  <th className="px-4 py-2.5 font-medium">Receiver</th>
                  <th className="px-4 py-2.5 font-medium">Bank</th>
                  <th className="px-4 py-2.5 font-medium">Transaction ID</th>
                  <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {txns.map((t) => {
                  const credit = t.type === "credit";
                  return (
                    <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[150px]">{t.sender_name || t.counterparty || "—"}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{t.sender_ip || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[150px]">{t.receiver_name || (credit ? t.counterparty : "—") || "—"}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{t.receiver_ip || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">{t.bank_name || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id ? t.id.slice(-10) : "—"}</td>
                      <td className={"px-4 py-3 text-right font-mono tabular-nums " + (credit ? "text-primary" : "text-foreground")}>
                        {credit ? "+" : "−"}${fmt(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.created_date || Date.now()).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusTone[t.status] || statusTone.completed}>{t.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-display font-semibold tabular-nums">{value}</div>
    </div>
  );
}