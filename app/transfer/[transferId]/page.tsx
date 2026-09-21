"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SectionTitle, StatusBadge } from "@/components/shell";
import { decodeTransferRecord, transferDocumentPath } from "@/lib/transfer-link";
import { TransferFlow } from "@/components/transfer-flow";
import { useTransferStore } from "@/store/transfer-store";

const formatDate = (value: number | null) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Pending";
const formatAmount = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const maskWallet = (value: string) => value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;

export default function TransferDocumentPage() {
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(0);
  const [sharedRecord, setSharedRecord] = useState<ReturnType<typeof decodeTransferRecord>>(null);
  const localDatabase = useTransferStore(s => s.localDatabase);
  const params = useParams<{ transferId: string }>();
  const transferId = decodeURIComponent(params.transferId || "");

  useEffect(() => {
    setHydrated(true);
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    const shared = decodeTransferRecord(new URLSearchParams(window.location.search).get("data"));
    if (shared?.transferId === transferId) setSharedRecord(shared);
    return () => window.clearInterval(interval);
  }, [transferId]);

  const localRecord = useMemo(() => Object.values(localDatabase).find(item => item.transferId === transferId), [localDatabase, transferId]);
  const record = sharedRecord || localRecord;

  if (!hydrated) return <div className="py-12 text-sm text-slate-500">Loading transfer document…</div>;
  if (!record) return <div className="py-12"><SectionTitle eyebrow="Transfer document" title="Document not found" description="This transfer link is missing its transfer data." /><Link href="/transfer" className="inline-flex rounded-xl bg-cyan px-4 py-3 text-sm font-bold text-ink">Back to Transfer</Link></div>;

  const elapsed = Math.max(0, now - record.startedAt);
  const durationMs = record.durationHours * 60 * 60 * 1000;
  const progress = Math.min(record.bridgeProgressTarget, (elapsed / durationMs) * record.bridgeProgressTarget);
  const bridgeReached = Boolean(record.bridgeReachedAt) || now >= record.bridgeEtaAt;
  const amountProcessed = Math.min(record.trxAmount, record.trxAmount * progress / 100);
  const statusLabel = record.status === "completed" ? "Completed" : record.status === "failed" ? "Failed" : bridgeReached ? "Reached bridge" : "In progress";
  const copyDocumentLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${transferDocumentPath(record)}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="py-2">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <SectionTitle eyebrow="Transfer document" title="Transfer certificate" description="A persistent, read-only record of this simulated vault transfer." />
      <StatusBadge status={statusLabel} />
    </div>
    <div className="glass mb-6 rounded-2xl p-6 md:p-8"><div className="mb-2 font-semibold text-white">Live transfer movement</div><div className="mb-5 text-xs text-slate-500">This animation follows the saved transfer time and stops at the Gateway / Bridge.</div><TransferFlow active={record.status === "running" && !bridgeReached} record={record} showDocumentLink={false} /><div className="flex items-center justify-between gap-4 border-t border-line pt-5"><div><div className="eyebrow">Progress toward bridge</div><div className="mt-1 text-xs text-slate-500">{progress.toFixed(2)}% · {amountProcessed.toLocaleString("en-US", { maximumFractionDigits: 2 })} TRX processed</div></div><div className="text-xl font-semibold text-cyan">{progress.toFixed(2)}%</div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div style={{ width: `${progress}%` }} className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan to-mint transition-[width] duration-1000" /></div></div>
    <div className="glass overflow-hidden rounded-2xl">
      <div className="border-b border-line bg-white/[.02] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><div className="eyebrow mb-3">Document ID</div><div className="mono text-xl font-semibold text-cyan">{record.transferId}</div><div className="mt-2 text-xs text-slate-500">Created {formatDate(record.startedAt)}</div></div>
          <div className="text-left md:text-right"><div className="eyebrow mb-2">Transfer amount</div><div className="text-4xl font-semibold tracking-tight text-white">{formatAmount(record.trxAmount)} <span className="text-xl text-cyan">TRX</span></div><div className="mt-1 text-sm text-slate-400">≈ ${formatAmount(record.trxAmount * record.trxUsdRate)} USD</div></div>
        </div>
      </div>
      <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
        <div className="rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow mb-4">Wallet route</div><dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Sender wallet</dt><dd className="mono text-right text-white">{maskWallet(record.senderWallet)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Receiver wallet</dt><dd className="mono text-right text-white">{maskWallet(record.receiverWallet)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Wallet role</dt><dd className="text-white">{record.role}</dd></div></dl></div>
        <div className="rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow mb-4">Transfer status</div><dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Current stage</dt><dd className="text-right text-white">{record.currentStage}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Amount processed</dt><dd className="text-white">{formatAmount(record.processedAmount)} TRX</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Bridge amount</dt><dd className="text-amber-200">{formatAmount(record.bridgeAmount)} TRX</dd></div></dl></div>
        <div className="rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow mb-4">Transfer timeline</div><dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Transfer created</dt><dd className="text-right text-white">{formatDate(record.startedAt)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Bridge arrival</dt><dd className="text-right text-amber-200">{formatDate(record.bridgeReachedAt)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Mainnet arrival</dt><dd className="text-right text-mint">{formatDate(record.mainnetArrivedAt)}</dd></div></dl></div>
        <div className="rounded-2xl border border-line bg-black/20 p-5"><div className="eyebrow mb-4">Configured simulation</div><dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Time until bridge</dt><dd className="text-white">{record.durationHours} hours</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Progress target</dt><dd className="text-white">{record.bridgeProgressTarget}%</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Network fee</dt><dd className="text-white">Demo configured</dd></div></dl></div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-line p-6 md:p-8"><button onClick={copyDocumentLink} className="rounded-xl bg-cyan px-4 py-3 text-sm font-bold text-ink">{copied ? "Link copied" : "Copy document link"}</button><Link href="/transfer" className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan/40 hover:text-white">Back to Transfer</Link></div>
    </div>
    <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">Demo document — no real funds or blockchain transaction is represented.</div>
  </div>;
}
