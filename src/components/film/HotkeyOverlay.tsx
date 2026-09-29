"use client";

import { X } from "lucide-react";

import { SHORTCUT_GROUPS } from "@/lib/filmHotkeys";

export function HotkeyOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="hotkey-overlay" onClick={onClose}>
      <div
        className="hotkey-overlay-card"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hotkey-overlay-head">
          <h3>Keyboard shortcuts</h3>
          <button type="button" className="ghost film-tag-delete" aria-label="Close shortcuts" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="hotkey-overlay-grid">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title}>
              <h4>{group.title}</h4>
              <dl>
                {group.items.map(([keys, action]) => (
                  <div key={`${group.title}-${keys}`} className="hotkey-row">
                    <dt>
                      <kbd>{keys}</kbd>
                    </dt>
                    <dd>{action}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <p className="muted hotkey-overlay-foot">
          Pressing a new tag key saves the pending tag with whatever details it has.
        </p>
      </div>
    </div>
  );
}
