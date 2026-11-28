import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

import "@/styles/onboarding.css";
import "@/styles/guardian.css";

export default function OnboardingPage() {
  return (
    <section style={{ maxWidth: 560 }}>
      <OnboardingFlow />
    </section>
  );
}
