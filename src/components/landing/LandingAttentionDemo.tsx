"use client";

import { AttentionCenter } from "@/components/coach/AttentionCenter";
import { AttentionItem } from "@/lib/attentionCenter";

export function LandingAttentionDemo({ items }: { items: AttentionItem[] }) {
  return <AttentionCenter items={items} loading={false} onSelectAthlete={() => {}} />;
}
