import "./globals.css";
import { Shell } from "@/components/shell";
export const metadata = { title: "TransferApp — Vault operations", description: "A front-end-only vault transfer live." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body><Shell>{children}</Shell></body></html>; }
