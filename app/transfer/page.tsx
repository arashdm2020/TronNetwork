"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionTitle, StatusBadge } from "@/components/shell";
import { TransferFlow } from "@/components/transfer-flow";
import { TRANSFER_STEPS } from "@/lib/config";
import { fetchTrxUsdRate } from "@/lib/public-data";
import { transferDocumentPath } from "@/lib/transfer-link";
import { useLiveStore } from "@/store/transfer-store";
import { WalletConnect } from "@/components/wallet-connect";

const formatTime = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const formatUsd = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export default function TransferPage() {
  const [now, setNow] = useState(Date.now());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rateState, setRateState] = useState<"loading" | "live" | "fallback">("loading");

  const vaults = useLiveStore(s => s.vaults);
  const destinationId = useLiveStore(s => s.destinationId);
  const trxAmount = useLiveStore(s => s.trxAmount);
  const trxUsdRate = useLiveStore(s => s.trxUsdRate);
  const transferDurationHours = useLiveStore(s => s.transferDurationHours);
  const bridgeProgressTarget = useLiveStore(s => s.bridgeProgressTarget);
  const senderWallet = useLiveStore(s => s.senderWallet);
  const receiverWallet = useLiveStore(s => s.receiverWallet);
  const fee = useLiveStore(s => s.fee);
  const status = useLiveStore(s => s.transferStatus);
  const record = useLiveStore(s => s.transferRecord);
  const wallet = useLiveStore(s => s.connectedWallet);
  const start = useLiveStore(s => s.startTransfer);
  const setField = useLiveStore(s => s.setField);
  const setDestination = useLiveStore(s => s.setDestination);
  const failureMode = useLiveStore(s => s.failureMode);
  const setFailureMode = useLiveStore(s => s.setFailureMode);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTrxUsdRate(controller.signal)
      .then(rate => {
        setField("trxUsdRate", rate);
        setRateState("live");
      })
      .catch(() => {
        if (!controller.signal.aborted) setRateState("fallback");
      });
    return () => controller.abort();
  }, [setField]);

  const destination = vaults.find(v => v.id === destinationId);
  const activeRecord = record;
  const bridgeEta = activeRecord?.bridgeEtaAt || 0;
  const remaining = bridgeEta ? Math.max(0, bridgeEta - now) : transferDurationHours * 60 * 60 * 1000;
  const elapsed = activeRecord ? Math.max(0, now - activeRecord.startedAt) : 0;
  const durationMs = (activeRecord?.durationHours || transferDurationHours) * 60 * 60 * 1000;
  const target = activeRecord?.bridgeProgressTarget || bridgeProgressTarget;
  const progress = activeRecord ? Math.min(target, (elapsed / durationMs) * target) : 0;
  const processed = activeRecord ? activeRecord.processedAmount || Math.floor(activeRecord.trxAmount * progress / 100) : 0;
  const usdAmount = trxAmount * trxUsdRate;
  const bridgeStatus = activeRecord?.bridgeReachedAt ? "Bridge window reached" : "Not reached yet";
  const markBridgeReached = useLiveStore(s => s.waitForBridge);

  useEffect(() => {
    if (status === "running" && bridgeEta && now >= bridgeEta) markBridgeReached();
  }, [status, bridgeEta, now, markBridgeReached]);

  const formReady = senderWallet.length > 10 && receiverWallet.length > 10 && trxAmount > 0 && transferDurationHours > 0 && bridgeProgressTarget > 0;

  if (!wallet) return <div className="py-12"><WalletConnect walletType="user" title="Connect wallet to view Transfer" description="Connect and sign in with TronLink before creating a transfer." /></div>;

  if (!activeRecord) return <div>
    <SectionTitle eyebrow="Transfer / 01" title="Create a transfer" description="Choose the sender and receiver, set the TRX amount, and define how the bridge progress should be presented." />
    <div className="glass rounded-2xl p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm text-slate-400">Sender wallet<input value={senderWallet || wallet} readOnly className="mono mt-2 w-full rounded-xl border border-line bg-black/20 px-3 py-3 text-xs text-white outline-none" /><span className="mt-1 block text-xs text-mint">Connected and signed by TronLink</span></label>
        <label className="block text-sm text-slate-400">Receiver wallet<input value={receiverWallet} onChange={e => setField("receiverWallet", e.target.value)} placeholder="Enter receiver TRON address" className="mono mt-2 w-full rounded-xl border border-line bg-black/20 px-3 py-3 text-xs text-white outline-none placeholder:text-slate-600" /></label>
        <label className="block text-sm text-slate-400">Amount in TRX<input type="number" min="0" value={trxAmount} onChange={e => setField("trxAmount", Number(e.target.value))} className="mt-2 w-full rounded-xl border border-line bg-black/20 px-3 py-3 text-white outline-none" /><span className="mt-1 block text-xs text-slate-500">≈ ${formatUsd(usdAmount)} USD</span></label>
        <label className="block text-sm text-slate-400">TRX / USD rate
          <input type="number" value={trxUsdRate} readOnly disabled aria-label="TRX USD rate from public feed" className="mt-2 w-full cursor-not-allowed rounded-xl border border-line bg-slate-900/70 px-3 py-3 text-slate-300 outline-none opacity-80" />
          <span className={`mt-1 block text-xs ${rateState === "live" ? "text-mint" : "text-slate-500"}`}>{rateState === "loading" ? "Reading public price feed…" : rateState === "live" ? "Live public TRX price" : "Public feed unavailable — fallback demo rate"}</span>
        </label>
        <label className="block text-sm text-slate-400">Destination network<select value={destinationId} onChange={e => setDestination(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-black/20 px-3 py-3 text-white outline-none"><option value="tron">TRON</option><option value="eth">Ethereum</option><option value="bsc">BSC</option></select></label>
        <label className="block text-sm text-slate-400">Network fee<input type="number" value={fee} onChange={e => setField("fee", Number(e.target.value))} className="mt-2 w-full rounded-xl border border-line bg-black/20 px-3 py-3 text-white outline-none" /></label>
      </div>
      <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-5 text-xs font-semibold text-cyan">{showAdvanced ? "Hide" : "Show"} timing controls</button>
      {showAdvanced && <div className="mt-4 grid gap-5 rounded-xl border border-cyan/20 bg-cyan/5 p-4 md:grid-cols-2"><label className="block text-sm text-slate-400">Time until bridge (hours)<input type="number" min="1" value={transferDurationHours} onChange={e => setField("transferDurationHours", Number(e.target.value))} className="mt-2 w-full rounded-xl border border-line bg-black/20 px-3 py-3 text-white outline-none" /></label><label className="block text-sm text-slate-400">Progress target at bridge (%)<input type="number" min="1" max="100" value={bridgeProgressTarget} onChange={e => setField("bridgeProgressTarget", Number(e.target.value))} className="mt-2 w-full rounded-xl border border-line bg-black/20 px-3 py-3 text-white outline-none" /></label></div>}
      <button disabled={!formReady} onClick={start} className="mt-6 w-full rounded-xl bg-cyan py-3 font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40">Start transfer</button>
    </div>
  </div>;

  return <div>
    <SectionTitle eyebrow="Transfer / 01" title="Transfer progress" description="The progress below is calculated from the saved transfer timestamp and the configured bridge duration. Refreshing does not reset it." />
    <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="rounded-full border border-mint/20 bg-mint/10 px-2.5 py-1 text-mint">TronLink signed</span><span className="mono">{wallet.slice(0, 10)}…{wallet.slice(-6)}</span><span className="rounded-full border border-white/10 px-2.5 py-1">Saved per wallet</span><Link href={transferDocumentPath(activeRecord)} className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 font-semibold text-cyan transition hover:bg-cyan/20">Open transfer document</Link></div>
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex flex-col justify-between gap-5 border-b border-line p-6 md:flex-row md:items-center"><div><div className="eyebrow mb-3">{activeRecord.trxAmount.toLocaleString()} TRX transfer</div><div className="flex flex-wrap items-center gap-3 text-sm text-slate-400"><span className="mono text-xs text-white">{activeRecord.senderWallet.slice(0, 12)}…</span><span className="text-cyan">→</span><span className="mono text-xs text-white">{activeRecord.receiverWallet.slice(0, 12)}…</span></div><div className="mt-4 text-4xl font-semibold tracking-tight text-white">${formatUsd(activeRecord.trxAmount * activeRecord.trxUsdRate)} <span className="text-xl text-cyan">USD</span></div></div><StatusBadge status={status === "failed" ? "Failed" : activeRecord.bridgeReachedAt ? "Reached bridge" : "In progress"} /></div>
      <div className="p-6"><TransferFlow active={status === "running"} /><div className="mb-6 flex items-start justify-between gap-6"><div><div className="font-semibold text-white">Progress toward bridge</div><div className="mt-1 text-xs text-slate-500">{formatPercent(progress)} of the configured {formatPercent(target)} target · {processed.toLocaleString()} of {activeRecord.trxAmount.toLocaleString()} TRX processed</div></div><div className="shrink-0 text-2xl font-semibold text-cyan">{formatPercent(progress)}</div></div><div className="mb-7 h-2 overflow-hidden rounded-full bg-slate-800"><motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan to-mint" /></div><div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3"><div className="min-h-[112px] rounded-2xl border border-cyan/20 bg-cyan/5 p-5"><div className="eyebrow">Time until bridge</div><div className="mt-3 font-mono text-2xl font-semibold text-cyan">{formatTime(remaining)}</div></div><div className="min-h-[112px] rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow">Bridge status</div><div className="mt-3 font-semibold text-amber-200">{bridgeStatus}</div></div><div className="min-h-[112px] rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow">Transfer created</div><div className="mt-3 text-sm leading-5 text-white">{new Date(activeRecord.startedAt).toLocaleString()}</div></div></div><div className="grid gap-8 lg:grid-cols-[1fr_.8fr]"><div className="rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow mb-4">Transfer stages</div><div className="space-y-3">{TRANSFER_STEPS.slice(0, 4).map((step, i) => <div key={step.id} className={`flex items-center gap-3 rounded-xl p-3 ${i === 0 ? "bg-cyan/10" : "bg-white/[.02]"}`}><div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan/30 text-xs text-cyan">{i + 1}</div><div><div className="text-sm font-semibold text-white">{step.label}</div><div className="text-xs text-slate-500">{i === 0 ? "Recorded" : "Pending bridge window"}</div></div></div>)}</div></div><div className="rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow mb-4">Saved transfer record</div><div className="space-y-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-white">{activeRecord.trxAmount.toLocaleString()} TRX</span></div><div className="flex justify-between"><span className="text-slate-500">USD value</span><span className="font-semibold text-mint">${formatUsd(activeRecord.trxAmount * activeRecord.trxUsdRate)}</span></div><div className="flex justify-between"><span className="text-slate-500">Reached bridge</span><span className="text-amber-200">{activeRecord.bridgeReachedAt ? new Date(activeRecord.bridgeReachedAt).toLocaleString() : "Pending"}</span></div><div className="flex justify-between"><span className="text-slate-500">Mainnet arrival</span><span className="text-mint">{activeRecord.mainnetArrivedAt ? new Date(activeRecord.mainnetArrivedAt).toLocaleString() : "Pending"}</span></div></div></div></div></div>
    </div>
    {status === "failed" && <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 p-5"><div className="font-semibold text-red-200">Transfer simulation paused</div><button onClick={() => { setFailureMode(false); start(); }} className="mt-3 rounded-xl bg-red-300 px-4 py-2.5 text-sm font-bold text-red-950">Retry</button></div>}
    <button onClick={() => setFailureMode(!failureMode)} className="mt-5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-slate-400">{failureMode ? "Failure simulation armed" : "Simulate Failure"}</button>
  </div>;
}
