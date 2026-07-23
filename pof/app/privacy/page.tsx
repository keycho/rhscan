import type { Metadata } from "next";
import { LegalShell } from "@/components/legal";

export const metadata: Metadata = {
  title: "privacy — proof of flywheel",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="privacy policy"
      updated="july 2026"
      sections={[
        {
          heading: "1. overview",
          body: [
            "Proof of Flywheel is designed to operate with as little personal data as possible. This policy describes what the interface stores, and what it does not.",
          ],
        },
        {
          heading: "2. what we store",
          body: [
            "The interface stores session preferences and configuration (such as sign-in state, connected wallet display data and engine drafts) locally in your browser's storage. This data stays on your device and can be removed at any time by disconnecting or clearing your browser storage.",
          ],
        },
        {
          heading: "3. on-chain data",
          body: [
            "Blockchain transactions are public by design. Deposits, routing cycles, burns and allocations executed through the Protocol are recorded on the underlying network and are visible to anyone. The Protocol cannot delete or alter on-chain records.",
          ],
        },
        {
          heading: "4. what we do not do",
          body: [
            "We do not sell personal data. We do not request private keys or seed phrases — never share them with anyone. The interface does not require an email address or identity documents to view public dashboards.",
          ],
        },
        {
          heading: "5. third parties",
          body: [
            "The interface may link to third-party platforms such as Pump.fun, wallet providers and social networks. Their processing of your data is governed by their own policies, which we do not control.",
          ],
        },
        {
          heading: "6. changes and contact",
          body: [
            "This policy may be updated from time to time; the latest version will always be available at this address. Questions can be raised through the community channels listed in the footer.",
          ],
        },
      ]}
    />
  );
}
