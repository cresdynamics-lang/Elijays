export type Fulfilment = "pickup" | "delivery";

export type AddressJson = {
  fulfilment?: Fulfilment;
  line1?: string;
  landmark?: string;
  payPhone?: string;
  desk?: string;
};

export function parseAddressJson(value: unknown): AddressJson {
  if (!value || typeof value !== "object") return {};
  return value as AddressJson;
}

export function fulfilmentLabel(value: unknown): string {
  const f = parseAddressJson(value).fulfilment;
  return f === "delivery" ? "Delivery" : "Collect in shop";
}
