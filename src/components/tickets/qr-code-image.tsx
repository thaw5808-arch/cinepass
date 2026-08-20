"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCodeImage({ value, size = 176 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0c0b10", light: "#f5f1e8" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className="animate-pulse rounded-md bg-bg-card"
        style={{ width: size, height: size }}
        aria-label="Generating QR code"
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- data URL, next/image doesn't apply
  return <img src={src} alt="Ticket QR code" width={size} height={size} className="rounded-md" />;
}
