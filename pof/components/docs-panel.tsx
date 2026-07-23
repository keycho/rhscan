"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, FileText, TerminalSquare } from "lucide-react";
import { usePof } from "@/lib/store";
import { DOCS } from "@/data/mock-data";
import { Panel, PanelHeader, Pill } from "@/components/ui";

const SNIPPET = [
  "$ pof init --token <address>",
  "  ✓ manifest written  engine.pof.json",
  "$ pof mode momentum --weights 35/25/20/10/10",
  "$ pof publish --slug my-wheel",
  "  → pof.fun/e/my-wheel  (public)",
];

export function DocsPanel() {
  const { toast } = usePof();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("clipboard unavailable in this browser", "info");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <PanelHeader title="docs / integration" right={<Pill tone="neutral">v0.4</Pill>} />
        <div className="divide-y divide-line/60">
          {DOCS.map((d) => (
            <button
              key={d.title}
              onClick={() => toast(`"${d.title.toLowerCase()}" — docs are visual-only in this showcase`, "info")}
              className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel2/50"
            >
              <FileText size={14} className="shrink-0 text-muted group-hover:text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-semibold text-text">{d.title}</p>
                <p className="font-mono text-3xs text-faint">{d.meta}</p>
              </div>
              <ArrowUpRight
                size={13}
                className="shrink-0 text-faint transition-colors group-hover:text-accent"
              />
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader
          title={
            <span className="flex items-center gap-1.5">
              <TerminalSquare size={12} /> quickstart
            </span>
          }
          right={
            <button
              onClick={copy}
              aria-label="Copy snippet"
              className="text-faint transition-colors hover:text-secondary"
            >
              {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
            </button>
          }
        />
        <div className="flex-1 space-y-1 bg-bg px-4 py-3 font-mono text-2xs leading-5">
          {SNIPPET.map((line) => (
            <p
              key={line}
              className={
                line.startsWith("$")
                  ? "text-secondary"
                  : line.includes("✓")
                    ? "text-accent"
                    : "text-faint"
              }
            >
              {line}
            </p>
          ))}
        </div>
        <div className="border-t border-line px-4 py-2">
          <p className="font-mono text-3xs text-faint">
            cli shown for flavor — setup runs from the dashboard
          </p>
        </div>
      </Panel>
    </div>
  );
}
