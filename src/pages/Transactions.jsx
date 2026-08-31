import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const txns = await base44.entities.Transaction.filter({ user_id: user.id }, "-created_date", 100);
        setTransactions(txns);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const fmt = (n) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Transactions</h1>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {loading && <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}
          {!loading && transactions.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
          )}
          {transactions.map((t) => {
            const credit = t.type === "credit";
            return (
              <Link
                to={"/transactions/" + t.id}
                key={t.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-accent/40 transition-colors"
              >
                <div className={"w-9 h-9 rounded-full flex items-center justify-center " + (credit ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground")}>
                  {credit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.description || t.counterparty || "Transaction"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.created_date || t.event_time || Date.now()).toLocaleString()}
                  </div>
                </div>
                <div className={"font-mono tabular-nums " + (credit ? "text-primary" : "text-foreground")}>
                  {credit ? "+" : "−"}{fmt(t.amount)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}