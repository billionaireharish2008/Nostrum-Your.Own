import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Autocomplete from "@/components/transfer/Autocomplete";
import { currencyOptions, currencyLabel } from "@/lib/banks";
import { Plus, Trash2, Loader2, Link2, Check } from "lucide-react";

const PLATFORMS = [
  { id: "flipkart", name: "Flipkart", color: "#2874f0" },
  { id: "amazon", name: "Amazon", color: "#ff9900" },
  { id: "blinkit", name: "Blinkit", color: "#0c831f" },
  { id: "etsy", name: "Etsy", color: "#f1641e" },
  { id: "gumroad", name: "Gumroad", color: "#ff90e8" },
  { id: "walmart", name: "Walmart", color: "#0071ce" },
];

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [linked, setLinked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [identifier, setIdentifier] = useState("");
  const [customName, setCustomName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const list = await base44.entities.LinkedAccount.filter({ user_id: user.id });
      setLinked(list);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const openConnect = (p) => {
    setPlatform(p);
    setIdentifier("");
    setCustomName("");
    setCurrency(user?.preferred_currency || "USD");
    setOpen(true);
  };

  const openCustom = () => {
    setPlatform({ id: "custom", name: "Custom", color: "#64748b" });
    setIdentifier("");
    setCustomName("");
    setCurrency(user?.preferred_currency || "USD");
    setOpen(true);
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast({ title: "Enter your account email or ID" });
      return;
    }
    const label = platform.id === "custom" ? customName.trim() || "Custom account" : platform.name;
    setSaving(true);
    try {
      await base44.entities.LinkedAccount.create({
        user_id: user.id,
        platform: platform.id,
        label,
        account_identifier: identifier.trim(),
        currency,
        status: "active",
      });
      toast({ title: label + " connected" });
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Could not connect", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (id, label) => {
    try {
      await base44.entities.LinkedAccount.delete(id);
      toast({ title: label + " disconnected" });
      load();
    } catch (err) {
      toast({ title: "Could not disconnect", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="font-medium mb-1">Connected shopping accounts</div>
      <p className="text-xs text-muted-foreground mb-4">
        Link your shopping accounts to send money to them directly from Nostrum — no redirects or app switching.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PLATFORMS.map((p) => {
          const connected = linked.find((l) => l.platform === p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => !connected && openConnect(p)}
              disabled={!!connected}
              className="rounded-xl border border-border p-3 flex flex-col items-center gap-2 hover:bg-accent transition-colors disabled:opacity-70"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: p.color }}
              >
                {p.name[0]}
              </span>
              <span className="text-sm font-medium">{p.name}</span>
              {connected ? (
                <span className="text-[11px] text-primary flex items-center gap-1">
                  <Check className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Connect</span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={openCustom}
          className="rounded-xl border border-dashed border-border p-3 flex flex-col items-center gap-2 hover:bg-accent transition-colors"
        >
          <span className="w-10 h-10 rounded-full flex items-center justify-center bg-accent">
            <Plus className="w-5 h-5" />
          </span>
          <span className="text-sm font-medium">Custom</span>
          <span className="text-[11px] text-muted-foreground">Add your own</span>
        </button>
      </div>

      {linked.length > 0 && (
        <div className="mt-5 space-y-2">
          {linked.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{l.label}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {l.account_identifier} · {l.currency}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDisconnect(l.id, l.label)}
                className="text-muted-foreground hover:text-destructive ml-3 shrink-0"
                aria-label={"Disconnect " + l.label}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && linked.length === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          No accounts connected yet. Connected accounts also appear as quick recipients on the Transfer screen.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {platform?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnect} className="space-y-4">
            {platform?.id === "custom" && (
              <div className="space-y-2">
                <Label>Account name</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. My Store Wallet"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Account email or ID</Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
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
            <DialogFooter>
              <Button type="submit" disabled={saving} className="w-full h-11">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" /> Connect account
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}