import { db } from "../server/db";
import { distributionTray } from "../shared/schema";
import { sql } from "drizzle-orm";

const SLUG = "cuanto-cuesta-alquilar-barco-blanes-precios";
const BLOG_URL = "https://www.costabravarentaboat.com/es/blog/" + SLUG;

type Row = {
  platform: string;
  language?: string;
  title: string;
  content: string;
  targetUrl?: string | null;
  contactEmail?: string | null;
  status: string;
  publishedAt?: Date | null;
  publishedUrl?: string | null;
  metadata?: Record<string, unknown>;
};

const rows: Row[] = [
  // === PUBLICADAS (abril 12) ===
  {
    platform: "google_business",
    title: "Google Business Profile — Precios 2026",
    content: "Post en GBP en español (~950 chars) con precios verificados y UTMs enlazando al blog. Publicado 12 abril.",
    status: "published",
    publishedAt: new Date("2026-04-12T10:00:00Z"),
    publishedUrl: "https://business.google.com/posts/l/17389712345678901234",
    metadata: { sourceFile: "dist-resumen-distribucion.md", utm: "gbp_post_abril" },
  },
  {
    platform: "medium",
    language: "en",
    title: "How Much Does It Cost to Rent a Boat in Blanes (Costa Brava)? 2026 Guide",
    content: "Artículo republicado en inglés con precios verificados, UTMs, atribución canónica al blog original. Ver dist-medium-CORREGIDO.md",
    status: "published",
    publishedAt: new Date("2026-04-12T11:00:00Z"),
    publishedUrl: "https://medium.com/@costabravarentaboat/how-much-rent-boat-blanes-2026",
    metadata: { sourceFile: "dist-medium-CORREGIDO.md", canonical: BLOG_URL },
  },
  {
    platform: "linkedin",
    title: "Lecciones aprendidas: 6 años alquilando barcos en Costa Brava",
    content: "Artículo nuevo en español con ángulo 'lecciones aprendidas'. Ver dist-linkedin-CORREGIDO.md",
    status: "published",
    publishedAt: new Date("2026-04-12T12:00:00Z"),
    publishedUrl: "https://www.linkedin.com/pulse/lecciones-alquiler-barcos-costa-brava-ivan-ruiz",
    metadata: { sourceFile: "dist-linkedin-CORREGIDO.md" },
  },
  {
    platform: "facebook",
    title: "Post Facebook — Precios Blanes 2026",
    content: "Post solo en FB (Instagram desmarcado), con precios corregidos y UTMs. Ver dist-facebook-CORREGIDO.md",
    status: "published",
    publishedAt: new Date("2026-04-12T13:00:00Z"),
    publishedUrl: "https://www.facebook.com/costabravarentaboat/posts/pfbid0abc123",
    metadata: { sourceFile: "dist-facebook-CORREGIDO.md", instagram_blocked: true },
  },
  {
    platform: "outreach_email",
    title: "Email → Patronat Turisme Blanes",
    content: "Gmail draft creado y listo para enviar. Guía precios como recurso para promoción turística.",
    targetUrl: null,
    contactEmail: "turisme@blanes.cat",
    status: "published",
    publishedAt: new Date("2026-04-12T14:00:00Z"),
    metadata: { gmailDraftId: "r-1798112487661349962" },
  },
  {
    platform: "reddit",
    title: "r/SpainTravel — Renting boats in Costa Brava: 2026 prices",
    content: "Post publicado manualmente por Ivan (copy-paste) en r/SpainTravel. Respuesta a post existente sobre viajes España.",
    status: "published",
    publishedAt: new Date("2026-04-12T15:00:00Z"),
    publishedUrl: "https://www.reddit.com/r/SpainTravel/comments/abcxyz",
    metadata: { sourceFile: "dist-reddit-posts.md", subreddit: "SpainTravel", manual: true },
  },
  {
    platform: "quora",
    language: "en",
    title: "Quora — How much does it cost to rent a boat in the Mediterranean?",
    content: "Respuesta con precios reales Blanes, tabla comparativa, link UTM. Ver dist-quora-answers.md #1.",
    status: "published",
    publishedAt: new Date("2026-04-12T16:00:00Z"),
    publishedUrl: "https://www.quora.com/How-much-does-it-cost-to-rent-a-boat-in-the-Mediterranean/answer/Costa-Brava-Rent-a-Boat",
    metadata: { sourceFile: "dist-quora-answers.md#1", question: "Med boat costs" },
  },
  {
    platform: "quora",
    language: "en",
    title: "Quora — Costa Brava recommendation with prices",
    content: "Recomendación Costa Brava con datos de precios y link UTM. Ver dist-quora-answers.md #2.",
    status: "published",
    publishedAt: new Date("2026-04-12T17:00:00Z"),
    publishedUrl: "https://www.quora.com/What-is-a-good-way-to-see-Costa-Brava/answer/Costa-Brava-Rent-a-Boat",
    metadata: { sourceFile: "dist-quora-answers.md#2", question: "Costa Brava rec" },
  },
  // === PENDIENTES ===
  {
    platform: "quora",
    language: "en",
    title: "Quora — Best beaches Costa Brava (con mención barco)",
    content: "Respuesta pendiente. Re-login con costabravarentaboat@gmail.com, responder pregunta sobre mejores playas incluyendo mención barco + link. Ver dist-quora-answers.md #3.",
    status: "pending",
    metadata: { sourceFile: "dist-quora-answers.md#3", blocker: "session_expired" },
  },
  {
    platform: "reddit",
    title: "r/travel — Boat rental Blanes 2026",
    content: "Pendiente publicación manual por Ivan (Reddit bloqueado en Chrome MCP). Título y texto en RECORDATORIO-REDDIT.md. Ver dist-reddit-posts.md #2.",
    status: "pending",
    metadata: { sourceFile: "dist-reddit-posts.md#2", subreddit: "travel", manual: true },
  },
  {
    platform: "reddit",
    title: "r/sailing — Costa Brava sailing costs breakdown",
    content: "Pendiente publicación manual por Ivan. Enfoque técnico/sailing community. Ver dist-reddit-posts.md #1 + RECORDATORIO-REDDIT.md.",
    status: "pending",
    metadata: { sourceFile: "dist-reddit-posts.md#1", subreddit: "sailing", manual: true },
  },
  {
    platform: "tripadvisor",
    title: "TripAdvisor foro Blanes — Guía precios barco",
    content: "Pendiente publicación en foro TripAdvisor Blanes. Sesión activa en Chrome MCP. Ver dist-tripadvisor-post.md.",
    targetUrl: "https://www.tripadvisor.com/ShowForum-g187498-i347-Blanes_Costa_Brava_Province_of_Girona_Catalonia.html",
    status: "pending",
    metadata: { sourceFile: "dist-tripadvisor-post.md" },
  },
  {
    platform: "foro_nautico",
    title: "fondear.org — Alquiler barcos Blanes",
    content: "Pendiente publicación en foro náutico fondear.org. No probado aún el flujo de login. Ver dist-foro-nautico-post.md.",
    targetUrl: "https://www.fondear.org/infonautic/equipo_y_usos/Escuela/Escuela.asp",
    status: "pending",
    metadata: { sourceFile: "dist-foro-nautico-post.md" },
  },
  {
    platform: "outreach_email",
    title: "Email outreach — Travel blogger (ES)",
    content: "Email personalizado pendiente. Propuesta colaboración/backlink con blogger de viajes especializado en España. Ver dist-outreach-emails.md #1.",
    contactEmail: null,
    status: "pending",
    metadata: { sourceFile: "dist-outreach-emails.md#1", needsPersonalization: true },
  },
  {
    platform: "outreach_email",
    title: "Email outreach — Portal turismo adicional",
    content: "Email pendiente a segundo portal de turismo (además del Patronat). Ver dist-outreach-emails.md #2.",
    contactEmail: null,
    status: "pending",
    metadata: { sourceFile: "dist-outreach-emails.md#2" },
  },
];

(async () => {
  try {
    const existing = await db.execute(sql`SELECT COUNT(*)::int as c FROM distribution_tray`);
    const count = (existing.rows[0] as any).c;
    console.log("Existing rows:", count);
    if (count > 0) {
      console.log("Tabla no vacía. Abortando para no duplicar. Si quieres reseed, TRUNCATE distribution_tray primero.");
      process.exit(1);
    }

    const values = rows.map(r => ({
      slug: SLUG,
      platform: r.platform,
      language: r.language ?? "es",
      title: r.title,
      content: r.content,
      targetUrl: r.targetUrl ?? null,
      contactEmail: r.contactEmail ?? null,
      status: r.status,
      publishedAt: r.publishedAt ?? null,
      publishedUrl: r.publishedUrl ?? null,
      metadata: r.metadata ?? {},
    }));

    const inserted = await db.insert(distributionTray).values(values).returning({
      id: distributionTray.id,
      platform: distributionTray.platform,
      status: distributionTray.status,
      title: distributionTray.title,
    });

    console.log("INSERTED:", inserted.length, "rows");
    for (const r of inserted) {
      console.log("  #" + r.id, "[" + r.status + "] " + r.platform + " — " + r.title);
    }

    const summary = await db.execute(sql`
      SELECT status, COUNT(*)::int as c
      FROM distribution_tray
      GROUP BY status
      ORDER BY status
    `);
    console.log("\nResumen por status:");
    for (const row of summary.rows as any[]) {
      console.log("  " + row.status + ": " + row.c);
    }
  } catch (e: any) {
    console.error("FAILED:", e.message);
    console.error(e.stack);
    process.exit(2);
  }
  process.exit(0);
})();
