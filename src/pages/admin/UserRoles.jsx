import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { isMasterAdmin, displayRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserPlus, ShieldCheck, KeyRound, Loader2, RefreshCw, Power, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function UsersRoles() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [resetting, setResetting] = useState(null);
  const [terminating, setTerminating] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await base44.functions.invoke("manageUsers", { action: "list" });
      const data = res.data || {};
      setUsers(data.users || []);
      setSessions(data.sessions || {});
    } catch (e) {
      toast({ title: "Failed to load users", description: e.message, variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 20000);
    return () => clearInterval(t);
  }, [load]);

  const changeRole = async (id, role) => {
    try {
      await base44.functions.invoke("manageUsers", { action: "setRole", id, role });
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
      toast({ title: "Role updated", description: `User is now ${role}` });
    } catch (e) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const resetPassword = async (email) => {
    setResetting(email);
    try {
      await base44.auth.resetPasswordRequest(email);
      toast({ title: "Password reset link sent", description: email });
    } catch (e) {
      toast({ title: "Failed to send reset link", description: e.message, variant: "destructive" });
    } finally {
      setResetting(null);
    }
  };

  const terminateSession = async (sessionId, userId) => {
    setTerminating(sessionId);
    try {
      await base44.functions.invoke("manageUsers", { action: "terminateSession", sessionId });
      setSessions((p) => {
        const next = { ...p };
        delete next[userId];
        return next;
      });
      toast({ title: "Session terminated", description: "The user's active session has been ended." });
    } catch (e) {
      toast({ title: "Terminate failed", description: e.message, variant: "destructive" });
    } finally {
      setTerminating(null);
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast({ title: "Invitation sent", description: inviteEmail });
      setInviteEmail("");
      load();
    } catch (err) {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const onlineUsers = users.filter((u) => sessions[u.id] && sessions[u.id].length > 0);
  const offlineUsers = users.filter((u) => !sessions[u.id] || sessions[u.id].length === 0);

  const renderRow = (u, online) => {
    const master = isMasterAdmin(u);
    const sess = online ? sessions[u.id][0] : null;
    return (
      <div key={u.id} className="px-4 py-3 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-5">
          <div className="flex items-center gap-2">
            <span className={online ? "text-primary" : "text-muted-foreground"}>
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            </span>
            <div className="min-w-0">
              <div className="font-medium truncate">{u.full_name || u.email}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
          </div>
          {online && sess && (
            <div className="ml-6 mt-1 text-xs text-muted-foreground font-mono">
              {sess.ip} · {sess.status} · risk {sess.risk_score ?? 0}
              {sess.started_at && <> · {formatDistanceToNow(new Date(sess.started_at), { addSuffix: true })}</>}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <Badge variant="outline" className="font-mono">{displayRole(u)}</Badge>
        </div>
        <div className="col-span-5 flex items-center justify-end gap-2">
          {online && sess && !master && (
            <Button
              variant="destructive"
              size="sm"
              className="h-9 px-2.5"
              disabled={terminating === sess.id}
              onClick={() => terminateSession(sess.id, u.id)}
              title="Terminate active session"
            >
              {terminating === sess.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
              <span className="ml-1">Terminate</span>
            </Button>
          )}
          {master ? (
            <span className="text-xs text-muted-foreground font-mono">locked</span>
          ) : (
            <>
              <Select value={u.role || "user"} onValueChange={(r) => changeRole(u.id, r)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5"
                disabled={resetting === u.email}
                onClick={() => resetPassword(u.email)}
                title="Send password reset link"
              >
                {resetting === u.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Users & Roles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage app users, assign roles, view live sessions, and terminate active ones.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Online</div>
          <div className="text-2xl font-display font-semibold text-primary">{onlineUsers.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Offline</div>
          <div className="text-2xl font-display font-semibold text-muted-foreground">{offlineUsers.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Total users</div>
          <div className="text-2xl font-display font-semibold">{users.length}</div>
        </div>
      </div>

      <form onSubmit={invite} className="rounded-xl border border-border bg-card p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Label htmlFor="invite-email">Invite by email</Label>
          <Input
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="name@company.com"
            className="mt-1.5"
          />
        </div>
        <div className="w-40">
          <Label>Role</Label>
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={inviting || !inviteEmail}>
          <UserPlus className="w-4 h-4" /> {inviting ? "Sending…" : "Send invite"}
        </Button>
      </form>

      {loading && users.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading users…</div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Online · {onlineUsers.length} active session{onlineUsers.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="divide-y divide-border">
              {onlineUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No active sessions.</div>
              ) : onlineUsers.map((u) => renderRow(u, true))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Offline · {offlineUsers.length} user{offlineUsers.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="divide-y divide-border">
              {offlineUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No offline users.</div>
              ) : offlineUsers.map((u) => renderRow(u, false))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}