const FAQS = [
  {
    question: "Is NextRep only for volleyball?",
    answer:
      "Yes, for now. NextRep is built specifically around volleyball training and recovery patterns, from phase-based periodization to shoulder and knee work aimed at the demands of the sport. Other sports are on the roadmap, but there's no committed timeline yet."
  },
  {
    question: "Do athletes need to pay?",
    answer:
      "No. Athletes join a team through their coach's invite code at no cost to them. The team or program is what's on a paid plan."
  },
  {
    question: "Do I need to create my own workouts?",
    answer:
      "No. Every team starts on a structured, phase-based 20-week program out of the box. Coaches can also customize it, from picking a preset substitute for any exercise up to fully editing a day's program on the Program plan."
  },
  {
    question: "Is NextRep medical software?",
    answer:
      "No. NextRep helps you record and monitor wellness and discomfort information over time and helps identify patterns worth a closer look. It doesn't diagnose, treat, or prevent any medical condition, and it isn't a substitute for a doctor, athletic trainer, or physical therapist."
  },
  {
    question: "Can athletes use it independently, without a team?",
    answer:
      "Yes. You can sign up and log workouts, track recovery check-ins, and see your own stats and PRs without ever joining a team. Joining a team adds your coach's program and gives them visibility into your recovery trends on top of that."
  }
];

export function FAQSection() {
  return (
    <div className="landing-faq-list">
      {FAQS.map((item) => (
        <details className="landing-faq-item" key={item.question}>
          <summary>{item.question}</summary>
          <p className="muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
