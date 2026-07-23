"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  CreditCard,
  FileText,
  Layers,
  LogOut,
  Menu,
  User,
  Wallet,
  X,
} from "lucide-react";
import { usePof } from "@/lib/store";
import { LiveDot, Pill, PofMark, btn, cx } from "@/components/ui";
import { fmt } from "@/lib/format";

const LINKS = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Engine", href: "#engine" },
  { label: "Cycles", href: "#cycles" },
  { label: "Launch", href: "#launch" },
  { label: "Docs", href: "#docs" },
];

export function TopNav() {
  const { user, wallet, openModal, disconnect, toast, gate } = usePof();
  const [menu, setMenu] = useState<"user" | "bell" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenus = () => setMenu(null);

  const dropdownItem =
    "flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-secondary transition-colors hover:bg-panel2 hover:text-text";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      {menu ? <div className="fixed inset-0 z-40" onClick={closeMenus} /> : null}
      <div className="mx-auto flex h-12 max-w-page items-center gap-4 px-4">
        {/* wordmark */}
        <a href="#dashboard" className="flex shrink-0 items-center gap-2">
          <PofMark size={20} className="animate-spin-slow text-accent" />
          <span className="font-mono text-sm font-bold tracking-tight text-text">
            POF<span className="text-accent">_</span>
          </span>
          <span className="hidden font-mono text-3xs uppercase tracking-[0.18em] text-muted lg:block">
            proof of flywheel
          </span>
        </a>

        {/* links */}
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-panel2 hover:text-text"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* status pills */}
        <div className="hidden items-center gap-2 xl:flex">
          <Pill tone="green">
            <LiveDot /> genesis engine live
          </Pill>
          <Pill tone="amber">simulation mode</Pill>
        </div>

        <div className="flex-1" />

        {/* auth area */}
        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <>
              <button onClick={() => openModal("signin")} className={btn.ghost}>
                Sign In
              </button>
              <button onClick={() => openModal("wallet")} className={btn.outline}>
                <Wallet size={13} /> Connect Wallet
              </button>
              <button
                onClick={() => gate("wallet", () => scrollToLaunch())}
                className={btn.primary}
              >
                Launch Your Flywheel
              </button>
            </>
          ) : (
            <>
              {!wallet ? (
                <button onClick={() => openModal("wallet")} className={btn.outline}>
                  <Wallet size={13} /> Connect Wallet
                </button>
              ) : (
                <div className="flex h-8 items-center gap-2 whitespace-nowrap rounded border border-line bg-panel px-2.5 font-mono text-2xs">
                  <span className="text-accent">{wallet.address}</span>
                  <span className="text-line-strong">|</span>
                  <span className="text-secondary">{fmt(wallet.balance, 2)} SOL</span>
                  <span className="rounded-sm border border-accent/30 bg-accent/10 px-1 py-px text-3xs uppercase tracking-wider text-accent">
                    {wallet.network}
                  </span>
                </div>
              )}

              {/* notifications */}
              <div className="relative">
                <button
                  onClick={() => setMenu(menu === "bell" ? null : "bell")}
                  aria-label="Notifications"
                  className="relative flex h-8 w-8 items-center justify-center rounded border border-line text-secondary transition-colors hover:border-accent/40 hover:text-text"
                >
                  <Bell size={14} />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                </button>
                {menu === "bell" ? (
                  <div className="absolute right-0 top-10 z-50 w-64 animate-modal-in rounded-md border border-line bg-panel p-1.5">
                    <p className="px-2.5 pb-1 pt-1.5 font-mono text-3xs uppercase tracking-wider text-muted">
                      notifications
                    </p>
                    <div className={dropdownItem}>
                      <LiveDot />
                      <span>epoch processing — genesis engine turning</span>
                    </div>
                    <div className={dropdownItem}>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                      <span>slot #02 applications are open</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* user dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenu(menu === "user" ? null : "user")}
                  className="flex h-8 items-center gap-1.5 rounded border border-line pl-1 pr-2 transition-colors hover:border-accent/40"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/15 font-mono text-2xs font-bold text-accent">
                    G
                  </span>
                  <ChevronDown size={13} className="text-muted" />
                </button>
                {menu === "user" ? (
                  <div className="absolute right-0 top-10 z-50 w-56 animate-modal-in rounded-md border border-line bg-panel p-1.5">
                    <div className="border-b border-line px-2.5 py-2">
                      <p className="text-xs font-semibold text-text">{user.name}</p>
                      <p className="font-mono text-2xs text-accent">{user.username}</p>
                      <p className="mt-1 font-mono text-3xs uppercase tracking-wider text-muted">
                        {user.role} · {user.plan} plan
                      </p>
                    </div>
                    <div className="pt-1">
                      {[
                        { icon: User, label: "Profile" },
                        { icon: Layers, label: "My Engines", href: "#launch" },
                        { icon: FileText, label: "Draft Engines", href: "#launch" },
                        { icon: CreditCard, label: "Billing" },
                        { icon: FileText, label: "Documentation", href: "#docs" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          className={dropdownItem}
                          onClick={() => {
                            closeMenus();
                            if (item.href) {
                              document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth" });
                            } else {
                              toast(`${item.label.toLowerCase()} — not part of this showcase`, "info");
                            }
                          }}
                        >
                          <item.icon size={13} className="text-muted" /> {item.label}
                        </button>
                      ))}
                      <button
                        className={cx(dropdownItem, "text-negative hover:text-negative")}
                        onClick={() => {
                          closeMenus();
                          disconnect();
                        }}
                      >
                        <LogOut size={13} /> Disconnect
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* mobile toggle */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded border border-line text-secondary md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={15} /> : <Menu size={15} />}
        </button>
      </div>

      {/* mobile menu */}
      {mobileOpen ? (
        <div className="border-t border-line bg-panel px-4 py-3 md:hidden">
          <div className="mb-3 flex flex-wrap gap-2">
            <Pill tone="green">
              <LiveDot /> genesis live
            </Pill>
            <Pill tone="amber">simulation</Pill>
          </div>
          <nav className="grid grid-cols-2 gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded px-2 py-2 text-xs font-medium text-secondary hover:bg-panel2"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex gap-2 border-t border-line pt-3">
            {!user ? (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openModal("signin");
                  }}
                  className={`${btn.outline} flex-1 justify-center`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openModal("wallet");
                  }}
                  className={`${btn.primary} flex-1 justify-center`}
                >
                  <Wallet size={13} /> Connect Wallet
                </button>
              </>
            ) : (
              <div className="flex w-full items-center justify-between">
                <div className="font-mono text-2xs text-secondary">
                  {wallet ? (
                    <span className="text-accent">{wallet.address}</span>
                  ) : (
                    user.username
                  )}
                  {wallet ? ` · ${fmt(wallet.balance, 2)} SOL` : ""}
                </div>
                <button onClick={disconnect} className={btn.small}>
                  <LogOut size={11} /> disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function scrollToLaunch() {
  document.querySelector("#launch")?.scrollIntoView({ behavior: "smooth" });
}
