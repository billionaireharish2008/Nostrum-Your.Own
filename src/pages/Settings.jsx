import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import Autocomplete from "@/components/transfer/Autocomplete";
import { currencyOptions, currencyLabel } from "@/lib/banks";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import ConnectedAccounts from "@/components/settings/ConnectedAccounts";

export default function Settings() {
  const { user, checkUserAuth } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name || "");
    setCurrency(user?.preferred_currency || "USD");
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({
        first_name: firstName.trim(),
        preferred_currency: currency,
      });
      await checkUserAuth();
      toast({ title: "Settings saved" });
    } catch (err) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">Account settings</h1>

      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email || ""} disabled className="opacity-60" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first">Display name</Label>
          <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Preferred currency</Label>
          <Autocomplete
            value={currency}
            displayValue={currencyLabel(currency)}
            onChange={(v) => setCurrency(v)}
            options={currencyOptions}
            placeholder="Select currency"
            searchPlaceholder="Search currency…"
          />
          <p className="text-xs text-muted-foreground">Used as the default currency when you send money.</p>
        </div>
        <Button type="submit" className="h-11" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save changes"}
        </Button>
      </form>

      <div className="mt-6">
        <AppearanceSettings />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              Sound cues
            </div>
            <p className="text-xs text-muted-foreground mt-1">Soft chimes for transfers and the assistant. Off by default.</p>
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className={"w-11 h-6 rounded-full transition-colors " + (muted ? "bg-accent" : "bg-primary")}
            aria-label="Toggle sound"
          >
            <span className={"block w-5 h-5 rounded-full bg-white shadow transition-transform " + (muted ? "translate-x-0.5" : "translate-x-5")} />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <ConnectedAccounts />
      </div>

      <button
        onClick={() => base44.auth.logout("/login")}
        className="w-full text-sm text-muted-foreground hover:text-foreground mt-6"
      >
        Sign out
      </button>
    </div>
  );
}