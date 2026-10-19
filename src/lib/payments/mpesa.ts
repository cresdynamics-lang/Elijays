/**
 * @deprecated Daraja removed — use @/lib/payments/coop
 * Re-exports kept so older imports keep compiling.
 */
export {
  coopConfig as mpesaConfig,
  normalizePhone as normalizeMpesaPhone,
  coopStkPush as stkPush,
  parseCoopCallback as parseStkCallback,
  type CoopCallbackPayload as StkCallbackBody,
  type CoopStkResult as StkPushResult,
} from "@/lib/payments/coop";
