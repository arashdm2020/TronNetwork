"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTransferStore } from "@/store/transfer-store";
import { transferDocumentPath } from "@/lib/transfer-link";
import type { TransferRecord } from "@/store/transfer-store";

export function TransferFlow({ active, record: externalRecord, showDocumentLink = true }: { active: boolean; record?: TransferRecord | null; showDocumentLink?: boolean }) {
  const storedRecord = useTransferStore(s => s.transferRecord);
  const record = externalRecord === undefined ? storedRecord : externalRecord;

  return <>
    <div className="relative flex items-center justify-between gap-3 py-8">
      <div className="absolute left-[17%] right-[17%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-violet-400 via-cyan to-mint opacity-50" />
      {active && <div className="absolute left-[17%] right-[17%] top-1/2 -translate-y-1/2 overflow-hidden"><motion.div animate={{ x: ["-10%", "110%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }} className="h-1 w-16 rounded-full bg-cyan shadow-[0_0_18px_#67e8f9]" /></div>}
      {[["Private Network", "Source vault", "⌂"], ["Gateway / Bridge", "Policy layer", "⇄"], ["Blockchain", "Destination", "◆"]].map(([title, sub, icon], i) => <div key={title} className="relative z-10 flex w-[30%] flex-col items-center text-center"><div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border text-xl ${i === 0 ? "border-violet-300/30 bg-violet-300/10 text-violet-200" : i === 1 ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-mint/30 bg-mint/10 text-mint"}`}>{icon}</div><div className="text-sm font-semibold text-white">{title}</div><div className="mt-1 text-xs text-slate-500">{sub}</div></div>)}
    </div>
    {record && showDocumentLink && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-3"><div><div className="eyebrow">Transfer document</div><div className="mono mt-1 text-xs text-cyan">{record.transferId}</div></div><Link href={transferDocumentPath(record)} className="rounded-lg border border-cyan/30 px-3 py-2 text-xs font-semibold text-cyan transition hover:bg-cyan/10">Open document</Link></div>}
  </>;
}
