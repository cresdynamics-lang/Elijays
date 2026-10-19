/**
 * M-Pesa STK Push via Safaricom Daraja (Lipa Na M-Pesa Online).
 * Credentials may be set as MPESA_* or mapped from COOP_MPESA_* / COOP_CONSUMER_*.
 * Callback URL: MPESA_CALLBACK_URL or COOP_CALLBACK_URL.
 */

function env(...keys: string[]) {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v && !v.startsWith("YOUR_")) return v;
  }
  return "";
}

export function mpesaConfig() {
  const shortcode = env("MPESA_SHORTCODE", "COOP_MPESA_SHORTCODE");
  const passkey = env("MPESA_PASSKEY", "COOP_MPESA_PASSKEY");
  const consumerKey = env("MPESA_CONSUMER_KEY", "COOP_CONSUMER_KEY");
  const consumerSecret = env(
    "MPESA_CONSUMER_SECRET",
    "COOP_CONSUMER_SECRET",
  );
  const isSandbox =
    (env("MPESA_ENV", "COOP_ENV") || "sandbox").toLowerCase() !== "production";
  const baseUrl = isSandbox
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";
  const site =
    env("NEXT_PUBLIC_APP_URL") || "https://elijays-mens-wear.co.ke";
  const callbackUrl =
    env("MPESA_CALLBACK_URL", "COOP_CALLBACK_URL") ||
    `${site.replace(/\/$/, "")}/api/payments/mpesa/callback`;

  return {
    shortcode,
    passkey,
    consumerKey,
    consumerSecret,
    baseUrl,
    callbackUrl,
    isSandbox,
    configured: Boolean(shortcode && passkey && consumerKey && consumerSecret),
  };
}

export function normalizeMpesaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `254${digits}`;
  throw new Error("Enter a valid Kenyan M-Pesa number (e.g. 07XX XXX XXX)");
}

async function getAccessToken() {
  const cfg = mpesaConfig();
  if (!cfg.configured) {
    throw new Error(
      "M-Pesa is not configured. Set MPESA_CONSUMER_KEY/SECRET, MPESA_SHORTCODE, MPESA_PASSKEY (or COOP_* equivalents) in .env",
    );
  }
  const auth = Buffer.from(
    `${cfg.consumerKey}:${cfg.consumerSecret}`,
  ).toString("base64");
  const res = await fetch(
    `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`M-Pesa auth failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("M-Pesa auth missing access_token");
  return data.access_token;
}

function timestamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

export type StkPushResult = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

export async function stkPush(input: {
  phone: string;
  amountKes: number;
  accountReference: string;
  description?: string;
}): Promise<StkPushResult> {
  const cfg = mpesaConfig();
  const token = await getAccessToken();
  const phone = normalizeMpesaPhone(input.phone);
  const amount = Math.max(1, Math.round(input.amountKes));
  const ts = timestamp();
  const password = Buffer.from(
    `${cfg.shortcode}${cfg.passkey}${ts}`,
  ).toString("base64");

  const res = await fetch(
    `${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: cfg.shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: cfg.shortcode,
        PhoneNumber: phone,
        CallBackURL: cfg.callbackUrl,
        AccountReference: input.accountReference.slice(0, 12),
        TransactionDesc: (input.description || "ELIJAYS order").slice(0, 13),
      }),
    },
  );

  const data = (await res.json()) as StkPushResult & {
    errorMessage?: string;
    errorCode?: string;
  };

  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(
      data.errorMessage ||
        data.ResponseDescription ||
        `STK Push failed (${res.status})`,
    );
  }

  return data;
}

/** Safaricom STK callback body (subset). */
export type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: { Name: string; Value?: string | number }[];
      };
    };
  };
};

export function parseStkCallback(payload: StkCallbackBody) {
  const cb = payload.Body?.stkCallback;
  if (!cb) return null;
  const items = cb.CallbackMetadata?.Item || [];
  const get = (name: string) =>
    items.find((i) => i.Name === name)?.Value;

  return {
    merchantRequestId: String(cb.MerchantRequestID || ""),
    checkoutRequestId: String(cb.CheckoutRequestID || ""),
    resultCode: Number(cb.ResultCode),
    resultDesc: String(cb.ResultDesc || ""),
    amount: Number(get("Amount") || 0) || undefined,
    mpesaReceipt: get("MpesaReceiptNumber")
      ? String(get("MpesaReceiptNumber"))
      : undefined,
    phone: get("PhoneNumber") ? String(get("PhoneNumber")) : undefined,
  };
}
