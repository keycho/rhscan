import type { Metadata } from "next";
import { INDEPENDENCE_NOTICE, LegalShell } from "@/components/legal";

export const metadata: Metadata = {
  title: "risk disclosure — proof of flywheel",
};

export default function RisksPage() {
  return (
    <LegalShell
      title="risk disclosure"
      updated="july 2026"
      sections={[
        {
          heading: "1. read this first",
          body: [
            "Using Proof of Flywheel involves significant risk. Only deposit claimed creator rewards you can afford to lose entirely.",
            INDEPENDENCE_NOTICE,
          ],
        },
        {
          heading: "2. market risk",
          body: [
            "Digital assets are extremely volatile. The value of any token, including tokens with an active flywheel, can go to zero. Routing rewards into liquidity, burns or holder incentives does not guarantee price appreciation, liquidity depth or trading activity. Past cycles are not indicative of future results.",
          ],
        },
        {
          heading: "3. protocol and smart-contract risk",
          body: [
            "Software can contain bugs and vulnerabilities. Routing logic, allocation modes and cycle execution may behave unexpectedly, be exploited, or become unavailable. Deposited funds may be lost irrecoverably.",
          ],
        },
        {
          heading: "4. third-party platform risk",
          body: [
            "Creator rewards originate on platforms the Protocol does not control, including Pump.fun. Changes to those platforms — their fee mechanics, claiming process, availability or policies — can materially affect or entirely break a flywheel strategy. You must claim rewards on the originating platform yourself; the Protocol only routes what you deposit afterwards.",
          ],
        },
        {
          heading: "5. irreversibility",
          body: [
            "Once a routing cycle executes, the resulting transactions cannot be reversed by the Protocol or anyone else. Burned supply is permanently destroyed.",
          ],
        },
        {
          heading: "6. regulatory risk",
          body: [
            "The regulatory treatment of digital assets varies by jurisdiction and is evolving. You are responsible for determining whether your use of the Protocol is lawful where you live, and for any tax obligations arising from claims, deposits and routed distributions.",
          ],
        },
        {
          heading: "7. no guarantees",
          body: [
            "Token performance, liquidity and returns are never guaranteed. Nothing in the interface is a promise of outcome, yield or profit.",
          ],
        },
      ]}
    />
  );
}
