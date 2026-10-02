"use client";

import { QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { CopyButton } from "@/components/shared/CopyButton";
import { ModalDialog } from "@/components/shared/ModalDialog";
import { inviteUrl } from "@/lib/invite";
import { Team } from "@/types";

/** A large, high-contrast QR code for an invite link, rendered as inline SVG. */
function InviteQr({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then((markup) => !cancelled && setSvg(markup))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) return <p className="muted">Couldn&apos;t draw the QR code. Share the link instead.</p>;
  if (!svg) return <div className="invite-qr invite-qr-loading" aria-hidden="true" />;
  // The markup is generated locally by the qrcode library from our own URL.
  return <div className="invite-qr" role="img" aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/**
 * "Copy invite link" and "Show QR code" for a team. The link is /join/<code>;
 * regenerating the code makes old links and QR codes stop working on purpose.
 */
export function InviteShare({ team, compact = false }: { team: Team; compact?: boolean }) {
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = origin ? inviteUrl(origin, team.invite_code) : "";

  return (
    <>
      <CopyButton className={compact ? "secondary" : ""} getText={() => inviteUrl(window.location.origin, team.invite_code)}>
        Copy invite link
      </CopyButton>
      <button type="button" className="secondary invite-qr-button" onClick={() => setShowQr(true)} disabled={!url}>
        <QrCode size={16} aria-hidden="true" /> Show QR code
      </button>

      {showQr && url && (
        <ModalDialog label={`Invite QR code for ${team.name}`} onClose={() => setShowQr(false)} cardClassName="invite-qr-card">
          <h2>Join {team.name}</h2>
          <p className="muted">Athletes scan this with their phone camera to join.</p>
          <InviteQr url={url} />
          <p className="invite-qr-code">
            Or enter code <strong>{team.invite_code}</strong>
          </p>
          <button type="button" className="ghost" onClick={() => setShowQr(false)} data-autofocus>
            Done
          </button>
        </ModalDialog>
      )}
    </>
  );
}
