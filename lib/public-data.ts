export const TRON_PUBLIC_RPC = "https://api.trongrid.io";
const TRX_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd";

type PriceResponse = { tron?: { usd?: number } };

export async function fetchTrxUsdRate(signal?: AbortSignal) {
  const response = await fetch(TRX_PRICE_URL, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Public price feed returned ${response.status}`);
  const data = await response.json() as PriceResponse;
  const rate = data.tron?.usd;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) throw new Error("Public price feed returned an invalid TRX rate");
  return rate;
}
