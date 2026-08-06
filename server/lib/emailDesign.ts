/**
 * Design primitives for transactional email.
 *
 * Email is not the web, so DESIGN.md cannot be applied literally: CSS variables
 * and oklch() are unsupported, and Outlook's Word engine ignores linear-gradient,
 * border-radius and box-shadow. The tokens are therefore restated here as hex,
 * and the brand faces are loaded as progressive enhancement (see FONT_STACK):
 * real in Apple Mail, a metrically close system face everywhere else.
 *
 * What this module fixes, all of it observed in real inboxes:
 * - The logo was an SVG. Gmail, Outlook and Yahoo drop SVG entirely, so the
 *   header arrived empty. It is a PNG now.
 * - The header painted white text over a linear-gradient. Outlook ignores the
 *   gradient and renders white on white, i.e. an invisible header.
 * - Colour accents were `border-left: 4px solid`, which DESIGN.md bans outright.
 *   `callout()` replaces them with a tinted fill plus a full 1px border.
 * - Every CTA was hand-inlined with a different radius (6px here, 50px there).
 *   `button()` is the single pill, with a VML fallback so Outlook shows a real
 *   button instead of a bare link.
 */

/** DESIGN.md tokens, as hex because email clients understand nothing else. */
export const COLORS = {
  /** Deep Navy CTA: the one action colour. */
  cta: "#1a1a3e",
  /** Coastal Navy: primary text and the darkest surface. */
  ink: "#1f3044",
  /** Body copy that is not a heading. */
  inkSoft: "#4a5c70",
  /** Soft Steel: borders and dividers. */
  border: "#c4cdd5",
  /** Salt Mist: the page behind the card. */
  page: "#f5f7f8",
  /** Warm Card: section fills inside the card. */
  surface: "#f2f5f7",
  /**
   * The card itself. DESIGN.md forbids pure #fff, so this is tinted toward the
   * coastal navy hue just enough to separate from the page without a border.
   */
  card: "#fbfcfd",
  /** Text that sits on top of ink/cta surfaces. Never pure white, same rule. */
  onInk: "#f5f7f8",
  success: "#16a34a",
  successFill: "#eef8f1",
  warning: "#f59e0b",
  warningFill: "#fdf6e7",
  danger: "#bf1a1a",
  dangerFill: "#fbeded",
} as const;

/**
 * The brand faces, as progressive enhancement.
 *
 * Apple Mail (macOS and iOS) honours @font-face, so the real Archivo and Clash
 * Display render there, which is where the owner reads his mail. Gmail and
 * Outlook strip webfonts, and they simply fall through the stack to a system
 * face; the layout does not shift because the fallbacks are metrically close.
 * DESIGN.md: Clash Display for headings, Archivo for body, never swapped.
 */
const SYSTEM_TAIL =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const FONT_STACK = `'Archivo', ${SYSTEM_TAIL}`;
export const DISPLAY_STACK = `'Clash Display', 'Archivo', ${SYSTEM_TAIL}`;

/** Self-hosted variable fonts, same files the website already serves. */
const FONT_FACE_CSS = `
    @font-face {
      font-family: 'Archivo';
      src: url('https://www.costabravarentaboat.com/fonts/Archivo-Variable.woff2') format('woff2');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Clash Display';
      src: url('https://www.costabravarentaboat.com/fonts/ClashDisplay-Variable.woff2') format('woff2');
      font-weight: 200 700;
      font-style: normal;
      font-display: swap;
    }`;

const LOGO_URL = "https://www.costabravarentaboat.com/assets/logo-square.png";
const SITE_URL = "https://www.costabravarentaboat.com";

export type CalloutTone = "neutral" | "success" | "warning" | "danger";

/** Escapes text that will be interpolated into an HTML attribute or body. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The signature pill CTA. Outlook's Word engine drops border-radius and treats
 * a styled <a> as plain text, so it gets a VML rounded rectangle instead and
 * everyone else gets the real anchor.
 */
export function button(opts: { href: string; label: string; align?: "left" | "center" }): string {
  const { href, label, align = "left" } = opts;
  // VML needs an explicit width; approximate from the label plus the pill padding.
  const width = Math.max(180, Math.round(label.length * 8.5) + 56);
  // No `align` on the <table>: in HTML that attribute floats the element, so the
  // next block wrapped around the pill instead of sitting under it (the heading
  // "La salida" ended up printed inside the button). Alignment belongs on the
  // cell, which is plain text-align and does not float anything. The table is
  // full width so the row below always clears it.
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; margin:22px 0;">
    <tr><td align="${align}">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(href)}" style="height:46px;v-text-anchor:middle;width:${width}px;" arcsize="50%" stroke="f" fillcolor="${COLORS.cta}">
        <w:anchorlock/>
        <center style="color:${COLORS.onInk};font-family:${FONT_STACK};font-size:15px;font-weight:bold;">${esc(label)}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${esc(href)}" style="display:inline-block; background-color:${COLORS.cta}; color:${COLORS.onInk}; font-family:${FONT_STACK}; font-size:15px; font-weight:600; line-height:22px; text-decoration:none; padding:12px 28px; border-radius:9999px; mso-hide:all;">${esc(label)}</a>
      <!--<![endif]-->
    </td></tr>
  </table>`;
}

/**
 * Tinted panel used for anything that needs to stand apart: delivery
 * instructions, warnings, stock alerts. Replaces the banned coloured left
 * stripe with a fill plus a full border.
 */
export function callout(opts: { tone?: CalloutTone; title?: string; body: string }): string {
  const { tone = "neutral", title, body } = opts;
  const palette: Record<CalloutTone, { bg: string; border: string; heading: string }> = {
    neutral: { bg: COLORS.surface, border: COLORS.border, heading: COLORS.ink },
    success: { bg: COLORS.successFill, border: COLORS.success, heading: "#14532d" },
    warning: { bg: COLORS.warningFill, border: COLORS.warning, heading: "#7a4a04" },
    danger: { bg: COLORS.dangerFill, border: COLORS.danger, heading: "#7f1212" },
  };
  const c = palette[tone];
  const titleBlock = title
    ? `<p style="margin:0 0 6px; font-family:${FONT_STACK}; font-size:15px; font-weight:700; color:${c.heading};">${title}</p>`
    : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr><td style="background-color:${c.bg}; border:1px solid ${c.border}; border-radius:12px; padding:16px 18px;">
      ${titleBlock}
      <div style="font-family:${FONT_STACK}; font-size:15px; line-height:1.6; color:${COLORS.inkSoft};">${body}</div>
    </td></tr>
  </table>`;
}

/** Section heading. One weight and one size step above body, per DESIGN.md. */
export function heading(text: string, level: 1 | 2 = 2): string {
  const size = level === 1 ? 28 : 19;
  const weight = level === 1 ? 700 : 600;
  const top = level === 1 ? 0 : 28;
  return `<h${level} style="margin:${top}px 0 12px; font-family:${DISPLAY_STACK}; font-size:${size}px; font-weight:${weight}; line-height:1.2; color:${COLORS.ink}; letter-spacing:-0.015em;">${text}</h${level}>`;
}

/** Body paragraph. */
export function paragraph(text: string): string {
  return `<p style="margin:0 0 14px; font-family:${FONT_STACK}; font-size:15px; line-height:1.65; color:${COLORS.inkSoft};">${text}</p>`;
}

/**
 * Key/value rows. The workhorse of every transactional email here.
 *
 * The label must wrap and the amount must not. A product label like
 * "Camiseta Costa Brava Culture (amarillo mantequilla, L)" held on one line
 * pushes the table past 440px, and since the shell sizes to its widest child
 * that dragged the whole email sideways on a phone. Amounts stay nowrap because
 * "34,95 EUR" breaking across lines is worse than a slightly narrower label.
 */
export function dataRows(rows: { label: string; value: string; strong?: boolean }[]): string {
  const body = rows
    .map((r, i) => {
      const divider = i > 0 ? `border-top:1px solid ${COLORS.border};` : "";
      return `
      <tr>
        <td style="padding:11px 12px 11px 0; ${divider} font-family:${FONT_STACK}; font-size:14px; line-height:1.45; color:${COLORS.inkSoft}; vertical-align:top; word-break:break-word;">${r.label}</td>
        <td style="padding:11px 0 11px; ${divider} font-family:${r.strong ? DISPLAY_STACK : FONT_STACK}; font-size:${r.strong ? 17 : 14}px; font-weight:${r.strong ? 700 : 500}; line-height:1.45; color:${COLORS.ink}; text-align:right; vertical-align:top; white-space:nowrap;">${r.value}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; margin:4px 0 8px; table-layout:auto;">${body}</table>`;
}

interface WrapperOptions {
  preheader?: string;
  /** Drives the html lang attribute; the footer copy follows it. */
  lang?: string;
}

const FOOTER_COPY: Record<string, { port: string; site: string }> = {
  es: { port: "Puerto de Blanes, Girona, Costa Brava", site: "Ver la web" },
  en: { port: "Port of Blanes, Girona, Costa Brava", site: "Visit the website" },
  ca: { port: "Port de Blanes, Girona, Costa Brava", site: "Veure el web" },
  fr: { port: "Port de Blanes, Gerone, Costa Brava", site: "Voir le site" },
  de: { port: "Hafen von Blanes, Girona, Costa Brava", site: "Zur Website" },
  nl: { port: "Haven van Blanes, Girona, Costa Brava", site: "Bekijk de website" },
  it: { port: "Porto di Blanes, Girona, Costa Brava", site: "Vai al sito" },
  ru: { port: "Port Blanes, Girona, Costa Brava", site: "Otkryt sayt" },
};

/**
 * Document shell shared by every email in the app.
 *
 * Light header on a quiet surface, per the Quiet Surface Rule, which also
 * sidesteps the two rendering bugs the old dark gradient header had.
 */
export function wrapper(content: string, options: WrapperOptions = {}): string {
  const { preheader, lang = "es" } = options;
  const footer = FOOTER_COPY[lang] ?? FOOTER_COPY.es;
  const preheaderBlock = preheader
    ? `<div style="display:none; font-size:1px; color:${COLORS.page}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${preheader}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>${FONT_FACE_CSS}
    /* Gmail keeps a <style> block in the head; Outlook ignores the query and
       simply keeps the desktop padding, which is the correct fallback. */
    @media only screen and (max-width:480px) {
      .cbrb-pad { padding: 24px 20px !important; }
      .cbrb-head { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${COLORS.page}; font-family:${FONT_STACK}; -webkit-font-smoothing:antialiased;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.page};">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:16px; overflow:hidden;">
          <tr>
            <td class="cbrb-head" align="center" style="padding:26px 32px 22px; border-bottom:1px solid ${COLORS.border};">
              <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" alt="Costa Brava Rent a Boat, Blanes" width="180" height="72" style="display:block; margin:0 auto; width:180px; height:auto; border:0;"></a>
            </td>
          </tr>
          <tr>
            <td class="cbrb-pad" style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.ink}; padding:22px 32px;">
              <p style="margin:0 0 8px; font-family:${FONT_STACK}; font-size:13px; line-height:1.6; color:${COLORS.onInk};">${footer.port}</p>
              <p style="margin:0 0 12px; font-family:${FONT_STACK}; font-size:13px; line-height:1.6; color:${COLORS.onInk};">
                <a href="tel:+34611500372" style="color:${COLORS.onInk}; text-decoration:none;">+34 611 500 372</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:info@costabravarentaboat.com" style="color:${COLORS.onInk}; text-decoration:none;">info@costabravarentaboat.com</a>
              </p>
              <p style="margin:0; font-family:${FONT_STACK}; font-size:12px; line-height:1.6; color:${COLORS.border};">
                <a href="${SITE_URL}" style="color:${COLORS.border}; text-decoration:underline;">${footer.site}</a>
                &nbsp;&middot;&nbsp;
                <a href="https://www.instagram.com/costabravarentaboat/" style="color:${COLORS.border}; text-decoration:underline;">Instagram</a>
                &nbsp;&middot;&nbsp;
                <a href="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5" style="color:${COLORS.border}; text-decoration:underline;">Google Maps</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
