"use client";

import { useState } from "react";
import { ChevronDown, Copy, LogOut, Search, Wallet, X } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePof } from "@/lib/store";
import { X_URL } from "@/data/mock-data";
import { SOLANA_NETWORK, shortAddress } from "@/components/solana-provider";
import { useSolBalance } from "@/lib/use-sol-balance";
import { PofMark, btn } from "@/components/ui";
import { fmt } from "@/lib/format";

const LINKS = [
  { label: "dashboard", href: "#top" },
  { label: "flywheels", href: "#flywheels" },
  { label: "activity", href: "#activity" },
  { label: "docs", href: "#docs" },
];

export function TopNav() {
  const { openModal, toast, searchQuery, setSearchQuery } = usePof();
  const { connected, publicKey, disconnect } = useWallet();
  const balance = useSolBalance();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const address = publicKey?.toBase58() ?? "";

  return (
    <header id="top" className="border-b border-line bg-bg">
      {menuOpen ? <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} /> : null}
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 px-4">
        <a href="#top" className="mr-1 flex shrink-0 items-center text-accent">
          <PofMark size={22} />
        </a>

        <nav className="flex items-center gap-0.5 overflow-x-auto text-xs [scrollbar-width:none]">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap px-1.5 py-1 text-secondary transition hover:text-accent"
          >
            [ x ]
          </a>
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="whitespace-nowrap px-1.5 py-1 text-secondary transition hover:text-accent"
            >
              [ {l.label} ]
            </a>
          ))}
        </nav>

        <div className="flex-1" />

        {/* search */}
        <div className="flex items-center gap-1.5">
          {searchOpen ? (
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") setSearchOpen(false);
              }}
              placeholder="find a flywheel..."
              className="h-8 w-36 rounded border border-line-strong bg-panel px-2 text-2xs text-text placeholder:text-faint outline-none focus:border-accent"
            />
          ) : null}
          <button
            aria-label="Search flywheels"
            onClick={() => {
              setSearchOpen((v) => !v);
              document.querySelector("#flywheels")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex h-8 w-8 items-center justify-center rounded border border-line text-secondary transition hover:border-accent hover:text-accent"
          >
            {searchOpen ? <X size={13} /> : <Search size={13} />}
          </button>
        </div>

        {/* real wallet state */}
        {!connected ? (
          <button onClick={() => openModal("wallet")} className={btn.solid}>
            <Wallet size={13} /> connect creator wallet
          </button>
        ) : (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 items-center gap-2 whitespace-nowrap rounded border border-accent/50 bg-panel px-2.5 text-2xs transition hover:border-accent"
            >
              <span className="text-accent">{shortAddress(address)}</span>
              <span className="text-faint">·</span>
              <span className="text-secondary">
                {balance !== null ? `${fmt(balance, 2)} SOL` : "—"}
              </span>
              <ChevronDown size={12} className="text-muted" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-11 z-50 w-64 animate-modal-in rounded border border-line bg-panel p-2">
                <div className="border-b border-line px-2 pb-2">
                  <p className="break-all text-2xs text-accent">{address}</p>
                  <p className="mt-1 text-3xs text-muted">
                    {SOLANA_NETWORK} ·{" "}
                    {balance !== null ? `${fmt(balance, 4)} SOL` : "balance unavailable"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(address);
                      toast("address copied", "info");
                    } catch {
                      toast("clipboard unavailable", "info");
                    }
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-2xs text-secondary transition hover:bg-panel2"
                >
                  <Copy size={12} /> copy address
                </button>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await disconnect();
                    toast("wallet disconnected", "info");
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-2xs text-negative transition hover:bg-panel2"
                >
                  <LogOut size={12} /> disconnect
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
