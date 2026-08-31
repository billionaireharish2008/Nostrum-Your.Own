import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flag, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function TransactionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const t = await base44.entities.Transaction.get(id);
        setTxn(t);
      } catch {
        setTxn(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Transaction not found.</p>
        <Link to="/transactions" className="text-primary hover:underline text-sm">Back to transactions</Link>
      </div>
    );
  }

  const credit = txn.type === "credit";
  const fmt = (n) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows = [
    ["Description", txn.description || "—"],
    ["Counterparty", txn.counterparty || "—"],
    ["Category", txn.category || "—"],
    ["Status", txn.status || "—"],
    ["Date", new Date(txn.created_date || Date.now()).toLocaleString()],
    ["Reference", txn.id],
  ];

  return (
    <div className="max-w-lg">
      <Link to="/transactions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="rounded-2xl border border-border bg-card p-7">
        <div className={"w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 " + (credit ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground")}>
          {credit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>
        <div className="text-center">
          <div className={"font-display text-3xl font-semibold tabular-nums " + (credit ? "text-primary" : "text-foreground")}>
            {credit ? "+" : "−"}{fmt(txn.amount)}
          </div>
          <div className="text-sm text-muted-foreground mt-1 capitalize">{txn.data.type}</div>
        </div>
        <div className="mt-6 divide-y divide-border border-y border-border">
          {rows.map(([k, v]) => (
            <div key={k} className="py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-mono text-right truncate max-w-[60%]">{v}</span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => navigate("/report?txn=" + id)}
        >
          <Flag className="w-4 h-4 mr-2" /> Report this transaction
        </Button>
      </div>
    </div>
  );
}