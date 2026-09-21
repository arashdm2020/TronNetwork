"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionTitle, StatusBadge } from "@/components/shell";
import { TRANSFER_STEPS } from "@/lib/config";
import { useLiveStore } from "@/store/transfer-store";

const BRIDGE_STEPS = TRANSFER_STEPS.slice(0, 4);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;
const formatDate = (value: number | null) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Pending";

export default function TimelinePage() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(0);
  const record = useLiveStore(s => s.transferRecord);
  const waitForBridge = useLiveStore(s => s.waitForBridge);

  useEffect(() => {
    setHydrated(true);
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (record?.status === "running" && now >= record.bridgeEtaAt) waitForBridge();
  }, [record?.status, record?.bridgeEtaAt, now, waitForBridge]);

  if (!hydrated) return <div className="py-12 text-sm text-slate-500">Loading transfer timeline…</div>;

  const durationMs = record ? record.durationHours * 60 * 60 * 1000 : 1;
  const elapsed = record ? Math.max(0, now - record.startedAt) : 0;
  const target = record?.bridgeProgressTarget || 0;
  const progress = record ? Math.min(target, (elapsed / durationMs) * target) : 0;
  const bridgeReached = Boolean(record?.bridgeReachedAt) || progress >= target && Boolean(record);
  const ratio = target > 0 ? Math.min(1, progress / target) : 0;
  const current = record ? Math.min(BRIDGE_STEPS.length - 1, Math.floor(ratio * BRIDGE_STEPS.length)) : 0;
  const status = !record ? "Waiting" : bridgeReached ? "Reached bridge" : "In progress";

  return <div>
    <SectionTitle eyebrow="Presentation mode / 03" title="The transfer story" description="A live timeline of the saved transfer. This view ends at the Gateway / Bridge until the configured bridge time is reached." />
    {!record && <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">No transfer has been created yet. Start a transfer from the Transfer page to populate this timeline.</div>}
    <div className="glass rounded-2xl p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><div className="font-semibold text-white">Time-based bridge timeline</div><div className="mt-1 text-xs text-slate-500">{record ? `${formatPercent(progress)} of the configured ${formatPercent(target)} bridge target` : "Waiting for a saved transfer"}</div></div><div className="flex items-center gap-3"><StatusBadge status={status} />{record && <Link href={`/transfer/${encodeURIComponent(record.transferId)}`} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan/40 hover:text-white">Open transfer</Link>}</div></div>
      <div className="relative"><div className="absolute bottom-0 left-5 top-0 w-px bg-line md:left-1/2 md:-translate-x-1/2" /><motion.div animate={{ height: `${ratio * 100}%` }} className="absolute left-5 top-0 w-px bg-gradient-to-b from-cyan to-mint md:left-1/2 md:-translate-x-1/2" />{BRIDGE_STEPS.map((step, i) => { const done = bridgeReached ? true : i < current; const active = !bridgeReached && i === current; return <motion.button key={step.id} onClick={() => undefined} initial={{ opacity: 0, y: 12 }} animate={{ opacity: i <= current || bridgeReached ? 1 : .45, y: 0 }} transition={{ delay: i * .08 }} className={`relative mb-8 flex w-full items-start gap-5 text-left last:mb-0 md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right md:flex-row-reverse"}`}><span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm ${active ? "border-cyan bg-cyan text-ink shadow-[0_0_22px_rgba(103,232,249,.35)]" : done ? "border-mint bg-mint/15 text-mint" : "border-line bg-panel text-slate-500"}`}>{done ? "✓" : step.icon}</span><span className="pt-1"><span className="eyebrow">{String(i + 1).padStart(2, "0")} · {record ? formatDate(record.startedAt + (durationMs / BRIDGE_STEPS.length) * i) : "Waiting"}</span><span className="mt-1 block text-base font-semibold text-white">{step.label}</span><span className="mt-1 block text-sm leading-6 text-slate-500">{step.description}</span>{active && <span className="mt-2 block text-xs font-semibold text-cyan">Processing according to the saved transfer time</span>}</span></motion.button>; })}</div>
      <div className="mt-8 grid gap-4 border-t border-line pt-6 md:grid-cols-3"><div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4"><div className="eyebrow">Bridge target</div><div className="mt-2 text-xl font-semibold text-cyan">{record ? formatPercent(target) : "—"}</div></div><div className="rounded-xl border border-line bg-black/20 p-4"><div className="eyebrow">Bridge arrival</div><div className="mt-2 text-sm text-white">{formatDate(record?.bridgeReachedAt || null)}</div></div><div className="rounded-xl border border-line bg-black/20 p-4"><div className="eyebrow">After bridge</div><div className="mt-2 text-sm text-slate-500">Hidden until bridge arrival</div></div></div>
    </div>
  </div>;
}
