"use client";

import { useState } from "react";

interface ShareButtonsProps {
  score: number;
  correct: number;
  total: number;
}

export default function ShareButtons({ score, correct, total }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `🌿 Pelasin VegeVisaa ja sain ${score.toLocaleString("fi-FI")} pistettä (${correct}/${total} oikein)!\nTestaa oma kasvistietosi: provege.fi/vegevisa\n#VegeVisa #ProVege`;
  const shareUrl = "https://provege.fi/vegevisa";
  const encoded = encodeURIComponent(shareText);

  const whatsappUrl = `https://wa.me/?text=${encoded}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encoded}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encoded}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const btnClass = "arcade-btn flex-1 min-w-[60px] py-4 px-3 rounded-lg font-[family-name:var(--font-press-start)] text-[10px] text-center uppercase tracking-wider";

  return (
    <div className="w-full">
      <p className="font-[family-name:var(--font-press-start)] text-[11px] text-text-secondary mb-4 text-center uppercase tracking-widest">
        Jaa kaverillesi
      </p>
      <div className="flex gap-3">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className={`${btnClass} text-[#25D366]`} style={{ touchAction: "manipulation" }}>
          WA
        </a>
        <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
          className={`${btnClass} text-[#4488ff]`} style={{ touchAction: "manipulation" }}>
          FB
        </a>
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
          className={`${btnClass} text-[#88ccff]`} style={{ touchAction: "manipulation" }}>
          X
        </a>
        <button onClick={copyToClipboard}
          className={`${btnClass} ${copied ? "text-correct glow-green" : "text-text-secondary"}`}
          style={{ touchAction: "manipulation" }}>
          {copied ? "OK!" : "COPY"}
        </button>
      </div>
    </div>
  );
}
