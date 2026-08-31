import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "unknown");

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const recipient = (body.recipient || "").trim();
    const bank = (body.bank || "").trim();
    const currency = (body.currency || "USD").trim();
    const note = (body.note || "").trim();

    if (!recipient || isNaN(amount) || amount <= 0) {
      return Response.json({ ok: false, error: "invalid input" }, { status: 400 });
    }

    const accs = await base44.entities.Account.filter({ user_id: user.id });
    const account = accs && accs[0];
    if (!account) return Response.json({ ok: false, error: "no account found" }, { status: 400 });
    if (amount > (account.balance || 0)) {
      return Response.json({ ok: false, error: "insufficient balance" }, { status: 400 });
    }

    const txn = await base44.entities.Transaction.create({
      user_id: user.id,
      account_id: account.id,
      amount,
      type: "debit",
      description: note || ("Transfer to " + recipient),
      counterparty: recipient,
      category: "transfer",
      status: "completed",
      currency,
      sender_name: user.full_name || user.email,
      receiver_name: recipient,
      bank_name: bank,
      sender_ip: ip,
      receiver_ip: "external",
    });

    await base44.entities.Account.update(account.id, { balance: (account.balance || 0) - amount });

    return Response.json({ ok: true, transaction_id: txn.id, balance: (account.balance || 0) - amount });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}