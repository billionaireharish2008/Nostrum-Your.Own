import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const initialForm = { name: "", value: "", provider: "openai", base_url: "", api_key: "" };

export default function ModelManager({ models, onChanged }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const create = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.value.trim()) {
      toast({ title: "Model name and value are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke("manageModels", {
        action: "create",
        ...form,
        name: form.name.trim(),
        value: form.value.trim(),
        base_url: form.base_url.trim(),
        api_key: form.api_key.trim(),
      });
      setForm(initialForm);
      toast({ title: "Model added" });
      onChanged();
    } catch (error) {
      toast({ title: "Could not add model", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeleting(id);
    try {
      await base44.functions.invoke("manageModels", { action: "delete", id });
      toast({ title: "Model deleted" });
      onChanged();
    } catch (error) {
      toast({ title: "Could not delete model", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div>
        <h2 className="font-display font-semibold">Models</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage server-side model connections. API keys are never displayed after saving.</p>
      </div>

      <div className="space-y-2">
        {models.length === 0 && <p className="text-sm text-muted-foreground">No custom models configured.</p>}
        {models.map((model) => (
          <div key={model.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{model.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{model.provider} · {model.value} {model.has_key ? "· key configured" : "· no key"}</div>
            </div>
            <button type="button" disabled={deleting === model.id} onClick={() => remove(model.id)} className="text-xs text-destructive disabled:opacity-60">{deleting === model.id ? "Deleting…" : "Delete"}</button>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="grid sm:grid-cols-2 gap-3 border-t border-border pt-4">
        <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Display name" value={form.name} onChange={(e) => setField("name", e.target.value)} maxLength={120} />
        <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Model value" value={form.value} onChange={(e) => setField("value", e.target.value)} maxLength={120} />
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.provider} onChange={(e) => setField("provider", e.target.value)}>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google</option>
          <option value="openai_compatible">OpenAI-compatible</option>
        </select>
        <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Base URL (optional)" value={form.base_url} onChange={(e) => setField("base_url", e.target.value)} maxLength={300} />
        <input className="sm:col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm" type="password" autoComplete="new-password" placeholder="API key (stored server-side)" value={form.api_key} onChange={(e) => setField("api_key", e.target.value)} maxLength={400} />
        <button type="submit" disabled={saving} className="sm:col-span-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{saving ? "Adding…" : "Add model"}</button>
      </form>
    </section>
  );
}
