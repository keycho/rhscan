import type { Metadata } from "next";
import { INDEPENDENCE_NOTICE, LegalShell } from "@/components/legal";

export const metadata: Metadata = {
  title: "terms — proof of flywheel",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="terms of use"
      updated="july 2026"
      sections={[
        {
          heading: "1. acceptance",
          body: [
            "By accessing or using the Proof of Flywheel interface (\"the Protocol\", \"POF\"), you agree to these Terms of Use, the Privacy Policy and the Risk Disclosure. If you do not agree, do not use the Protocol.",
          ],
        },
        {
          heading: "2. what the protocol does",
          body: [
            "Proof of Flywheel provides configurable routing of creator rewards that you deposit into it. The Protocol does not, and cannot, claim, pull or receive creator rewards on your behalf from Pump.fun or any other platform. You must claim your creator rewards yourself on the originating platform and then deposit them into the Protocol. Only routing that occurs after your deposit may be automated.",
            INDEPENDENCE_NOTICE,
          ],
        },
        {
          heading: "3. eligibility and authorisation",
          body: [
            "You may only activate a flywheel or deposit rewards for a token if you control, or are duly authorised to use, that token's creator wallet. You are solely responsible for confirming that authorisation before every deposit and for all activity performed with your wallet.",
          ],
        },
        {
          heading: "4. no custody, no advice",
          body: [
            "The Protocol is non-custodial software. Nothing in the interface is investment, financial, legal or tax advice. Allocation modes, wheel speed, momentum and similar indicators are informational mechanics of the Protocol, not recommendations or predictions.",
          ],
        },
        {
          heading: "5. fees and irreversibility",
          body: [
            "Blockchain transactions are irreversible. Deposits routed through a cycle cannot be recalled by the Protocol. You are responsible for verifying amounts, allocation weights and destination configuration before executing a cycle.",
          ],
        },
        {
          heading: "6. prohibited use",
          body: [
            "You may not use the Protocol to violate any law or regulation, to infringe third-party rights, to manipulate markets, or in any jurisdiction where use of the Protocol would be unlawful.",
          ],
        },
        {
          heading: "7. disclaimers and limitation of liability",
          body: [
            "The Protocol is provided \"as is\" and \"as available\", without warranties of any kind. To the maximum extent permitted by law, Proof of Flywheel and its contributors shall not be liable for any indirect, incidental, special, consequential or exemplary damages, or for any loss of tokens, profits, data or goodwill, arising from your use of the Protocol.",
          ],
        },
        {
          heading: "8. changes",
          body: [
            "These Terms may be updated from time to time. Continued use of the Protocol after changes take effect constitutes acceptance of the revised Terms.",
          ],
        },
      ]}
    />
  );
}
