import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, Plus, Cpu, KeyRound } from "lucide-react";

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "openai_compatible", label: "OpenAI-compatible (custom base URL)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "google", label: "Google (Gemini)" },
];

export default function ModelManager({ models, onChanged }) {
  const [form, setForm] = useState({ name: "", value: "", provider: "openai", base_url: "", api_key: "" });
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const add = async (e) => {
    e.preventDefault();
    if (!form.name || !form.value || !form.api_key) {
      toast({ title: "Name, model value and API key are required", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await base44.functions.invoke("manageModels", {
        action: "create",
        name: form.name,
        value: form.value,
        provider: form.provider,
        base_url: form.base_url,
        api_key: form.api_key,
      });
      setForm({ name: "", value: "", provider: "openai", base_url: "", api_key: "" });
      toast({ title: "Model added" });
      onChanged && onChanged();
    } catch (err) {
      toast({ title: "Failed to add model", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id) => {
    try {
      await base44.functions.invoke("manageModels", { action: "delete", id });
      onChanged && onChanged();
    } catch (e) {
      toast({ title: "Failed to delete", description: e.message, variant: "destructive" });
    }
  };

  const providerLabel = (p) => (PROVIDERS.find((x) => x.value === p) || {}).label || p;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Cpu className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">AI Models — bring your own API key</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Add a model with your own provider API key. Keys are stored server-side and never sent to the browser.
      </p>

      <form onSubmit={add} className="grid sm:grid-cols-2 gap-2 mb-4">
        <div>
          <Label className="text-[11px]">Display name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-[11px]">Model value</Label>
          <Input placeholder="e.g. gpt-4o, claude-3-5-sonnet, gemini-1.5-pro" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="mt-1 font-mono text-xs" />
        </div>
        <div>
          <Label className="text-[11px]">Provider</Label>
          <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px]">Base URL {form.provider === "openai_compatible" ? "(required)" : "(optional)"}</Label>
          <Input
            placeholder={form.provider === "openai" ? "https://api.openai.com/v1" : "https://…"}
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            className="mt-1 font-mono text-xs"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-[11px]">API key</Label>
          <Input
            type="password"
            placeholder="sk-…"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            className="mt-1 font-mono text-xs"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={adding || !form.name || !form.value || !form.api_key}>
            <Plus className="w-4 h-4" /> Add model
          </Button>
        </div>
      </form>

      <div className="space-y-1.5">
        {models.length === 0 && (
          <div className="text-xs text-muted-foreground">No custom models yet. Built-in models are always available.</div>
        )}
        {models.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm flex items-center gap-2">
                {m.name}
                {m.has_key && <KeyRound className="w-3 h-3 text-primary" />}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">
                {m.value} · {providerLabel(m.provider)}
              </div>
            </div>
            <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}