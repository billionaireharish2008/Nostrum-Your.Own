import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { recordEvent } from "@/lib/telemetry";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Zap } from "lucide-react";
import Autocomplete from "@/components/transfer/Autocomplete";
import { bankGroups, currencyOptions, currencyLabel } from "@/lib/banks";

export default function Transfer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bank, setBank] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [linked, setLinked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const accs = await base44.entities.Account.filter({ user_id: user.id });
        if (accs.length) setAccount(accs[0]);
        setCurrency(user.preferred_currency || "USD");
        try {
          const la = await base44.entities.LinkedAccount.filter({ user_id: user.id });
          setLinked(la);
        } catch (e) {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const balance = account?.balance ?? 0;
  const fmt = (n) =>
    "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pickLinked = (l) => {
    setRecipient(l.account_identifier);
    setBank(l.label);
    if (l.currency) setCurrency(l.currency);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!recipient || isNaN(amt) || amt <= 0) {
      toast({ title: "Enter a recipient and a valid amount" });
      return;
    }
    if (amt > balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createTransfer", {
        amount: amt,
        recipient,
        bank,
        currency,
        note,
      });
      const data = res.data || {};
      if (!data.ok) throw new Error(data.error || "Transfer failed");
      recordEvent("transfer", { amount: amt, recipient });
      toast({ title: "Transfer sent", description: currency + " " + amt + " to " + recipient });
      navigate("/transactions");
    } catch (err) {
      toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-1">Send money</h1>
      <p className="text-sm text-muted-foreground mb-6">Available: {fmt(balance)}</p>

      {linked.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Linked accounts — tap to send directly
          </div>
          <div className="flex flex-wrap gap-2">
            {linked.map((l) => (
              <button
                type="button"
                key={l.id}
                onClick={() => pickLinked(l)}
                className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent hover:border-primary transition-colors"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient name</Label>
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Jane Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Recipient bank</Label>
          <Autocomplete
            value={bank}
            onChange={(v) => setBank(v)}
            groups={bankGroups}
            placeholder="Search Indian or international banks"
            searchPlaceholder="Search banks…"
          />
          <p className="text-xs text-muted-foreground">
            Can’t find it? Type the name and pick “Use …” to add your own.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Autocomplete
              value={currency}
              displayValue={currencyLabel(currency)}
              onChange={(v) => setCurrency(v)}
              options={currencyOptions}
              placeholder="Select currency"
              searchPlaceholder="Search currency…"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" />
        </div>
        <Button type="submit" className="w-full h-11" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Send transfer
            </>
          )}
        </Button>
      </form>
    </div>
  );
}