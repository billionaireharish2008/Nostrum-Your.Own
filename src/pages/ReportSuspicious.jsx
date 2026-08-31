import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { recordEvent } from "@/lib/telemetry";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Flag, Loader2, ShieldCheck } from "lucide-react";

export default function ReportSuspicious() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const txn = params.get("txn");
    if (txn) setDescription("Reporting transaction " + txn + ": ");
  }, [params]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast({ title: "Please add a bit more detail (min 10 characters)" });
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.SuspiciousReport.create({
        user_id: user.id,
        description: description.trim(),
        status: "open",
      });
      recordEvent("report_submitted", { length: description.length });
      setDone(true);
    } catch (err) {
      toast({ title: "Could not submit report", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl font-semibold">Report received</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Thank you for flagging this. Our security team will review it and follow up. Your account stays protected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-1">Report suspicious activity</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Describe what looked wrong — an unfamiliar charge, a suspicious message, anything. You're not in trouble.
      </p>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="desc">What happened?</Label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="I noticed a charge I didn't make…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            required
          />
        </div>
        <Button type="submit" className="w-full h-11" disabled={submitting}>
          {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : <><Flag className="w-4 h-4 mr-2" />Submit report</>}
        </Button>
      </form>
    </div>
  );
}