import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ShieldAlert } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AuthShowpiece from "@/components/AuthShowpiece";

function staffReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/admin";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/admin";
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/admin";
    return path;
  } catch {
    return "/admin";
  }
}

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = staffReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      try { await base44.functions.invoke("recordEvent", { action_type: "login_attempt", payload: { success: true, surface: "staff" } }); } catch {}
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid credentials");
      try { await base44.functions.invoke("recordEvent", { action_type: "login_attempt", payload: { success: false, surface: "staff" } }); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", returnTo);

  return (
    <AuthShowpiece
      variant="staff"
      footer={<>Not staff? <Link to="/login" className="text-primary font-medium hover:underline">Customer login →</Link></>}
    >
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3 text-destructive">
          <ShieldAlert className="w-5 h-5" />
          <span className="font-display font-semibold tracking-tight">SOC Console</span>
        </div>
        <h1 className="text-2xl font-display font-semibold">Staff access</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">Authorized personnel only</p>
      </div>

      <Button variant="outline" className="w-full h-11 mb-4" onClick={handleGoogle}>
        <GoogleIcon className="w-4 h-4 mr-2" />Continue with Google
      </Button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or</span></div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@bank.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : "Enter console"}
        </Button>
      </form>
    </AuthShowpiece>
  );
}