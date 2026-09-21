"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ADMIN_WALLET, DEFAULT_PERMISSIONS, INITIAL_VAULTS, Vault } from "@/lib/config";

export type TransferStatus = "idle" | "running" | "waiting_bridge" | "failed" | "completed";
export type WalletRole = "Admin" | "User";
export type TransferRecord = { wallet: string; role: WalletRole; transferId: string; senderWallet: string; receiverWallet: string; trxAmount: number; trxUsdRate: number; requestedAmount: number; processedAmount: number; bridgeAmount: number; mainnetAmount: number; startedAt: number; durationHours: number; bridgeProgressTarget: number; bridgeEtaAt: number; bridgeReachedAt: number | null; mainnetArrivedAt: number | null; status: TransferStatus; currentStage: string };

type TransferState = {
  vaults: Vault[];
  destinationId: string;
  amount: number;
  asset: string;
  fee: number;
  note: string;
  senderWallet: string;
  receiverWallet: string;
  trxAmount: number;
  trxUsdRate: number;
  transferDurationHours: number;
  bridgeProgressTarget: number;
  permissions: typeof DEFAULT_PERMISSIONS;
  transferStatus: TransferStatus;
  stepIndex: number;
  confirmationCount: number;
  txHash: string;
  startedAt: number | null;
  completedAt: number | null;
  connectedWallet: string | null;
  walletSignature: string | null;
  walletRole: WalletRole | null;
  transferRecord: TransferRecord | null;
  transferHistory: TransferRecord[];
  localDatabase: Record<string, TransferRecord>;
  newTransferMode: boolean;
  connectingId: string | null;
  failureMode: boolean;
  connectVault: (id: string) => void;
  connectWallet: (address: string, signature?: string) => void;
  disconnectWallet: () => void;
  beginNewTransfer: () => void;
  setDestination: (id: string) => void;
  setField: (field: "amount" | "asset" | "fee" | "note" | "senderWallet" | "receiverWallet" | "trxAmount" | "trxUsdRate" | "transferDurationHours" | "bridgeProgressTarget", value: string | number) => void;
  togglePermission: (role: string, action: string) => void;
  startTransfer: () => void;
  setProgress: (stepIndex: number, confirmations?: number) => void;
  waitForBridge: () => void;
  failTransfer: () => void;
  completeTransfer: () => void;
  reset: () => void;
  setFailureMode: (value: boolean) => void;
};

const initial = { vaults: INITIAL_VAULTS, destinationId: "tron", amount: 25000, asset: "TRX", fee: 12.5, note: "Treasury transfer", senderWallet: "", receiverWallet: "TQm8...8wQd", trxAmount: 100, trxUsdRate: 0.25, transferDurationHours: 18, bridgeProgressTarget: 18, permissions: DEFAULT_PERMISSIONS, transferStatus: "idle" as TransferStatus, stepIndex: -1, confirmationCount: 0, txHash: "", startedAt: null, completedAt: null, connectedWallet: null, walletSignature: null, walletRole: null, transferRecord: null, transferHistory: [] as TransferRecord[], localDatabase: {} as Record<string, TransferRecord>, newTransferMode: false, connectingId: null, failureMode: false };

const recordFor = (s: TransferState, startedAt = Date.now()): TransferRecord => ({ wallet: s.connectedWallet || "unconnected-wallet", role: s.walletRole || "User", transferId: `TR-${startedAt.toString(36).toUpperCase()}`, senderWallet: s.senderWallet || s.connectedWallet || "unconnected-wallet", receiverWallet: s.receiverWallet, trxAmount: s.trxAmount, trxUsdRate: s.trxUsdRate, requestedAmount: s.trxAmount, processedAmount: 0, bridgeAmount: 0, mainnetAmount: 0, startedAt, durationHours: s.transferDurationHours, bridgeProgressTarget: s.bridgeProgressTarget, bridgeEtaAt: startedAt + s.transferDurationHours * 60 * 60 * 1000, bridgeReachedAt: null, mainnetArrivedAt: null, status: "running", currentStage: "Transfer initiated" });

const saveRecord = (s: TransferState, record: TransferRecord) => ({ transferRecord: record, localDatabase: { ...s.localDatabase, [record.wallet]: record }, transferHistory: [...(s.transferHistory || []).filter(item => item.transferId !== record.transferId), record] });

export const useTransferStore = create<TransferState>()(persist((set) => ({ ...initial,
  connectVault: (id) => { set({ connectingId: id }); setTimeout(() => set(s => ({ vaults: s.vaults.map(v => v.id === id ? { ...v, status: "Connected" } : v), connectingId: null })), 800); },
  connectWallet: (address, signature) => { const normalized = address.trim(); const role = normalized.toLowerCase() === ADMIN_WALLET.toLowerCase() ? "Admin" : "User"; set(s => { const history = s.transferHistory || []; const restored = s.newTransferMode ? null : s.localDatabase[normalized] || [...history].reverse().find(item => item.wallet === normalized) || null; return { connectedWallet: normalized, walletSignature: signature || s.walletSignature, walletRole: role, senderWallet: normalized, newTransferMode: false, transferRecord: restored, transferStatus: restored?.status || "idle", stepIndex: restored?.status ? 0 : -1, startedAt: restored?.startedAt || null }; }); },
  disconnectWallet: () => set({ connectedWallet: null, walletSignature: null, walletRole: null, senderWallet: "", transferRecord: null, transferStatus: "idle", stepIndex: -1, startedAt: null }),
  beginNewTransfer: () => set({ transferRecord: null, transferStatus: "idle", stepIndex: -1, confirmationCount: 0, txHash: "", startedAt: null, completedAt: null, newTransferMode: true }),
  setDestination: (id) => set({ destinationId: id }), setField: (field, value) => set({ [field]: value } as Partial<TransferState>),
  togglePermission: (role, action) => set(s => ({ permissions: { ...s.permissions, [role]: { ...s.permissions[role], [action]: !s.permissions[role][action] } } })),
  startTransfer: () => set(s => { const record = recordFor(s); return { ...saveRecord(s, record), transferStatus: "running", stepIndex: 0, confirmationCount: 0, txHash: "", startedAt: record.startedAt, completedAt: null, newTransferMode: false }; }),
  setProgress: (stepIndex, confirmations = 0) => set({ stepIndex, confirmationCount: confirmations }),
  waitForBridge: () => set(s => { const record = { ...(s.transferRecord || recordFor(s)), status: "waiting_bridge" as TransferStatus, currentStage: "Reached bridge", bridgeReachedAt: Date.now(), bridgeAmount: s.trxAmount, processedAmount: s.trxAmount * ((s.transferRecord?.bridgeProgressTarget || s.bridgeProgressTarget) / 100) }; return { ...saveRecord(s, record), transferStatus: "waiting_bridge" }; }),
  failTransfer: () => set(s => { const record = { ...(s.transferRecord || recordFor(s)), status: "failed" as TransferStatus, currentStage: "Compliance check failed" }; return { ...saveRecord(s, record), transferStatus: "failed" }; }),
  completeTransfer: () => set(s => { const timestamp = Date.now(); const record = { ...(s.transferRecord || recordFor(s)), status: "completed" as TransferStatus, currentStage: "Completed", bridgeReachedAt: timestamp, mainnetArrivedAt: timestamp, bridgeAmount: s.trxAmount, mainnetAmount: s.trxAmount, processedAmount: s.trxAmount }; return { ...saveRecord(s, record), transferStatus: "completed", stepIndex: 6, completedAt: timestamp, confirmationCount: 12, txHash: "TMock8c71a4d90f31" }; }),
  reset: () => set({ ...initial, permissions: DEFAULT_PERMISSIONS }), setFailureMode: (value) => set({ failureMode: value })
}), { name: "transferapp-local-db" }));

export const useLiveStore = useTransferStore;
