/**
 * Co-operative Bank of Kenya Connect — production STK collection.
 *
 * Token:  POST {COOP_BASE_URL}/token  (Basic consumerKey:consumerSecret)
 * STK:    POST {COOP_BASE_URL}/FT/stk/1.0.0
 * Status: POST {COOP_BASE_URL}/Enquiry/STK/1.0.0/
 */

const BANK_LEAK =
  /co-?op|cooperat|openapi|operator.?code|consumer.?key|consumer.?secret|ft\/stk|bank of kenya/i;

/** Customer-facing PIN copy — never name the acquiring bank. */
export function publicMpesaPrompt(text?: string | null) {
  const t = String(text || "").trim();
  if (!t || BANK_LEAK.test(t) || /accepted for processing/i.test(t)) {
    return "Check your phone and enter your M-Pesa PIN to complete payment.";
  }
  return t;
}

/** Customer-facing errors — strip bank, keys, and provider wording. */
export function publicMpesaError(text?: string | null) {
  const t = String(text || "").trim();
  if (/valid kenyan phone/i.test(t)) return t;
  if (
    !t ||
    BANK_LEAK.test(t) ||
    /auth failed|access_token|not configured|stk failed|status failed/i.test(t)
  ) {
    return "Could not start M-Pesa. Check the number and try again.";
  }
  return t;
}

function env(...keys: string[]) {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v && !v.startsWith("YOUR_")) return v;
  }
  return "";
}

export function coopConfig() {
  const isSandbox =
    (env("COOP_ENV") || "production").toLowerCase() === "sandbox";
  const consumerKey = env("COOP_CONSUMER_KEY", "COOP_CLIENT_ID");
  const consumerSecret = env("COOP_CONSUMER_SECRET", "COOP_CLIENT_SECRET");
  const apiKey = env("COOP_API_KEY");
  const operatorCode = env("COOP_OPERATOR_CODE") || "ELIJAYS";
  const accountNumber = env("COOP_ACCOUNT_NUMBER");
  const branchCode = env("COOP_BRANCH_CODE");
  const baseUrl = (
    env("COOP_BASE_URL") ||
    (isSandbox
      ? "https://openapi-sandbox.co-opbank.co.ke"
      : "https://openapi.co-opbank.co.ke")
  ).replace(/\/$/, "");
  const tokenUrl = env("COOP_TOKEN_URL") || `${baseUrl}/token`;
  const stkPath =
    env("COOP_STK_PATH") ||
    (isSandbox ? "/Saf/Stk/1.0.0" : "/FT/stk/1.0.0");
  const statusPath = env("COOP_STATUS_PATH") || "/Enquiry/STK/1.0.0/";
  const site =
    env("NEXT_PUBLIC_APP_URL") || "https://elijays-mens-wear.co.ke";
  const callbackUrl =
    env("COOP_CALLBACK_URL") ||
    `${site.replace(/\/$/, "")}/api/payments/mpesa/callback`;

  return {
    isSandbox,
    consumerKey,
    consumerSecret,
    apiKey,
    operatorCode,
    accountNumber,
    branchCode,
    baseUrl,
    tokenUrl,
    stkUrl: `${baseUrl}${stkPath.startsWith("/") ? stkPath : `/${stkPath}`}`,
    statusUrl: `${baseUrl}${statusPath.startsWith("/") ? statusPath : `/${statusPath}`}`,
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

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken() {
  const cfg = coopConfig();
  if (!cfg.configured) {
    throw new Error(
      "Co-op Bank is not configured. Set COOP_CONSUMER_KEY and COOP_CONSUMER_SECRET.",
    );
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  const auth = Buffer.from(
    `${cfg.consumerKey}:${cfg.consumerSecret}`,
  ).toString("base64");

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "PostmanRuntime/7.43.0",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Co-op auth failed (${res.status}): ${t.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number | string;
  };
  if (!data.access_token) throw new Error("Co-op auth missing access_token");

  const ttlMs = Math.max(60, Number(data.expires_in) || 3600) * 1000;
  cachedToken = { value: data.access_token, expiresAt: Date.now() + ttlMs };
  return data.access_token;
}

function authHeaders(token: string) {
  const cfg = coopConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "PostmanRuntime/7.43.0",
  };
  if (cfg.apiKey) headers.api_key = cfg.apiKey;
  return headers;
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

function coopOk(raw: Record<string, unknown>) {
  const code = String(
    raw.MessageCode ?? raw.ResponseCode ?? raw.resultCode ?? raw.StatusCode ?? "0",
  );
  return (
    code === "0" ||
    code === "00" ||
    code === "200" ||
    Boolean(raw.CheckoutRequestID || raw.MerchantRequestID || raw.MessageReference)
  );
}

/**
 * Live Co-op FT STK Push (Postman: POST /FT/stk/1.0.0).
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
  const ref = messageReference(
    input.accountReference.replace(/\W/g, "").slice(0, 6) || "EJ",
  );
  const narration = (input.description || "ELIJAYS order").slice(0, 50);

  const payload: Record<string, unknown> = cfg.stkUrl.includes("/FT/stk")
    ? {
        MessageReference: ref,
        CallBackUrl: cfg.callbackUrl,
        OperatorCode: cfg.operatorCode,
        TransactionCurrency: "KES",
        MobileNumber: phone,
        Narration: narration,
        Amount: amount,
        MessageDateTime: new Date().toISOString(),
        OtherDetails: [
          {
            Name: "Order",
            Value: input.accountReference.slice(0, 32) || "1",
          },
        ],
      }
    : {
        MessageReference: ref,
        CallBackUrl: cfg.callbackUrl,
        PhoneNumber: phone,
        Amount: amount,
        TransactionNarration: narration,
        AccountReference: input.accountReference.slice(0, 12),
      };

  const res = await fetch(cfg.stkUrl, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });

  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      String(raw.MessageDescription || raw.error_description || raw.errorMessage || "") ||
      `Co-op STK failed (${res.status})`;
    throw new Error(msg);
  }

  if (!coopOk(raw) && raw.MessageDescription) {
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

  const customerMessage = publicMpesaPrompt(
    String(raw.CustomerMessage || raw.MessageDescription || ""),
  );

  return {
    messageReference: String(raw.MessageReference || ref),
    checkoutRequestId,
    customerMessage,
    raw,
  };
}

export type CoopStatusResult = {
  paid: boolean;
  failed: boolean;
  pending: boolean;
  resultDesc: string;
  receipt?: string;
  amount?: number;
  raw: Record<string, unknown>;
};

/** Live Co-op STK enquiry (Postman: POST /Enquiry/STK/1.0.0/). */
export async function coopStkStatus(messageReference: string): Promise<CoopStatusResult> {
  const cfg = coopConfig();
  const token = await getAccessToken();
  const res = await fetch(cfg.statusUrl, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ MessageReference: messageReference }),
    signal: AbortSignal.timeout(15_000),
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      String(raw.MessageDescription || raw.error_description || `Co-op status failed (${res.status})`),
    );
  }

  const metaItems = (
    (raw.TransactionMetadata as { Items?: { Name: string; Value?: string | number }[] } | undefined)
      ?.Items || []
  );
  const meta = (name: string) => metaItems.find((i) => i.Name === name)?.Value;
  const narration = String(meta("Narration") || "");
  const receiptFromNarration = narration.split("~")[1]?.trim();
  const receipt = raw.MpesaReceiptNumber || raw.ReceiptNumber || meta("ReceiptNumber") || receiptFromNarration
    ? String(
        raw.MpesaReceiptNumber ||
          raw.ReceiptNumber ||
          meta("ReceiptNumber") ||
          receiptFromNarration,
      )
    : undefined;

  const classified = classifyCoopResult({
    code: String(
      raw.MessageCode ??
        raw.ResponseCode ??
        raw.ResultCode ??
        raw.TransactionStatus ??
        raw.Status ??
        "",
    ),
    desc: String(
      raw.MessageDescription ||
        raw.MessageDetails ||
        raw.ResultDesc ||
        raw.StatusDescription ||
        "",
    ),
    status: String(raw.TransactionStatus || raw.Status || ""),
    receipt,
  });

  return {
    paid: classified.paid,
    failed: classified.failed,
    pending: classified.pending,
    resultDesc: String(
      raw.MessageDescription ||
        raw.MessageDetails ||
        raw.ResultDesc ||
        raw.StatusDescription ||
        (classified.pending ? "pending" : classified.paid ? "paid" : "failed"),
    ),
    receipt,
    amount: Number(raw.TransactionAmount || raw.Amount || meta("Amount") || 0) || undefined,
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
  MobileNumber?: string;
  TransactionStatus?: string;
  Status?: string;
  MessageDetails?: string;
  TransactionMetadata?: {
    Items?: { Name: string; Value?: string | number }[];
  };
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

function classifyCoopResult(input: {
  code?: string;
  desc?: string;
  status?: string;
  receipt?: string;
}) {
  const code = String(input.code || "").toUpperCase();
  const desc = String(input.desc || "").toLowerCase();
  const status = String(input.status || "").toUpperCase();
  const receipt = input.receipt?.trim();
  const processing =
    desc.includes("accepted for processing") ||
    desc.includes("pending") ||
    desc.includes("queued") ||
    status === "PENDING" ||
    status === "PROCESSING";
  const paid =
    Boolean(receipt) ||
    ((!processing) &&
      (status === "SUCCESS" ||
        status === "COMPLETED" ||
        status === "PAID" ||
        desc.includes("success") ||
        desc.includes("completed") ||
        desc.includes("fully settled")));
  const failed =
    !paid &&
    !processing &&
    (status === "FAILED" ||
      status === "CANCELLED" ||
      status === "EXPIRED" ||
      code === "1" ||
      code === "1032" ||
      desc.includes("fail") ||
      desc.includes("cancel") ||
      desc.includes("timeout") ||
      desc.includes("expired") ||
      desc.includes("invalid"));
  return { paid, failed, pending: !paid && !failed };
}

export function parseCoopCallbackText(text: string): CoopCallbackPayload | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as CoopCallbackPayload;
  } catch {
    /* xml or form body */
  }
  const tag = (name: string) => {
    const m = trimmed.match(new RegExp(`<${name}[^>]*>([^<]*)</${name}>`, "i"));
    return m?.[1]?.trim();
  };
  const form: Record<string, string> = {};
  if (trimmed.includes("=") && !trimmed.startsWith("<")) {
    for (const part of trimmed.split("&")) {
      const [k, v] = part.split("=");
      if (!k) continue;
      form[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " "));
    }
  }
  const MessageReference = tag("MessageReference") || form.MessageReference;
  if (!MessageReference && !tag("CheckoutRequestID") && !form.CheckoutRequestID) {
    return null;
  }
  return {
    MessageReference,
    MessageCode: tag("MessageCode") || form.MessageCode,
    MessageDescription: tag("MessageDescription") || form.MessageDescription,
    CheckoutRequestID: tag("CheckoutRequestID") || form.CheckoutRequestID,
    MerchantRequestID: tag("MerchantRequestID") || form.MerchantRequestID,
    ResultCode: tag("ResultCode") || form.ResultCode,
    ResultDesc: tag("ResultDesc") || form.ResultDesc,
    TransactionAmount: tag("TransactionAmount") || form.TransactionAmount || form.Amount,
    Amount: tag("Amount") || form.Amount,
    MpesaReceiptNumber: tag("MpesaReceiptNumber") || form.MpesaReceiptNumber,
    ReceiptNumber: tag("ReceiptNumber") || form.ReceiptNumber,
    PhoneNumber: tag("PhoneNumber") || form.PhoneNumber,
    MobileNumber: tag("MobileNumber") || form.MobileNumber,
    TransactionStatus: tag("TransactionStatus") || form.TransactionStatus,
    Status: tag("Status") || form.Status,
  };
}

export function parseCoopCallback(payload: CoopCallbackPayload) {
  const stk = payload.Body?.stkCallback;
  if (stk) {
    const items = stk.CallbackMetadata?.Item || [];
    const get = (name: string) => items.find((i) => i.Name === name)?.Value;
    const receipt = get("MpesaReceiptNumber")
      ? String(get("MpesaReceiptNumber"))
      : undefined;
    const classified = classifyCoopResult({
      code: String(stk.ResultCode ?? ""),
      desc: String(stk.ResultDesc || ""),
      receipt,
    });
    return {
      providerRef: String(stk.CheckoutRequestID || stk.MerchantRequestID || ""),
      resultCode: classified.paid ? 0 : classified.pending ? 2 : Number(stk.ResultCode) || 1,
      pending: classified.pending,
      resultDesc: String(stk.ResultDesc || ""),
      amount: Number(get("Amount") || 0) || undefined,
      receipt,
      phone: get("PhoneNumber") ? String(get("PhoneNumber")) : undefined,
    };
  }

  const providerRef = String(
    payload.CheckoutRequestID ||
      payload.MessageReference ||
      payload.MerchantRequestID ||
      "",
  );
  if (!providerRef) return null;

  const items = payload.TransactionMetadata?.Items || [];
  const meta = (name: string) => items.find((i) => i.Name === name)?.Value;
  const narration = String(meta("Narration") || "");
  const receiptFromNarration = narration.split("~")[1]?.trim();
  const receipt = payload.MpesaReceiptNumber || payload.ReceiptNumber || meta("ReceiptNumber") || receiptFromNarration
    ? String(
        payload.MpesaReceiptNumber ||
          payload.ReceiptNumber ||
          meta("ReceiptNumber") ||
          receiptFromNarration,
      )
    : undefined;
  const classified = classifyCoopResult({
    code: String(payload.ResultCode ?? payload.MessageCode ?? ""),
    desc: String(
      payload.ResultDesc ||
        payload.MessageDescription ||
        payload.MessageDetails ||
        "",
    ),
    status: String(payload.TransactionStatus || payload.Status || ""),
    receipt,
  });

  return {
    providerRef,
    resultCode: classified.paid ? 0 : classified.pending ? 2 : 1,
    pending: classified.pending,
    resultDesc: String(
      payload.ResultDesc || payload.MessageDescription || payload.Status || "",
    ),
    amount: Number(payload.TransactionAmount || payload.Amount || meta("Amount") || 0) || undefined,
    receipt,
    phone: payload.PhoneNumber || payload.MobileNumber || meta("PhoneNumber")
      ? String(payload.PhoneNumber || payload.MobileNumber || meta("PhoneNumber"))
      : undefined,
  };
}
