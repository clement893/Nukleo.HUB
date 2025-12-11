"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

interface SafeHTMLProps {
  html: string;
  className?: string;
}

/**
 * Composant pour afficher du HTML de manière sécurisée
 * Utilise DOMPurify pour sanitiser le contenu et prévenir les attaques XSS
 */
export default function SafeHTML({ html, className }: SafeHTMLProps) {
  const sanitizedHTML = useMemo(() => {
    if (typeof window === "undefined") {
      // Côté serveur, retourner le HTML tel quel (sera re-sanitisé côté client)
      return html;
    }
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li",
        "a", "blockquote", "code", "pre",
        "table", "thead", "tbody", "tr", "th", "td",
        "div", "span", "hr",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "id"],
      ALLOW_DATA_ATTR: false,
    });
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
