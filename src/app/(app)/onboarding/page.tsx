import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

import "@/styles/onboarding.css";

export default function OnboardingPage() {
  return (
    <section style={{ maxWidth: 560 }}>
      <OnboardingFlow />
    </section>
  );
}
