"use client";
import { useState } from "react";
import { Link as LinkIcon, Check, MessageCircle } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  compact?: boolean;
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function ShareButtons({ url, title, compact }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = url.startsWith("http") ? url : `https://curlysports.com${url}`;
  const encoded = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="share-buttons" data-compact={compact || undefined}>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}&via=curlysportsofcl`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn share-twitter"
        aria-label="Share on X (Twitter)"
      >
        <XIcon size={16} />
        {!compact && <span>Share</span>}
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn share-whatsapp"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle size={16} />
        {!compact && <span>WhatsApp</span>}
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn share-facebook"
        aria-label="Share on Facebook"
      >
        <FacebookIcon size={16} />
        {!compact && <span>Share</span>}
      </a>
      <button
        onClick={copyLink}
        className="share-btn share-copy"
        aria-label="Copy link"
      >
        {copied ? <Check size={16} /> : <LinkIcon size={16} />}
        {!compact && <span>{copied ? "Copied!" : "Copy"}</span>}
      </button>
    </div>
  );
}
