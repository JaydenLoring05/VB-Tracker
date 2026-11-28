/**
 * One short recovery tip for a rest day on the Today screen (N-02). Written
 * so a 10-year-old and a college athlete both get something out of it, with
 * no equipment needed. The tip changes each day and is the same all day.
 */
export const RECOVERY_TIPS = [
  "Sleep is your best recovery tool. Aim for 8 to 10 hours tonight.",
  "Go for an easy 20-minute walk. Moving a little helps sore legs feel better.",
  "Drink water through the day. A good check: your pee should be light yellow.",
  "Stretch your calves and hips for 5 minutes before bed.",
  "Eat a real meal with protein (eggs, chicken, beans, yogurt) to help your muscles rebuild.",
  "Foam roll or massage your legs for 5 minutes, slow and easy.",
  "Do 10 slow deep-squat holds of 10 seconds. Good for ankles, knees and hips.",
  "Take a break from screens 30 minutes before bed. You'll fall asleep faster.",
  "Easy mobility: 10 ankle rocks, 10 hip circles each way, 10 arm circles.",
  "Rest days are when you get stronger. Enjoy it, and come back ready tomorrow."
] as const;

/** The tip for a YYYY-MM-DD date. Returns "" for an empty date (server render). */
export function recoveryTipFor(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "";
  const dayNumber = Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000);
  return RECOVERY_TIPS[((dayNumber % RECOVERY_TIPS.length) + RECOVERY_TIPS.length) % RECOVERY_TIPS.length];
}

/** The first few exercise names for the Today card, with how many more there are. */
export function exercisePreview(exercises: string[], max = 4): { shown: string[]; more: number } {
  return { shown: exercises.slice(0, max), more: Math.max(0, exercises.length - max) };
}
