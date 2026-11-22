"use client";

import { Copy, Mail, Share2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useNavRole } from "@/hooks/useNavRole";
import { useViewerLinks } from "@/hooks/useViewerLinks";
import {
  describeViewerLink,
  isEmailAddress,
  VIEWER_LABEL_MAX,
  VIEWER_LINK_LIMIT,
  viewerInviteMailto,
  viewerInviteMessage,
  viewerLink,
  type ViewerRole
} from "@/lib/viewerLinks";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type NewLink = { url: string; role: ViewerRole; email: string };

/**
 * Settings card (P-06): a free, read-only link for a parent or an outside
 * coach, sent by the athlete's own share sheet, copy, or email app.
 */
export function ShareTraining() {
  const role = useNavRole();
  const { links, available, createLink, revokeLink } = useViewerLinks();
  const [viewerRole, setViewerRole] = useState<ViewerRole>("parent");
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<NewLink | null>(null);
  const [status, setStatus] = useState("");
  const [revoking, setRevoking] = useState<{ id: string; name: string } | null>(null);

  if (!available || role === "coach") return null;

  const emailOk = email.trim() === "" || isEmailAddress(email);
  const atLimit = links.length >= VIEWER_LINK_LIMIT;

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (creating || !emailOk || atLimit) return;
    setCreating(true);
    setError(null);
    setStatus("");
    try {
      const token = await createLink(viewerRole, label);
      setCreated({ url: viewerLink(token), role: viewerRole, email: email.trim() });
      setLabel("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't make a link right now. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  async function share(link: NewLink) {
    const { subject, body } = viewerInviteMessage(link.role, link.url);
    try {
      if (navigator.share) {
        await navigator.share({ title: subject, text: body });
        return;
      }
      await copy(link.url);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) setStatus("Couldn't open sharing. Copy the link instead.");
    }
  }

  async function revoke(id: string, name: string) {
    setRevoking(null);
    const ok = await revokeLink(id);
    setStatus(ok ? `Stopped sharing with ${name}.` : "Couldn't stop sharing right now. Try again.");
  }

  return (
    <section className="panel share-training" aria-labelledby="share-training-title">
      <h2 id="share-training-title">Share with a parent or coach</h2>
      <p className="muted">
        Make a private link that shows your workouts, check-in days and best jumps. It&apos;s free, read-only, and they
        don&apos;t need an account. Pain, sleep and notes stay private.
      </p>

      <form onSubmit={handleCreate} noValidate>
        <fieldset className="share-training-roles">
          <legend>Who is it for?</legend>
          {(["parent", "coach"] as const).map((option) => (
            <label key={option} className="settings-checkbox">
              <input
                type="radio"
                name="viewer-role"
                value={option}
                checked={viewerRole === option}
                onChange={() => setViewerRole(option)}
              />
              {option === "parent" ? "A parent or guardian" : "A coach or trainer"}
            </label>
          ))}
        </fieldset>
        <label>
          Their name (optional)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={VIEWER_LABEL_MAX}
            placeholder={viewerRole === "parent" ? "Mom" : "Coach Rivera"}
            autoComplete="off"
          />
        </label>
        <label>
          Their email (optional)
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            aria-invalid={!emailOk}
            aria-describedby="share-training-email-hint"
          />
          <span id="share-training-email-hint" className="muted share-training-hint">
            {emailOk ? "We'll open your email app with the link filled in." : "That email doesn't look right."}
          </span>
        </label>
        <button type="submit" disabled={creating || !emailOk || atLimit}>
          {creating ? "Making link..." : "Make a link"}
        </button>
        {atLimit && (
          <p className="muted">You share with {VIEWER_LINK_LIMIT} people. Stop sharing with someone to add another.</p>
        )}
        {error && (
          <p className="feedback-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {created && (
        <div className="share-training-new" role="group" aria-label="Your new link">
          <p>
            <strong>Send this link now.</strong> For your privacy we can&apos;t show it again; make a new one if it gets
            lost.
          </p>
          <input readOnly value={created.url} aria-label="Private link" onFocus={(e) => e.currentTarget.select()} />
          <div className="share-training-actions">
            {created.email && (
              <a className="button-link" href={viewerInviteMailto(created.email, created.role, created.url)}>
                <Mail size={16} aria-hidden="true" /> Email it
              </a>
            )}
            <button type="button" onClick={() => share(created)}>
              <Share2 size={16} aria-hidden="true" /> Share
            </button>
            <button type="button" className="ghost" onClick={() => copy(created.url)}>
              <Copy size={16} aria-hidden="true" /> Copy
            </button>
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className="share-training-list">
          <h3>Who can see your training</h3>
          <ul>
            {links.map((link) => {
              const name = describeViewerLink(link);
              return (
                <li key={link.id}>
                  <span>
                    <strong>{name}</strong>
                    <span className="muted">
                      {" "}
                      Made {shortDate(link.createdAt)} ·{" "}
                      {link.lastViewedAt ? `last opened ${shortDate(link.lastViewedAt)}` : "not opened yet"}
                    </span>
                  </span>
                  <button type="button" className="ghost" onClick={() => setRevoking({ id: link.id, name })}>
                    Stop sharing
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="muted" role="status">
        {status}
      </p>

      {revoking && (
        <ConfirmModal
          title={`Stop sharing with ${revoking.name}?`}
          message="Their link stops working right away. You can make a new link any time."
          confirmLabel="Stop sharing"
          danger
          onConfirm={() => revoke(revoking.id, revoking.name)}
          onCancel={() => setRevoking(null)}
        />
      )}
    </section>
  );
}
