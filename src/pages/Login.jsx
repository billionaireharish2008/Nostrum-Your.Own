import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import AuthShowpiece from "@/components/AuthShowpiece";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      try { await base44.functions.invoke("recordEvent", { action_type: "login_attempt", payload: { success: true } }); } catch {}
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
      try { await base44.functions.invoke("recordEvent", { action_type: "login_attempt", payload: { success: false } }); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", returnTo);

  return (
    <AuthShowpiece
      footer={<>Bank staff? <Link to="/staff-login?returnTo=/admin" className="text-primary font-medium hover:underline">Admin portal →</Link></>}
    >
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3 text-primary">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-display font-semibold tracking-tight">Nostrum</span>
        </div>
        <h1 className="text-2xl font-display font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Log in to your account</p>
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
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
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
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in…</> : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="text-primary font-medium hover:underline">Create one</Link>
      </p>
    </AuthShowpiece>
  );
}