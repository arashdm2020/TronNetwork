"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { decodeTransferRecord, transferDocumentPath } from "@/lib/transfer-link";
import { useTransferStore } from "@/store/transfer-store";
import styles from "./receipt.module.css";

const amount = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value: number | null) => value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC" : "Pending";
const countdown = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
};

function CopyButton({ value, label, primary = false }: { value: () => string; label: string; primary?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 3500);
    return () => window.clearTimeout(timer);
  }, [state]);
  return <span className={styles.copyControl}><button type="button" className={primary ? styles.primary : styles.button} onClick={async () => {
    try { await navigator.clipboard.writeText(value()); setState("copied"); }
    catch { setState("error"); }
  }}>{state === "copied" ? "✓ Copied" : label}</button><span role="status" className={styles.copyMessage}>{state === "error" ? "Copy unavailable. Select and copy the text manually." : state === "copied" ? "Copied to clipboard." : ""}</span></span>;
}

export default function TransferDocumentPage() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(0);
  const [sharedRecord, setSharedRecord] = useState<ReturnType<typeof decodeTransferRecord>>(null);
  const localDatabase = useTransferStore(s => s.localDatabase);
  const history = useTransferStore(s => s.transferHistory);
  const { transferId } = useParams<{ transferId: string }>();

  useEffect(() => {
    const shared = decodeTransferRecord(new URLSearchParams(window.location.search).get("data"));
    setSharedRecord(shared?.transferId === transferId ? shared : null);
    setNow(Date.now());
    setHydrated(true);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [transferId]);

  const record = sharedRecord || history?.find(item => item.transferId === transferId) || Object.values(localDatabase).find(item => item.transferId === transferId);
  if (!hydrated) return <div className={styles.page}><div className={styles.empty} role="status"><div className={styles.label}>TRANSFER RECEIPT</div><h1>Loading your receipt</h1><p>Preparing transfer details…</p></div></div>;
  if (!record) return <div className={styles.page}><div className={styles.empty}><div className={styles.label}>TRANSFER RECEIPT</div><h1>Receipt unavailable</h1><p>Open the complete document link provided by the sender to view this transfer.</p><Link className={styles.button} href="/transfer">Back to Transfer</Link></div></div>;

  const failed = record.status === "failed";
  const complete = record.status === "completed";
  const reached = complete || Boolean(record.bridgeReachedAt) || (!failed && now >= record.bridgeEtaAt);
  const ratio = Math.min(1, Math.max(0, (now - record.startedAt) / Math.max(1, record.bridgeEtaAt - record.startedAt)));
  const progress = complete ? 100 : failed ? Math.min(100, record.processedAmount / Math.max(1, record.trxAmount) * 100) : ratio * record.bridgeProgressTarget;
  const processed = complete ? record.trxAmount : failed ? record.processedAmount : record.trxAmount * progress / 100;
  const status = failed ? "Transfer paused" : complete ? "Completed" : reached ? "At the bridge" : "In progress";
  const arrivals = record.bridgeReachedAt || (reached ? record.bridgeEtaAt : null);
  const wallets = [{ title: "Sender wallet", subtitle: "Origin address", address: record.senderWallet }, { title: "Receiver wallet", subtitle: "Destination address", address: record.receiverWallet }];

  return <article className={styles.page}>
    <div className={styles.toolbar}><Link href="/transfer" className={styles.back}>← Transfer overview</Link><span className={styles.label}>SHARED TRANSFER RECEIPT</span></div>
    <header className={styles.heading}><div><h1>Transfer receipt<span>.</span></h1><p>Your transfer details and progress, in one place.</p></div><CopyButton primary label="Copy receipt link ↗" value={() => window.location.origin + transferDocumentPath(record)} /></header>
    <section className={styles.summary} aria-label="Transfer summary">
      <div className={styles.summaryTop}><span className={styles.label}>TRANSFER AMOUNT</span><span className={styles.status} data-state={failed ? "failed" : reached ? "done" : "active"}><i />{status}</span></div>
      <div className={styles.amount}>{amount(record.trxAmount)} <span>TRX</span></div>
      <p className={styles.usd}>≈ ${amount(record.trxAmount * record.trxUsdRate)} <span>USD · rate at creation</span></p>
      <div className={styles.metadata}><div><span className={styles.label}>RECEIPT ID</span><strong className={styles.mono}>{record.transferId}</strong></div><div><span className={styles.label}>CREATED AT</span><strong>{date(record.startedAt)}</strong></div><div><span className={styles.label}>ASSET</span><strong><span className={styles.assetDot}>T</span> TRON <span className={styles.muted}>/ TRX</span></strong></div></div>
    </section>

    <div className={styles.mainGrid}>
      <section className={styles.panel} aria-labelledby="journey-title">
        <div className={styles.sectionHeading}><div><span className={styles.label}>TRANSFER JOURNEY</span><h2 id="journey-title">{failed ? "Transfer needs attention" : reached ? "Bridge window reached" : "On the way to the bridge"}</h2></div><span className={styles.stage}>01 — 03</span></div>
        <p className={styles.description}>{failed ? "Processing is paused. Contact the sender for an updated receipt." : complete ? "The saved record marks this transfer as completed." : reached ? "The bridge processing window has ended. Mainnet arrival is still pending." : "Processing follows the original transfer schedule. This receipt updates automatically."}</p>
        <div className={styles.route} aria-label="Private network to bridge; blockchain pending">
          <div className={styles.track}><div className={styles.travel} data-moving={!failed && !reached} /></div>
          {[["⌂", "Private network", "Source"], ["⇄", "Gateway / Bridge", reached ? "Window reached" : "Processing"], ["◇", "Blockchain", complete ? "Completed" : "Pending"]].map(([icon, title, subtitle], index) => <div key={title} className={styles.node} data-state={index === 2 ? complete ? "done" : "pending" : failed ? "pending" : reached ? "done" : "active"}><div className={styles.nodeIcon} aria-hidden="true">{icon}</div><strong>{title}</strong><span>{subtitle}</span></div>)}
        </div>
        <div className={styles.progressHeading}><div><h3>Progress toward bridge</h3><p>{amount(processed)} TRX processed</p></div><strong>{progress.toFixed(2)}<span>%</span></strong></div>
        <div className={styles.progress} role="progressbar" aria-label="Transfer processing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(progress.toFixed(2))}><div style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
        <div className={styles.progressFoot}><span>Based on the saved schedule</span><span>Bridge target <strong>{record.bridgeProgressTarget.toFixed(2)}%</strong></span></div>
      </section>
      <aside className={styles.schedule} aria-label="Transfer schedule">
        <span className={styles.label}>TIME UNTIL BRIDGE</span><div className={styles.countdown}>{failed ? "Paused" : countdown(record.bridgeEtaAt - now)}</div><p>{reached ? "Bridge window reached" : `${record.durationHours}-hour processing window`}</p>
        <ol className={styles.events}>{[{ label: "Transfer created", value: date(record.startedAt), done: true }, { label: "Expected at bridge", value: date(record.bridgeEtaAt), done: reached }, { label: "Mainnet arrival", value: date(record.mainnetArrivedAt), done: Boolean(record.mainnetArrivedAt) }].map(item => <li key={item.label} data-done={item.done}><i /><div><strong>{item.label}</strong><span>{item.value}</span></div></li>)}</ol>
      </aside>
    </div>

    <section className={styles.panel} aria-labelledby="wallet-title"><div className={styles.sectionHeading}><div><span className={styles.label}>WALLET ROUTE</span><h2 id="wallet-title">From sender to receiver</h2></div><span className={styles.stage}>TRON ADDRESS DETAILS</span></div>
      <div className={styles.walletGrid}>{wallets.map((wallet, index) => <div className={styles.wallet} key={wallet.title}><div className={styles.walletHeader}><span className={styles.walletIcon} aria-hidden="true">{index === 0 ? "↗" : "↙"}</span><div><h3>{wallet.title}</h3><p>{wallet.subtitle}</p></div></div><a className={styles.address} href={`https://tronscan.org/#/address/${encodeURIComponent(wallet.address)}`} target="_blank" rel="noopener noreferrer">{wallet.address}</a><div className={styles.walletActions}><a href={`https://tronscan.org/#/address/${encodeURIComponent(wallet.address)}`} target="_blank" rel="noopener noreferrer">View on TronScan ↗</a><CopyButton label="Copy address" value={() => wallet.address} /></div></div>)}</div>
    </section>

    <section className={styles.panel} aria-labelledby="details-title"><div className={styles.sectionHeading}><div><span className={styles.label}>RECORD DETAILS</span><h2 id="details-title">Transfer information</h2></div></div><dl className={styles.details}>{[
      ["Current status", status], ["Wallet role", record.role], ["Recorded stage", record.currentStage],
      ["Bridge arrival", date(arrivals)], ["Mainnet arrival", date(record.mainnetArrivedAt)], ["TRX / USD at creation", `$${record.trxUsdRate.toFixed(6)}`],
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <footer className={styles.footer}><span>TransferApp <span> / Transfer receipt</span></span><p>Real receipt · Real-funds blockchain transaction. Shared link data is independently verified.</p></footer>
  </article>;
}
