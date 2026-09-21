export type Network = "Private Network" | "Ethereum" | "Tron" | "BSC" | "Bitcoin";
export type VaultStatus = "Connected" | "Disconnected";

export type Vault = { id: string; name: string; network: Network; address: string; balance: number; status: VaultStatus; role: string; symbol: string };
export type TransferStep = { id: string; label: string; short: string; description: string; duration: number; icon: string };

export const INITIAL_VAULTS: Vault[] = [
  { id: "base", name: "Base Vault", network: "Private Network", address: "priv://base-vault-01", balance: 1250000, status: "Connected", role: "Source", symbol: "USDT" },
  { id: "eth", name: "Ethereum Treasury", network: "Ethereum", address: "0x7A21...F49C", balance: 420000, status: "Disconnected", role: "Destination", symbol: "USDT" },
  { id: "tron", name: "TRON Settlement", network: "Tron", address: "TQm8...8wQd", balance: 980000, status: "Disconnected", role: "Destination", symbol: "USDT" },
  { id: "bsc", name: "BSC Operations", network: "BSC", address: "0x3C91...B122", balance: 275000, status: "Disconnected", role: "Destination", symbol: "USDT" },
  { id: "btc", name: "Bitcoin Reserve", network: "Bitcoin", address: "bc1q...v3k8", balance: 18.42, status: "Disconnected", role: "Destination", symbol: "BTC" }
];

export const TRANSFER_STEPS: TransferStep[] = [
  { id: "initiated", label: "Transfer Initiated", short: "Initiated", description: "The vault transfer request has been created and queued.", duration: 1800, icon: "↗" },
  { id: "compliance", label: "Approval & Compliance Check", short: "Compliance", description: "Policy checks and operator approval are being verified.", duration: 2600, icon: "✓" },
  { id: "locked", label: "Funds Locked in Private Network", short: "Funds locked", description: "The source balance is reserved inside the private network.", duration: 2400, icon: "▣" },
  { id: "signing", label: "Signing Transaction", short: "Signing", description: "The gateway is preparing the destination transaction.", duration: 2200, icon: "⌁" },
  { id: "broadcasting", label: "Broadcasting to Blockchain", short: "Broadcasting", description: "The signed transaction is entering the public mempool.", duration: 2400, icon: "◉" },
  { id: "confirmations", label: "Confirmations", short: "Confirmations", description: "The public chain is confirming the transaction.", duration: 7200, icon: "✦" },
  { id: "completed", label: "Completed", short: "Completed", description: "Funds have arrived at the destination vault.", duration: 1000, icon: "✓" }
];

export const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  Admin: { View: true, "Initiate Transfer": true, "Approve Transfer": true, "Manage Vaults": true, "Change Permissions": true },
  Operator: { View: true, "Initiate Transfer": true, "Approve Transfer": false, "Manage Vaults": false, "Change Permissions": false },
  Approver: { View: true, "Initiate Transfer": false, "Approve Transfer": true, "Manage Vaults": false, "Change Permissions": false },
  Viewer: { View: true, "Initiate Transfer": false, "Approve Transfer": false, "Manage Vaults": false, "Change Permissions": false }
};

export const DESTINATION_IDS = ["eth", "tron", "bsc", "btc"];
export const ADMIN_WALLET = "TFP84nTasN6G3M7SxX1XmRUP5wrX2ZeoYt";
export const BRIDGE_WINDOW_MS = 18 * 60 * 60 * 1000;
