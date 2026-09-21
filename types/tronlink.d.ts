export {};

declare global {
  interface TronLinkRequest {
    (args: { method: "tron_requestAccounts" }): Promise<{ code?: string; message?: string }>;
  }

  interface TronLinkProvider {
    request?: TronLinkRequest;
  }

  interface TronWebProvider {
    defaultAddress?: { base58?: string };
    trx?: { signMessageV2?: (message: string) => Promise<string> };
  }

  interface Window {
    tronLink?: TronLinkProvider;
    tronWeb?: TronWebProvider;
  }
}
