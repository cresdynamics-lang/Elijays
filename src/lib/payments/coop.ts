/**
 * Co-operative Bank of Kenya Connect — sandbox / production.
 * STK collection via Co-op gateway: POST /Saf/Stk/1.0.0
 * (not Safaricom Daraja directly)
 *
 * Token: POST {COOP_BASE_URL}/token  (Basic consumerKey:consumerSecret)
 * Docs refs: openapi-sandbox.co-opbank.co.ke · developer.co-opbank.co.ke:8243
 */

function env(...keys: string[]) {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v && !v.startsWith("YOUR_")) return v;
  }
  return "";
}

export function coopConfig() {
  const isSandbox =
    (env("COOP_ENV") || "sandbox").toLowerCase() !== "production";
  const consumerKey = env("COOP_CONSUMER_KEY", "COOP_CLIENT_ID");
  const consumerSecret = env("COOP_CONSUMER_SECRET", "COOP_CLIENT_SECRET");
  const apiKey = env("COOP_API_KEY");
  const accountNumber = env("COOP_ACCOUNT_NUMBER");
  const branchCode = env("COOP_BRANCH_CODE");
  const baseUrl = (
    env("COOP_BASE_URL") ||
    (isSandbox
      ? "https://openapi-sandbox.co-opbank.co.ke"
      : "https://openapi.co-opbank.co.ke")
  ).replace(/\/$/, "");
  const tokenUrl =
    env("COOP_TOKEN_URL") || `${baseUrl}/token`;
  const stkPath = env("COOP_STK_PATH") || "/Saf/Stk/1.0.0";
  const site =
    env("NEXT_PUBLIC_APP_URL") || "https://elijays-mens-wear.co.ke";
  const callbackUrl =
    env("COOP_CALLBACK_URL") ||
    `${site.replace(/\/$/, "")}/api/payments/coop/webhook`;

  return {
    isSandbox,
    consumerKey,
    consumerSecret,
    apiKey,
    accountNumber,
    branchCode,
    baseUrl,
    tokenUrl,
    stkUrl: `${baseUrl}${stkPath.startsWith("/") ? stkPath : `/${stkPath}`}`,
    callbackUrl,
    configured: Boolean(consumerKey && consumerSecret),
  };
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `254${digits}`;
  throw new Error("Enter a valid Kenyan phone (e.g. 07XX XXX XXX)");
}

async function getAccessToken() {
  const cfg = coopConfig();
  if (!cfg.configured) {
    throw new Error(
      "Co-op Bank is not configured. Set COOP_CONSUMER_KEY and COOP_CONSUMER_SECRET for sandbox.",
    );
  }

  const auth = Buffer.from(
    `${cfg.consumerKey}:${cfg.consumerSecret}`,
  ).toString("base64");

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Co-op auth failed (${res.status}): ${t.slice(0, 240)}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Co-op auth missing access_token");
  return data.access_token;
}

function messageReference(prefix = "EJ") {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}${Date.now().toString(36).toUpperCase()}${rand}`.slice(0, 24);
}

export type CoopStkResult = {
  messageReference: string;
  checkoutRequestId: string;
  customerMessage: string;
  raw: Record<string, unknown>;
};

/**
 * Co-op Connect STK Push (Safaricom STK routed through Co-op sandbox/prod).
 */
export async function coopStkPush(input: {
  phone: string;
  amountKes: number;
  accountReference: string;
  description?: string;
}): Promise<CoopStkResult> {
  const cfg = coopConfig();
  const token = await getAccessToken();
  const phone = normalizePhone(input.phone);
  const amount = Math.max(1, Math.round(input.amountKes));
  const ref = messageReference(input.accountReference.replace(/\W/g, "").slice(0, 6) || "EJ");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (cfg.apiKey) headers["api_key"] = cfg.apiKey;

  const payload: Record<string, unknown> = {
    MessageReference: ref,
    CallBackUrl: cfg.callbackUrl,
    PhoneNumber: phone,
    Amount: amount,
    TransactionNarration: (input.description || "ELIJAYS order").slice(0, 50),
    AccountReference: input.accountReference.slice(0, 12),
  };
  if (cfg.accountNumber) {
    payload.AccountNumber = cfg.accountNumber;
    payload.Source = {
      AccountNumber: cfg.accountNumber,
      Amount: amount,
      TransactionCurrency: "KES",
      Narration: input.description || "ELIJAYS",
    };
  }

  const res = await fetch(cfg.stkUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      String(raw.MessageDescription || raw.error_description || raw.errorMessage || "") ||
      `Co-op STK failed (${res.status})`;
    throw new Error(msg);
  }

  const code = String(
    raw.MessageCode ?? raw.ResponseCode ?? raw.resultCode ?? "0",
  );
  // Co-op often uses "0" or "00" for success; some sandbox replies use MessageCode "-1" style — accept common OK codes
  const ok =
    code === "0" ||
    code === "00" ||
    code === "200" ||
    Boolean(raw.CheckoutRequestID || raw.MerchantRequestID || raw.MessageReference);

  if (!ok && raw.MessageDescription) {
    // Soft-fail only when clearly unsuccessful
    const desc = String(raw.MessageDescription).toLowerCase();
    if (desc.includes("fail") || desc.includes("invalid") || desc.includes("error")) {
      throw new Error(String(raw.MessageDescription));
    }
  }

  const checkoutRequestId = String(
    raw.CheckoutRequestID ||
      raw.checkoutRequestID ||
      raw.MerchantRequestID ||
      raw.MessageReference ||
      ref,
  );

  return {
    messageReference: String(raw.MessageReference || ref),
    checkoutRequestId,
    customerMessage: String(
      raw.CustomerMessage ||
        raw.MessageDescription ||
        "Check your phone to complete payment on M-Pesa.",
    ),
    raw,
  };
}

/** Co-op / Safaricom-style callback payloads. */
export type CoopCallbackPayload = {
  MessageReference?: string;
  MessageCode?: string | number;
  MessageDescription?: string;
  CheckoutRequestID?: string;
  MerchantRequestID?: string;
  ResultCode?: number | string;
  ResultDesc?: string;
  TransactionAmount?: number | string;
  Amount?: number | string;
  MpesaReceiptNumber?: string;
  ReceiptNumber?: string;
  PhoneNumber?: string;
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

export function parseCoopCallback(payload: CoopCallbackPayload) {
  // Safaricom-shaped callback (Co-op often proxies this)
  const stk = payload.Body?.stkCallback;
  if (stk) {
    const items = stk.CallbackMetadata?.Item || [];
    const get = (name: string) => items.find((i) => i.Name === name)?.Value;
    return {
      providerRef: String(stk.CheckoutRequestID || stk.MerchantRequestID || ""),
      resultCode: Number(stk.ResultCode),
      resultDesc: String(stk.ResultDesc || ""),
      amount: Number(get("Amount") || 0) || undefined,
      receipt: get("MpesaReceiptNumber")
        ? String(get("MpesaReceiptNumber"))
        : undefined,
      phone: get("PhoneNumber") ? String(get("PhoneNumber")) : undefined,
    };
  }

  // Flat Co-op style
  const providerRef = String(
    payload.CheckoutRequestID ||
      payload.MessageReference ||
      payload.MerchantRequestID ||
      "",
  );
  if (!providerRef) return null;

  const resultCode = Number(
    payload.ResultCode ?? payload.MessageCode ?? 1,
  );
  const success =
    resultCode === 0 ||
    String(payload.MessageCode) === "0" ||
    String(payload.MessageCode) === "00";

  return {
    providerRef,
    resultCode: success ? 0 : resultCode || 1,
    resultDesc: String(
      payload.ResultDesc || payload.MessageDescription || "",
    ),
    amount: Number(payload.TransactionAmount || payload.Amount || 0) || undefined,
    receipt: payload.MpesaReceiptNumber || payload.ReceiptNumber
      ? String(payload.MpesaReceiptNumber || payload.ReceiptNumber)
      : undefined,
    phone: payload.PhoneNumber ? String(payload.PhoneNumber) : undefined,
  };
}
