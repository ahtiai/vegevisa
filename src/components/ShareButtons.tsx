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

  const buttonClass =
    "flex-1 min-w-[70px] py-3 px-2 rounded-xl text-sm font-medium text-center transition-all active:scale-95";

  return (
    <div className="w-full">
      <p className="text-text-secondary text-sm mb-3 text-center">Jaa kaverillesi!</p>
      <div className="flex gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-[#25D366]/10 text-[#25D366]`}
          style={{ touchAction: "manipulation" }}
        >
          WhatsApp
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-[#1877F2]/10 text-[#1877F2]`}
          style={{ touchAction: "manipulation" }}
        >
          Facebook
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-[#1DA1F2]/10 text-[#1DA1F2]`}
          style={{ touchAction: "manipulation" }}
        >
          X
        </a>
        <button
          onClick={copyToClipboard}
          className={`${buttonClass} bg-bg-secondary text-text-secondary`}
          style={{ touchAction: "manipulation" }}
        >
          {copied ? "Kopioitu!" : "Kopioi"}
        </button>
      </div>
    </div>
  );
}
