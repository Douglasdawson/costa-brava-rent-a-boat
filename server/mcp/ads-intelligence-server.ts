import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, and, gte, lte, desc, sql, count, sum, avg } from "drizzle-orm";
import { db } from "./shared/db";
import * as schema from "../../shared/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEBSITE_BASE_URL = "https://costabravarentaboat.com";
const BUSINESS_PHONE = "+34 611 500 372";
const SEASON_MONTHS = [4, 5, 6, 7, 8, 9, 10]; // April - October

const AVAILABLE_PAGES: Record<string, string> = {
  home: "/",
  "no-license": "/barcos-sin-licencia",
  "with-license": "/barcos-con-licencia",
  "blanes-rental": "/alquiler-barcos-blanes",
  "near-barcelona": "/alquiler-barcos-cerca-barcelona",
  prices: "/precios",
  faq: "/faq",
  routes: "/rutas",
  gallery: "/galeria",
  blog: "/blog",
  "gift-cards": "/tarjeta-regalo",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function madridToday(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
  });
  return formatter.format(new Date());
}

function getSeasonStartDate(): Date {
  const year = madridToday().split("-")[0];
  return new Date(`${year}-04-01T00:00:00Z`);
}

function getCurrentYear(): number {
  return parseInt(madridToday().split("-")[0], 10);
}

interface BoatRow {
  id: string;
  name: string;
  capacity: number;
  requiresLicense: boolean;
  pricePerHour: string | null;
  deposit: string;
  pricing: {
    BAJA?: { period: string; prices: Record<string, number> };
    MEDIA?: { period: string; prices: Record<string, number> };
    ALTA?: { period: string; prices: Record<string, number> };
  } | null;
  features: string[] | null;
  equipment: string[] | null;
  included: string[] | null;
}

async function getActiveBoats(): Promise<BoatRow[]> {
  const boats = await db
    .select({
      id: schema.boats.id,
      name: schema.boats.name,
      capacity: schema.boats.capacity,
      requiresLicense: schema.boats.requiresLicense,
      pricePerHour: schema.boats.pricePerHour,
      deposit: schema.boats.deposit,
      pricing: schema.boats.pricing,
      features: schema.boats.features,
      equipment: schema.boats.equipment,
      included: schema.boats.included,
    })
    .from(schema.boats)
    .where(eq(schema.boats.isActive, true))
    .orderBy(schema.boats.displayOrder);

  return boats as BoatRow[];
}

async function getBookingStats(startDate?: Date) {
  const conditions = [
    sql`${schema.bookings.bookingStatus} IN ('confirmed', 'completed')`,
  ];
  if (startDate) {
    conditions.push(gte(schema.bookings.startTime, startDate));
  }

  const byNationality = await db
    .select({
      nationality: schema.bookings.customerNationality,
      count: count(),
      revenue: sum(schema.bookings.totalAmount),
    })
    .from(schema.bookings)
    .where(and(...conditions))
    .groupBy(schema.bookings.customerNationality)
    .orderBy(desc(count()));

  const byBoat = await db
    .select({
      boatId: schema.bookings.boatId,
      boatName: schema.boats.name,
      count: count(),
      revenue: sum(schema.bookings.totalAmount),
    })
    .from(schema.bookings)
    .leftJoin(schema.boats, eq(schema.bookings.boatId, schema.boats.id))
    .where(and(...conditions))
    .groupBy(schema.bookings.boatId, schema.boats.name)
    .orderBy(desc(count()));

  const [averages] = await db
    .select({
      avgAmount: sql<string>`ROUND(AVG(${schema.bookings.totalAmount}::numeric), 2)`,
      avgHours: sql<string>`ROUND(AVG(${schema.bookings.totalHours}), 1)`,
      avgPeople: sql<string>`ROUND(AVG(${schema.bookings.numberOfPeople}), 1)`,
      totalBookings: count(),
      totalRevenue: sum(schema.bookings.totalAmount),
    })
    .from(schema.bookings)
    .where(and(...conditions));

  const bySource = await db
    .select({
      source: schema.bookings.source,
      count: count(),
    })
    .from(schema.bookings)
    .where(and(...conditions))
    .groupBy(schema.bookings.source)
    .orderBy(desc(count()));

  const byMonth = await db
    .select({
      month: sql<string>`EXTRACT(MONTH FROM ${schema.bookings.startTime})::int`,
      count: count(),
      revenue: sum(schema.bookings.totalAmount),
    })
    .from(schema.bookings)
    .where(and(...conditions))
    .groupBy(sql`EXTRACT(MONTH FROM ${schema.bookings.startTime})`)
    .orderBy(sql`EXTRACT(MONTH FROM ${schema.bookings.startTime})`);

  const byDayOfWeek = await db
    .select({
      dayOfWeek: sql<string>`EXTRACT(DOW FROM ${schema.bookings.startTime})::int`,
      count: count(),
    })
    .from(schema.bookings)
    .where(and(...conditions))
    .groupBy(sql`EXTRACT(DOW FROM ${schema.bookings.startTime})`)
    .orderBy(desc(count()));

  return {
    byNationality,
    byBoat,
    averages,
    bySource,
    byMonth,
    byDayOfWeek,
  };
}

function nationalityToCountryCode(nationality: string | null): string {
  const map: Record<string, string> = {
    Spain: "ES",
    "Espana": "ES",
    France: "FR",
    Francia: "FR",
    Germany: "DE",
    Alemania: "DE",
    "United Kingdom": "GB",
    "Reino Unido": "GB",
    Netherlands: "NL",
    "Paises Bajos": "NL",
    Italy: "IT",
    Italia: "IT",
    Russia: "RU",
    Rusia: "RU",
    Belgium: "BE",
    "Belgica": "BE",
    Switzerland: "CH",
    Suiza: "CH",
    Portugal: "PT",
    USA: "US",
    "Estados Unidos": "US",
    Catalonia: "ES",
    "Catalunya": "ES",
  };
  return map[nationality ?? ""] ?? "ES";
}

function dayOfWeekName(dow: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dow] ?? "Unknown";
}

function monthName(m: number): string {
  const months = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[m] ?? "Unknown";
}

function getLowestPrice(boats: BoatRow[]): number {
  let min = Infinity;
  for (const boat of boats) {
    if (boat.pricing) {
      for (const season of Object.values(boat.pricing)) {
        if (season && season.prices) {
          for (const price of Object.values(season.prices)) {
            if (typeof price === "number" && price < min) {
              min = price;
            }
          }
        }
      }
    }
  }
  return min === Infinity ? 70 : min;
}

// ---------------------------------------------------------------------------
// MCP Server Setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "ads-intelligence",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool 1: generate_google_ads_brief
// ---------------------------------------------------------------------------

server.tool(
  "generate_google_ads_brief",
  "Generate a complete Google Ads campaign brief based on real business data (fleet, pricing, booking patterns, nationality distribution).",
  {
    campaign_type: z
      .enum(["search", "display", "performance_max"])
      .describe("Google Ads campaign type"),
    budget_monthly_eur: z
      .number()
      .optional()
      .default(500)
      .describe("Monthly budget in EUR (default: 500)"),
    target_languages: z
      .array(z.string())
      .optional()
      .default(["es", "en", "fr", "de"])
      .describe("Target languages ISO 639-1 codes"),
  },
  async ({ campaign_type, budget_monthly_eur, target_languages }) => {
    const boats = await getActiveBoats();
    const stats = await getBookingStats(getSeasonStartDate());
    const lowestPrice = getLowestPrice(boats);

    const noLicenseBoats = boats.filter((b) => !b.requiresLicense);
    const licenseBoats = boats.filter((b) => b.requiresLicense);

    const totalNatBookings = stats.byNationality.reduce(
      (s, n) => s + Number(n.count),
      0
    );
    const topNationalities = stats.byNationality.slice(0, 8).map((n) => ({
      nationality: n.nationality ?? "Unknown",
      countryCode: nationalityToCountryCode(n.nationality),
      percentage: totalNatBookings
        ? Math.round((Number(n.count) / totalNatBookings) * 100)
        : 0,
      bookings: Number(n.count),
    }));

    // Build ad groups based on campaign type
    const adGroups = [];

    // Ad Group 1: No license boats
    if (noLicenseBoats.length > 0) {
      adGroups.push({
        name: "Boats Without License",
        keywords: {
          exact: [
            "[alquilar barco sin licencia blanes]",
            "[boat rental no license costa brava]",
            "[location bateau sans permis blanes]",
            "[boot mieten ohne fuehrerschein costa brava]",
          ],
          phrase: [
            '"barco sin licencia costa brava"',
            '"no license boat rental spain"',
            '"bateau sans permis costa brava"',
          ],
          broad: [
            "alquiler barco sin licencia girona",
            "boat rental without license spain coast",
          ],
        },
        headlines: [
          "Barcos Sin Licencia Blanes",
          "No License Boat Rental",
          "Desde " + lowestPrice + "EUR - Blanes",
          "Alquila Barco Hoy",
          "Boat Hire Costa Brava",
        ],
        descriptions: [
          "Alquila barcos sin licencia en Blanes. Gasolina incluida, formacion de 15 min. Reserva online.",
          "Rent a boat with no license in Blanes, Costa Brava. Fuel included. Book online in 2 minutes.",
          "Location bateau sans permis a Blanes. Essence incluse. Reservez en ligne des " + lowestPrice + "EUR.",
        ],
        landingPage: WEBSITE_BASE_URL + "/barcos-sin-licencia",
        boats: noLicenseBoats.map((b) => b.name),
      });
    }

    // Ad Group 2: License boats
    if (licenseBoats.length > 0) {
      adGroups.push({
        name: "Boats With License",
        keywords: {
          exact: [
            "[alquilar barco con licencia blanes]",
            "[boat rental with license costa brava]",
          ],
          phrase: [
            '"alquiler barco con licencia costa brava"',
            '"charter boat costa brava"',
          ],
          broad: [
            "alquiler barco licencia blanes",
            "rent boat license costa brava spain",
          ],
        },
        headlines: [
          "Barcos Con Licencia Blanes",
          "Charter Boats Costa Brava",
          "Barcos Potentes en Blanes",
          "Licensed Boat Rental",
          "Alquiler Barcos Blanes",
        ],
        descriptions: [
          "Alquila barcos con licencia en Blanes. Barcos potentes para explorar la Costa Brava. Reserva ya.",
          "Licensed boat rental in Blanes. Powerful boats to explore Costa Brava coves. Book online now.",
        ],
        landingPage: WEBSITE_BASE_URL + "/barcos-con-licencia",
        boats: licenseBoats.map((b) => b.name),
      });
    }

    // Ad Group 3: Location / destination
    adGroups.push({
      name: "Location & Destination",
      keywords: {
        exact: [
          "[alquiler barcos blanes]",
          "[boat rental blanes]",
          "[alquilar barco costa brava]",
        ],
        phrase: [
          '"alquiler barcos cerca de barcelona"',
          '"boat rental near barcelona"',
          '"alquilar barco lloret de mar"',
        ],
        broad: [
          "alquiler barcos girona costa brava",
          "boat rental spanish coast catalonia",
          "actividades acuaticas blanes",
        ],
      },
      headlines: [
        "Alquiler Barcos Blanes",
        "Boat Rental Blanes Port",
        "Costa Brava Boat Hire",
        "1h de Barcelona - Barcos",
        "Puerto de Blanes",
      ],
      descriptions: [
        "Alquiler de barcos en el Puerto de Blanes. A 1h de Barcelona. Explora calas de la Costa Brava.",
        "Boat rental from Blanes port. Just 1h from Barcelona. Discover secret coves along Costa Brava.",
      ],
      landingPage: WEBSITE_BASE_URL + "/alquiler-barcos-blanes",
    });

    // Ad Group 4: Brand
    adGroups.push({
      name: "Brand",
      keywords: {
        exact: [
          "[costa brava rent a boat]",
          "[costabravarentaboat]",
        ],
        phrase: [
          '"costa brava rent a boat"',
          '"costa brava rent boat blanes"',
        ],
        broad: [],
      },
      headlines: [
        "Costa Brava Rent a Boat",
        "Web Oficial - Blanes",
        "Reserva Online Directa",
        "Mejor Precio Garantizado",
        "Official Website",
      ],
      descriptions: [
        "Pagina oficial de Costa Brava Rent a Boat. Reserva online con confirmacion inmediata. Blanes.",
        "Official website. Book directly for best prices. Boats from " + lowestPrice + "EUR. Blanes, Costa Brava.",
      ],
      landingPage: WEBSITE_BASE_URL + "/",
    });

    // Sitelink extensions
    const sitelinks = [
      {
        title: "Ver Flota Completa",
        description: "Todos nuestros barcos con precios y disponibilidad",
        url: WEBSITE_BASE_URL + "/",
      },
      {
        title: "Precios y Temporadas",
        description: "Consulta precios por temporada. Desde " + lowestPrice + "EUR",
        url: WEBSITE_BASE_URL + "/precios",
      },
      {
        title: "Preguntas Frecuentes",
        description: "Todo lo que necesitas saber antes de alquilar",
        url: WEBSITE_BASE_URL + "/faq",
      },
      {
        title: "Rutas Recomendadas",
        description: "Calas y rutas desde Blanes. Mapas incluidos",
        url: WEBSITE_BASE_URL + "/rutas",
      },
    ];

    // Callout extensions
    const callouts = [
      "Gasolina Incluida",
      "Sin Licencia Disponible",
      "Desde " + lowestPrice + "EUR",
      "15min Formacion",
      "Reserva Online",
      "Confirmacion Inmediata",
      "Puerto de Blanes",
      "Abril - Octubre",
    ];

    // Location targeting based on nationality data
    const locationTargeting = {
      primary: topNationalities.slice(0, 5).map((n) => ({
        country: n.countryCode,
        percentage: n.percentage,
        recommendation:
          n.percentage >= 20
            ? "high_priority"
            : n.percentage >= 10
            ? "medium_priority"
            : "low_priority",
      })),
      geoRadius: [
        {
          location: "Blanes, Girona, Spain",
          radius: "50km",
          bidAdjustment: "+30%",
          rationale: "Local residents and nearby tourists",
        },
        {
          location: "Barcelona, Spain",
          radius: "30km",
          bidAdjustment: "+20%",
          rationale: "Day-trippers from Barcelona metro area",
        },
        {
          location: "Girona, Spain",
          radius: "30km",
          bidAdjustment: "+15%",
          rationale: "Province residents and airport arrivals",
        },
      ],
    };

    // Budget allocation
    const budgetAllocation = adGroups.map((ag, idx) => {
      let percentage: number;
      if (ag.name === "Brand") {
        percentage = 10;
      } else if (ag.name === "Boats Without License") {
        percentage = 35;
      } else if (ag.name === "Boats With License") {
        percentage = 20;
      } else {
        percentage = 35;
      }
      return {
        adGroup: ag.name,
        monthlyBudget: Math.round((budget_monthly_eur * percentage) / 100),
        percentage,
      };
    });

    // Bidding strategy
    const biddingStrategy =
      campaign_type === "search"
        ? {
            strategy: "Target CPA",
            targetCpa: Math.round(
              parseFloat(stats.averages.avgAmount ?? "150") * 0.08
            ),
            rationale:
              "Target CPA at ~8% of average booking value (" +
              (stats.averages.avgAmount ?? "N/A") +
              " EUR). Adjust after 2 weeks of data.",
          }
        : campaign_type === "performance_max"
        ? {
            strategy: "Maximize Conversions with Target ROAS",
            targetRoas: 800,
            rationale:
              "Target 8x ROAS. Average booking value: " +
              (stats.averages.avgAmount ?? "N/A") +
              " EUR.",
          }
        : {
            strategy: "Maximize Clicks with Bid Cap",
            maxCpc: 1.5,
            rationale: "Display campaigns: cap CPC at 1.50 EUR for awareness.",
          };

    const brief = {
      campaignType: campaign_type,
      monthlyBudget: budget_monthly_eur + " EUR",
      targetLanguages: target_languages,
      businessData: {
        activeBoats: boats.length,
        noLicenseBoats: noLicenseBoats.length,
        licenseBoats: licenseBoats.length,
        lowestPrice: lowestPrice + " EUR",
        averageBookingValue: (stats.averages.avgAmount ?? "N/A") + " EUR",
        totalBookings: Number(stats.averages.totalBookings),
        topNationalities,
      },
      campaignStructure: {
        adGroups,
      },
      extensions: {
        sitelinks,
        callouts,
        structuredSnippets: [
          {
            header: "Types",
            values: [
              "Boats without license",
              "Licensed boats",
              "Group rentals",
              "Gift cards",
            ],
          },
          {
            header: "Destinations",
            values: ["Blanes", "Costa Brava", "Lloret de Mar", "Tossa de Mar"],
          },
        ],
        callExtension: { phone: BUSINESS_PHONE },
      },
      locationTargeting,
      budgetAllocation,
      biddingStrategy,
      negativeKeywords: [
        "gratis",
        "free",
        "segunda mano",
        "comprar",
        "vender",
        "used boat",
        "buy boat",
        "sell boat",
        "fishing boat sale",
        "barco vela",
        "sailboat",
        "yate lujo",
        "luxury yacht",
        "crucero",
        "cruise",
        "kayak",
        "paddle surf",
        "jet ski",
        "moto de agua",
      ],
      conversionTracking: {
        primaryGoal: "Booking completed (Stripe payment confirmation)",
        secondaryGoals: [
          "Booking form started",
          "Phone call click",
          "WhatsApp click",
        ],
      },
      seasonalNotes: [
        "Season runs April through October only",
        "Peak demand: July and August - increase bids 20-30%",
        "Shoulder months (April, May, October) - focus on local market and early-bird messaging",
        "Pause campaigns November through March",
      ],
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(brief, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 2: generate_meta_ads_brief
// ---------------------------------------------------------------------------

server.tool(
  "generate_meta_ads_brief",
  "Generate a Meta/Facebook/Instagram Ads campaign brief based on real business data (fleet, customer profiles, booking patterns).",
  {
    campaign_objective: z
      .enum(["traffic", "leads", "conversions", "awareness"])
      .describe("Meta Ads campaign objective"),
    budget_monthly_eur: z
      .number()
      .optional()
      .default(300)
      .describe("Monthly budget in EUR (default: 300)"),
    target_markets: z
      .array(z.string())
      .optional()
      .default(["ES", "FR", "DE", "GB"])
      .describe("Target country codes (ISO 3166-1 alpha-2)"),
  },
  async ({ campaign_objective, budget_monthly_eur, target_markets }) => {
    const boats = await getActiveBoats();
    const stats = await getBookingStats(getSeasonStartDate());
    const lowestPrice = getLowestPrice(boats);

    const avgGroupSize = parseFloat(stats.averages.avgPeople ?? "4");
    const avgBookingValue = parseFloat(stats.averages.avgAmount ?? "150");

    // Audience definitions
    const audiences = {
      custom: [
        {
          name: "Website Visitors (30 days)",
          source: "Meta Pixel",
          description: "All visitors to costabravarentaboat.com in the last 30 days",
          priority: "high",
        },
        {
          name: "Booking Abandoners",
          source: "Meta Pixel",
          description: "Users who started booking flow but did not complete payment",
          priority: "high",
          suggestedBudgetShare: "25%",
        },
        {
          name: "Past Customers",
          source: "Customer list upload",
          description: "Email/phone list of previous customers for retention campaigns",
          priority: "medium",
        },
      ],
      lookalike: [
        {
          name: "Lookalike - Past Customers 1%",
          source: "Past Customers custom audience",
          similarity: "1%",
          countries: target_markets,
          priority: "high",
        },
        {
          name: "Lookalike - Converters 2%",
          source: "Website converters (completed bookings)",
          similarity: "2%",
          countries: target_markets,
          priority: "medium",
        },
      ],
      interestBased: [
        {
          name: "Water Sports & Boating",
          interests: [
            "Boating",
            "Water sports",
            "Sailing",
            "Yachting",
            "Nautical sports",
          ],
          demographics: {
            ageRange: "25-55",
            income: "top 50%",
          },
          countries: target_markets,
        },
        {
          name: "Costa Brava Travelers",
          interests: [
            "Costa Brava",
            "Catalonia tourism",
            "Spain travel",
            "Mediterranean holidays",
            "Beach holidays",
          ],
          behaviors: ["Frequent travelers", "Travel app users"],
          demographics: {
            ageRange: "25-60",
          },
          countries: target_markets,
        },
        {
          name: "Family Activities",
          interests: [
            "Family travel",
            "Outdoor activities",
            "Family holidays",
            "Water parks",
            "Beach activities",
          ],
          demographics: {
            ageRange: "30-50",
            familyStatus: "Parents with children (3-17)",
          },
          countries: target_markets,
        },
      ],
    };

    // Ad creatives
    const creatives = {
      carousel: {
        format: "Carousel (3-5 cards)",
        recommendation:
          "Show different boats in each card, from no-license to licensed. End card with pricing CTA.",
        cards: boats.slice(0, 5).map((boat) => ({
          boatName: boat.name,
          headline: boat.name + (boat.requiresLicense ? "" : " - Sin Licencia"),
          description:
            "Capacidad: " +
            boat.capacity +
            " personas" +
            (boat.requiresLicense ? " | Con licencia" : " | Sin licencia"),
          landingPage:
            WEBSITE_BASE_URL + "/barco/" + boat.id,
          cta: "Book Now",
        })),
      },
      singleImage: {
        format: "Single Image (1080x1080 or 1200x628)",
        recommendation:
          "Hero shot of a boat on turquoise Costa Brava water with visible coastline. Overlay text with price.",
        suggestedOverlay:
          "Alquila un barco en Blanes desde " + lowestPrice + "EUR",
      },
      video: {
        format: "Video (15-30 seconds, 9:16 for Stories/Reels, 1:1 for Feed)",
        recommendation:
          "POV video of a boat trip along Costa Brava coast. Show crystal clear water, coves, and happy passengers. End with logo and CTA.",
        suggestedScript: [
          "0-3s: Drone shot of boat leaving Blanes port",
          "3-8s: POV from the boat, crystal clear water",
          "8-15s: Passengers enjoying, swimming at a cove",
          "15-25s: Different boats shown with pricing overlay",
          "25-30s: Logo + 'Book now at costabravarentaboat.com'",
        ],
      },
    };

    // Ad copy per language
    const adCopyByLanguage: Record<
      string,
      { primaryText: string; headline: string; description: string }
    > = {
      es: {
        primaryText:
          "Descubre las mejores calas de la Costa Brava desde el mar. Alquila un barco en Blanes sin necesidad de licencia. Gasolina incluida y formacion de 15 minutos. Reserva online desde " +
          lowestPrice +
          "EUR.",
        headline: "Alquila un Barco en Blanes",
        description: "Desde " + lowestPrice + "EUR | Gasolina Incluida",
      },
      en: {
        primaryText:
          "Discover the best coves of Costa Brava from the sea. Rent a boat in Blanes with no license required. Fuel included and 15-min briefing. Book online from " +
          lowestPrice +
          "EUR.",
        headline: "Rent a Boat in Blanes",
        description: "From " + lowestPrice + "EUR | Fuel Included",
      },
      fr: {
        primaryText:
          "Decouvrez les plus belles criques de la Costa Brava depuis la mer. Louez un bateau a Blanes sans permis. Essence incluse et formation de 15 min. Reservez en ligne des " +
          lowestPrice +
          "EUR.",
        headline: "Louez un Bateau a Blanes",
        description: "Des " + lowestPrice + "EUR | Essence Incluse",
      },
      de: {
        primaryText:
          "Entdecken Sie die schoensten Buchten der Costa Brava vom Meer aus. Mieten Sie ein Boot in Blanes ohne Fuehrerschein. Benzin inklusive und 15 Min. Einweisung. Online buchen ab " +
          lowestPrice +
          "EUR.",
        headline: "Boot Mieten in Blanes",
        description: "Ab " + lowestPrice + "EUR | Benzin Inklusive",
      },
      nl: {
        primaryText:
          "Ontdek de mooiste baaien van de Costa Brava vanaf zee. Huur een boot in Blanes zonder vaarbewijs. Brandstof inbegrepen en 15 min briefing. Boek online vanaf " +
          lowestPrice +
          "EUR.",
        headline: "Huur een Boot in Blanes",
        description: "Vanaf " + lowestPrice + "EUR | Brandstof Inbegrepen",
      },
      it: {
        primaryText:
          "Scopri le migliori cale della Costa Brava dal mare. Noleggia una barca a Blanes senza patente nautica. Benzina inclusa e briefing di 15 min. Prenota online da " +
          lowestPrice +
          "EUR.",
        headline: "Noleggia Barca a Blanes",
        description: "Da " + lowestPrice + "EUR | Benzina Inclusa",
      },
    };

    // Placement recommendations
    const placements = {
      feed: {
        platform: "Facebook + Instagram Feed",
        format: "Carousel or Single Image",
        priority: "high",
        budgetShare: "40%",
      },
      stories: {
        platform: "Instagram + Facebook Stories",
        format: "Vertical Video (9:16) or Single Image",
        priority: "high",
        budgetShare: "25%",
      },
      reels: {
        platform: "Instagram + Facebook Reels",
        format: "Vertical Video (9:16, 15-30s)",
        priority: "medium",
        budgetShare: "20%",
      },
      audienceNetwork: {
        platform: "Audience Network",
        format: "Banner or Native",
        priority: "low",
        budgetShare: "15%",
      },
    };

    // Seasonal budget strategy
    const seasonalStrategy = [
      {
        months: "April - May",
        budgetMultiplier: 0.7,
        monthlyBudget: Math.round(budget_monthly_eur * 0.7) + " EUR",
        keyMessages: [
          "Early season deals",
          "Beat the crowds",
          "Spring in Costa Brava",
        ],
        targetAudience: "Locals (ES), early planners (FR, DE)",
        specialCampaigns: ["Dia de la Madre (May)", "Puentes de primavera"],
      },
      {
        months: "June",
        budgetMultiplier: 1.0,
        monthlyBudget: budget_monthly_eur + " EUR",
        keyMessages: [
          "Summer is here",
          "Book your boat day",
          "San Juan celebrations",
        ],
        targetAudience: "All markets, ramping up tourist audiences",
        specialCampaigns: ["Noche de San Juan (June 23)"],
      },
      {
        months: "July - August",
        budgetMultiplier: 1.5,
        monthlyBudget: Math.round(budget_monthly_eur * 1.5) + " EUR",
        keyMessages: [
          "Peak season",
          "Book early, limited availability",
          "Best summer activity",
        ],
        targetAudience: "Heavy tourist audiences (FR, DE, GB, NL), families",
        specialCampaigns: [
          "Summer holidays campaign",
          "Last-minute availability alerts",
        ],
      },
      {
        months: "September - October",
        budgetMultiplier: 0.8,
        monthlyBudget: Math.round(budget_monthly_eur * 0.8) + " EUR",
        keyMessages: [
          "Last chance this season",
          "Quieter seas, perfect weather",
          "End-of-season special",
        ],
        targetAudience: "Locals, couples, off-peak travelers",
        specialCampaigns: ["Diada de Catalunya (Sep 11)", "Season closing sale"],
      },
      {
        months: "November - March",
        budgetMultiplier: 0,
        monthlyBudget: "0 EUR (season closed)",
        keyMessages: [],
        targetAudience: "N/A",
        specialCampaigns: [
          "Gift card campaigns only (Christmas, Reyes Magos)",
        ],
      },
    ];

    const brief = {
      campaignObjective: campaign_objective,
      monthlyBudget: budget_monthly_eur + " EUR",
      targetMarkets: target_markets,
      businessData: {
        activeBoats: boats.length,
        averageBookingValue: avgBookingValue + " EUR",
        averageGroupSize: avgGroupSize,
        totalBookingsThisSeason: Number(stats.averages.totalBookings),
        topBookingSources: stats.bySource.map((s) => ({
          source: s.source,
          count: Number(s.count),
        })),
      },
      audiences,
      creatives,
      adCopy: adCopyByLanguage,
      placements,
      budgetAllocation: {
        retargeting: {
          share: "30%",
          amount: Math.round(budget_monthly_eur * 0.3) + " EUR",
          audiences: ["Website Visitors", "Booking Abandoners"],
        },
        prospecting: {
          share: "50%",
          amount: Math.round(budget_monthly_eur * 0.5) + " EUR",
          audiences: [
            "Lookalikes",
            "Interest-based targeting",
          ],
        },
        retention: {
          share: "20%",
          amount: Math.round(budget_monthly_eur * 0.2) + " EUR",
          audiences: ["Past Customers"],
        },
      },
      seasonalStrategy,
      pixelEvents: [
        {
          event: "ViewContent",
          trigger: "Boat detail page viewed",
        },
        {
          event: "InitiateCheckout",
          trigger: "Booking form started (date/time selected)",
        },
        {
          event: "Purchase",
          trigger: "Booking payment completed",
          value: "dynamic (booking total)",
        },
        {
          event: "Lead",
          trigger: "WhatsApp click or phone call",
        },
      ],
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(brief, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 3: get_audience_insights
// ---------------------------------------------------------------------------

server.tool(
  "get_audience_insights",
  "Analyze customer and booking data to generate audience insights for ad targeting. Returns nationality distribution, group sizes, popular boats, booking sources, peak days, and lead times.",
  {
    period: z
      .enum(["month", "season", "all_time"])
      .describe("Analysis period: current month, current season, or all time"),
  },
  async ({ period }) => {
    let startDate: Date | undefined;
    const todayStr = madridToday();

    if (period === "month") {
      const [y, m] = todayStr.split("-");
      startDate = new Date(`${y}-${m}-01T00:00:00Z`);
    } else if (period === "season") {
      startDate = getSeasonStartDate();
    }
    // all_time: no startDate filter

    const stats = await getBookingStats(startDate);

    const totalBookings = Number(stats.averages.totalBookings);

    // Nationality distribution with percentages
    const nationalityDistribution = stats.byNationality.map((n) => ({
      nationality: n.nationality ?? "Unknown",
      countryCode: nationalityToCountryCode(n.nationality),
      bookings: Number(n.count),
      percentage: totalBookings
        ? Math.round((Number(n.count) / totalBookings) * 100)
        : 0,
      revenue: (n.revenue ?? "0") + " EUR",
    }));

    // Popular boats
    const popularBoats = stats.byBoat.map((b) => ({
      boat: b.boatName ?? b.boatId,
      bookings: Number(b.count),
      revenue: (b.revenue ?? "0") + " EUR",
      shareOfBookings: totalBookings
        ? Math.round((Number(b.count) / totalBookings) * 100)
        : 0,
    }));

    // Booking sources
    const sources = stats.bySource.map((s) => ({
      source: s.source,
      bookings: Number(s.count),
      percentage: totalBookings
        ? Math.round((Number(s.count) / totalBookings) * 100)
        : 0,
    }));

    // Peak booking days
    const peakDays = stats.byDayOfWeek.map((d) => ({
      day: dayOfWeekName(Number(d.dayOfWeek)),
      bookings: Number(d.count),
      percentage: totalBookings
        ? Math.round((Number(d.count) / totalBookings) * 100)
        : 0,
    }));

    // Monthly distribution
    const monthlyPattern = stats.byMonth.map((m) => ({
      month: monthName(Number(m.month)),
      monthNumber: Number(m.month),
      bookings: Number(m.count),
      revenue: (m.revenue ?? "0") + " EUR",
    }));

    // Lead time analysis (days between created and trip)
    const conditions = [
      sql`${schema.bookings.bookingStatus} IN ('confirmed', 'completed')`,
    ];
    if (startDate) {
      conditions.push(gte(schema.bookings.startTime, startDate));
    }

    const [leadTimeData] = await db
      .select({
        avgLeadDays: sql<string>`ROUND(AVG(EXTRACT(EPOCH FROM (${schema.bookings.startTime} - ${schema.bookings.createdAt})) / 86400), 1)`,
        minLeadDays: sql<string>`ROUND(MIN(EXTRACT(EPOCH FROM (${schema.bookings.startTime} - ${schema.bookings.createdAt})) / 86400), 1)`,
        maxLeadDays: sql<string>`ROUND(MAX(EXTRACT(EPOCH FROM (${schema.bookings.startTime} - ${schema.bookings.createdAt})) / 86400), 1)`,
      })
      .from(schema.bookings)
      .where(and(...conditions));

    const insights = {
      period,
      analysisDate: todayStr,
      summary: {
        totalBookings,
        totalRevenue: (stats.averages.totalRevenue ?? "0") + " EUR",
        averageBookingValue: (stats.averages.avgAmount ?? "0") + " EUR",
        averageDuration: (stats.averages.avgHours ?? "0") + " hours",
        averageGroupSize: (stats.averages.avgPeople ?? "0") + " people",
      },
      nationalityDistribution,
      popularBoats,
      bookingSources: sources,
      peakBookingDays: peakDays,
      monthlyPattern,
      leadTime: {
        averageDays: parseFloat(leadTimeData?.avgLeadDays ?? "0"),
        minimumDays: parseFloat(leadTimeData?.minLeadDays ?? "0"),
        maximumDays: parseFloat(leadTimeData?.maxLeadDays ?? "0"),
        insight:
          parseFloat(leadTimeData?.avgLeadDays ?? "0") <= 3
            ? "Most bookings are last-minute (within 3 days). Prioritize urgency messaging and mobile-first ads."
            : parseFloat(leadTimeData?.avgLeadDays ?? "0") <= 14
            ? "Moderate lead time. Mix of planners and spontaneous bookers. Use both awareness and conversion campaigns."
            : "Long planning horizon. Focus on awareness and consideration campaigns well ahead of season.",
      },
      adTargetingRecommendations: {
        primaryMarkets: nationalityDistribution
          .filter((n: { percentage: number; countryCode: string }) => n.percentage >= 15)
          .map((n: { countryCode: string }) => n.countryCode),
        secondaryMarkets: nationalityDistribution
          .filter((n: { percentage: number; countryCode: string }) => n.percentage >= 5 && n.percentage < 15)
          .map((n: { countryCode: string }) => n.countryCode),
        bestDaysToAdvertise: peakDays.slice(0, 3).map((d: { day: string }) => d.day),
        bestMonths: monthlyPattern
          .sort((a: { bookings: number }, b: { bookings: number }) => b.bookings - a.bookings)
          .slice(0, 3)
          .map((m: { month: string }) => m.month),
        suggestedDemographic: {
          ageRange:
            parseFloat(stats.averages.avgPeople ?? "4") >= 4 ? "28-50 (family groups)" : "25-45 (couples/friends)",
          interests:
            parseFloat(stats.averages.avgPeople ?? "4") >= 4
              ? [
                  "Family travel",
                  "Water activities",
                  "Beach holidays",
                  "Costa Brava",
                ]
              : [
                  "Water sports",
                  "Adventure travel",
                  "Boating",
                  "Couples travel",
                ],
        },
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(insights, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 4: generate_seasonal_campaign_plan
// ---------------------------------------------------------------------------

server.tool(
  "generate_seasonal_campaign_plan",
  "Create a month-by-month advertising campaign plan for the entire season (April-October) with budget allocation, messaging, and audience strategy per month.",
  {
    total_budget_eur: z
      .number()
      .describe("Total season budget in EUR across all platforms"),
    platforms: z
      .array(z.string())
      .optional()
      .default(["google_ads", "meta_ads"])
      .describe("Advertising platforms to include"),
  },
  async ({ total_budget_eur, platforms }) => {
    const stats = await getBookingStats();
    const boats = await getActiveBoats();
    const lowestPrice = getLowestPrice(boats);

    // Monthly weight based on historical patterns (July/Aug are peak)
    const monthWeights: Record<number, number> = {
      4: 0.08, // April
      5: 0.1, // May
      6: 0.14, // June
      7: 0.22, // July
      8: 0.22, // August
      9: 0.14, // September
      10: 0.1, // October
    };

    // Adjust weights based on actual booking data if available
    const totalHistorical = stats.byMonth.reduce(
      (s, m) => s + Number(m.count),
      0
    );
    if (totalHistorical > 50) {
      for (const m of stats.byMonth) {
        const monthNum = Number(m.month);
        if (monthWeights[monthNum] !== undefined) {
          monthWeights[monthNum] =
            Math.round((Number(m.count) / totalHistorical) * 100) / 100;
        }
      }
    }

    // Platform split (default 60/40 Google/Meta)
    const platformSplit: Record<string, number> = {};
    if (
      platforms.includes("google_ads") &&
      platforms.includes("meta_ads")
    ) {
      platformSplit["google_ads"] = 0.6;
      platformSplit["meta_ads"] = 0.4;
    } else {
      for (const p of platforms) {
        platformSplit[p] = 1.0 / platforms.length;
      }
    }

    const monthlyPlans = SEASON_MONTHS.map((monthNum) => {
      const weight = monthWeights[monthNum] ?? 0.1;
      const monthBudget = Math.round(total_budget_eur * weight);
      const name = monthName(monthNum);

      const platformBudgets = Object.entries(platformSplit).map(
        ([platform, share]) => ({
          platform,
          budget: Math.round(monthBudget * share) + " EUR",
        })
      );

      let keyMessages: string[];
      let targetAudience: string;
      let specialCampaigns: string[];
      let biddingAdjustment: string;

      switch (monthNum) {
        case 4: // April
          keyMessages = [
            "Season opening - be the first on the water",
            "Spring special: best prices of the season",
            "Enjoy the Costa Brava before the crowds",
          ];
          targetAudience =
            "Local residents (50km radius Blanes/Barcelona), early-bird planners from FR/DE";
          specialCampaigns = [
            "Season Opening Campaign",
            "Semana Santa (if applicable)",
          ];
          biddingAdjustment = "Conservative - building data";
          break;
        case 5: // May
          keyMessages = [
            "Perfect weather, quiet seas",
            "Puente de Mayo - book your boat day",
            "Ideal for families - calm spring waters",
          ];
          targetAudience =
            "Local market, French border tourists, early summer planners";
          specialCampaigns = [
            "Dia de la Madre",
            "Puente de Mayo",
            "Early summer promo",
          ];
          biddingAdjustment = "Moderate - scaling up";
          break;
        case 6: // June
          keyMessages = [
            "Summer starts now",
            "San Juan on the water",
            "Book ahead for July/August",
          ];
          targetAudience =
            "Broadening to all tourist markets (ES, FR, DE, GB, NL)";
          specialCampaigns = [
            "San Juan Special (June 23)",
            "Summer kickoff",
            "Advance booking for July push",
          ];
          biddingAdjustment = "Aggressive - ramp up for peak";
          break;
        case 7: // July
          keyMessages = [
            "Peak summer - limited availability",
            "The best activity in Costa Brava",
            "Create unforgettable memories",
          ];
          targetAudience =
            "All international markets, heavy tourist targeting, families on holiday";
          specialCampaigns = [
            "Summer holidays (full push)",
            "Last-minute slots alerts",
            "Instagram Reels campaign",
          ];
          biddingAdjustment = "Maximum - peak demand, maximize revenue";
          break;
        case 8: // August
          keyMessages = [
            "Do not miss the summer",
            "Best boat day ever",
            "Groups welcome - up to " + Math.max(...boats.map((b) => b.capacity)) + " people",
          ];
          targetAudience =
            "International tourists at peak, families, groups of friends";
          specialCampaigns = [
            "Assumption Day (Aug 15)",
            "Last weeks of peak push",
            "UGC/review campaigns",
          ];
          biddingAdjustment = "Maximum - sustain peak performance";
          break;
        case 9: // September
          keyMessages = [
            "September sun - quieter seas",
            "Best time for couples",
            "Still warm, less crowded",
          ];
          targetAudience =
            "Locals returning from holiday, couples, off-peak travelers";
          specialCampaigns = [
            "Diada de Catalunya (Sep 11)",
            "Back-to-routine escape",
            "Couples package push",
          ];
          biddingAdjustment = "Moderate - winding down";
          break;
        case 10: // October
          keyMessages = [
            "Last chance this year",
            "Season closing - final bookings",
            "Gift card for next season",
          ];
          targetAudience = "Local market, gift card buyers, loyal customers";
          specialCampaigns = [
            "Season closing campaign",
            "Gift card push for Christmas",
            "Early bird next season (email collection)",
          ];
          biddingAdjustment = "Conservative - closing season";
          break;
        default:
          keyMessages = [];
          targetAudience = "N/A";
          specialCampaigns = [];
          biddingAdjustment = "N/A";
      }

      return {
        month: name,
        monthNumber: monthNum,
        budgetWeight: Math.round(weight * 100) + "%",
        totalBudget: monthBudget + " EUR",
        platformBudgets,
        keyMessages,
        targetAudience,
        specialCampaigns,
        biddingAdjustment,
      };
    });

    // Off-season plan
    const offSeasonPlan = {
      months: "November - March",
      budget: "Minimal (gift cards only)",
      strategy: [
        "Pause all performance campaigns",
        "Run gift card campaigns during Christmas and Reyes Magos (Jan 6)",
        "Email list nurture with early-bird offers for next season",
        "Social media: organic content only (throwback posts, route guides)",
      ],
      giftCardCampaign: {
        timing: "December 1 - January 10",
        platforms: ["meta_ads"],
        budget: "100-200 EUR total",
        message:
          "Regala una experiencia en el mar. Tarjeta regalo desde " + lowestPrice + "EUR.",
        landingPage: WEBSITE_BASE_URL + "/tarjeta-regalo",
      },
    };

    const plan = {
      totalSeasonBudget: total_budget_eur + " EUR",
      platforms,
      platformSplit: Object.entries(platformSplit).map(([p, s]) => ({
        platform: p,
        share: Math.round(s * 100) + "%",
        seasonTotal: Math.round(total_budget_eur * s) + " EUR",
      })),
      dataSource: {
        historicalBookings: Number(stats.averages.totalBookings),
        averageBookingValue: (stats.averages.avgAmount ?? "N/A") + " EUR",
        weightsBasedOn:
          totalHistorical > 50
            ? "Historical booking distribution"
            : "Industry standard seasonal weights",
      },
      monthlyPlans,
      offSeasonPlan,
      kpis: {
        targetCPA: Math.round(parseFloat(stats.averages.avgAmount ?? "150") * 0.1) + " EUR",
        targetROAS: "8x",
        targetCTR: "2.5% (search), 1.0% (display/social)",
        targetConversionRate: "3-5% (website visitors to booking)",
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(plan, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 5: suggest_ad_copy
// ---------------------------------------------------------------------------

server.tool(
  "suggest_ad_copy",
  "Generate multiple ad copy variants for a specific platform, language, and focus area. Respects character limits for each platform.",
  {
    platform: z
      .enum(["google_ads", "meta_ads"])
      .describe("Advertising platform"),
    language: z
      .enum(["es", "en", "fr", "de", "nl", "it", "ru", "ca"])
      .describe("Ad copy language"),
    focus: z
      .enum(["price", "experience", "location", "no_license", "family", "gift_card"])
      .describe("Ad copy focus/angle"),
    boat_id: z
      .string()
      .optional()
      .describe("Specific boat ID for boat-specific ads"),
  },
  async ({ platform, language, focus, boat_id }) => {
    const boats = await getActiveBoats();
    const lowestPrice = getLowestPrice(boats);

    let targetBoat: BoatRow | undefined;
    if (boat_id) {
      targetBoat = boats.find((b) => b.id === boat_id);
    }

    // Copy variants organized by platform and focus
    // Google Ads: Headlines max 30 chars, Descriptions max 90 chars
    // Meta Ads: Primary text ~125 chars, Headline ~40 chars, Description ~30 chars

    interface GoogleAdVariant {
      headlines: string[];
      descriptions: string[];
    }

    interface MetaAdVariant {
      primaryText: string;
      headline: string;
      description: string;
      cta: string;
    }

    const googleVariants: Record<string, Record<string, GoogleAdVariant[]>> = {
      es: {
        price: [
          {
            headlines: [
              "Barcos Desde " + lowestPrice + "EUR",
              "Alquiler Barcos Blanes",
              "Gasolina Incluida",
              "Mejor Precio Online",
              "Reserva Ya",
            ],
            descriptions: [
              "Alquila barcos en Blanes desde " + lowestPrice + "EUR. Gasolina incluida. Reserva online con confirmacion inmediata.",
              "Precios transparentes, sin sorpresas. Barcos desde " + lowestPrice + "EUR con gasolina incluida. Puerto de Blanes.",
            ],
          },
          {
            headlines: [
              "Oferta Barcos Blanes",
              "Desde " + lowestPrice + "EUR/Sesion",
              "Sin Costes Ocultos",
              "Reserva 2 Minutos",
              "Todo Incluido",
            ],
            descriptions: [
              "Alquiler de barcos en Blanes al mejor precio. Desde " + lowestPrice + "EUR con combustible incluido. Reserva online.",
              "Precios claros desde " + lowestPrice + "EUR. Sin fianza con tarjeta. Gasolina incluida. Abierto Abril-Octubre.",
            ],
          },
        ],
        experience: [
          {
            headlines: [
              "Explora Costa Brava",
              "Calas Secretas Blanes",
              "Tu Aventura en el Mar",
              "Recuerdos Inolvidables",
              "Navega en Blanes",
            ],
            descriptions: [
              "Descubre calas escondidas de la Costa Brava desde el mar. Alquila un barco en Blanes y crea recuerdos unicos.",
              "Navega por la costa de Blanes a Lloret. Aguas cristalinas y calas solo accesibles en barco. Reserva hoy.",
            ],
          },
        ],
        location: [
          {
            headlines: [
              "Puerto de Blanes",
              "1h de Barcelona",
              "Costa Brava Barcos",
              "Blanes - Lloret - Tossa",
              "Alquiler Barcos Girona",
            ],
            descriptions: [
              "Alquiler de barcos en el Puerto de Blanes. A solo 1 hora de Barcelona. Explora la Costa Brava desde el mar.",
              "Desde Blanes, navega a Lloret de Mar y Tossa. Las mejores rutas de la Costa Brava. Reserva online.",
            ],
          },
        ],
        no_license: [
          {
            headlines: [
              "Barcos Sin Licencia",
              "No Necesitas Titulo",
              "15min Formacion Gratis",
              "Facil y Seguro",
              "Sin Carnet Nautico",
            ],
            descriptions: [
              "Alquila barcos sin licencia en Blanes. Te formamos en 15 min. Facil, seguro y divertido. Reserva online.",
              "No tienes licencia? No hay problema. Barcos sin carnet en Blanes. Formacion incluida. Desde " + lowestPrice + "EUR.",
            ],
          },
        ],
        family: [
          {
            headlines: [
              "Plan Familiar Blanes",
              "Barcos Para Familias",
              "Hasta " + Math.max(...boats.map((b) => b.capacity)) + " Personas",
              "Ninos Bienvenidos",
              "Dia en Familia",
            ],
            descriptions: [
              "Alquila un barco para toda la familia en Blanes. Hasta " + Math.max(...boats.map((b) => b.capacity)) + " personas. Seguro y divertido. Desde " + lowestPrice + "EUR.",
              "El mejor plan familiar en Costa Brava. Barcos faciles de manejar, gasolina incluida. Reserva online.",
            ],
          },
        ],
        gift_card: [
          {
            headlines: [
              "Tarjeta Regalo Barco",
              "Regala Experiencia Mar",
              "Regalo Original Blanes",
              "Desde " + lowestPrice + "EUR",
              "Regala Aventura",
            ],
            descriptions: [
              "Regala un dia en barco por la Costa Brava. Tarjetas regalo desde " + lowestPrice + "EUR. Entrega digital inmediata.",
              "El regalo perfecto: un dia en el mar. Tarjeta regalo para alquiler de barco en Blanes. Compra online.",
            ],
          },
        ],
      },
      en: {
        price: [
          {
            headlines: [
              "Boats From " + lowestPrice + "EUR",
              "Boat Rental Blanes",
              "Fuel Included",
              "Best Price Online",
              "Book Now",
            ],
            descriptions: [
              "Rent boats in Blanes from " + lowestPrice + "EUR. Fuel included. Book online with instant confirmation.",
              "Transparent pricing, no hidden fees. Boats from " + lowestPrice + "EUR with fuel. Blanes port, Costa Brava.",
            ],
          },
        ],
        experience: [
          {
            headlines: [
              "Explore Costa Brava",
              "Secret Coves Blanes",
              "Your Sea Adventure",
              "Unforgettable Memories",
              "Sail From Blanes",
            ],
            descriptions: [
              "Discover hidden coves of Costa Brava from the sea. Rent a boat in Blanes. Create unforgettable memories.",
              "Sail along the coast from Blanes to Lloret. Crystal clear waters and secluded coves. Book today.",
            ],
          },
        ],
        location: [
          {
            headlines: [
              "Blanes Port Boats",
              "1h From Barcelona",
              "Costa Brava Boats",
              "Blanes-Lloret-Tossa",
              "Boat Hire Girona",
            ],
            descriptions: [
              "Boat rental from Blanes port. Just 1 hour from Barcelona. Explore Costa Brava from the sea.",
              "From Blanes, sail to Lloret de Mar and Tossa. Best routes on the Costa Brava. Book online now.",
            ],
          },
        ],
        no_license: [
          {
            headlines: [
              "No License Needed",
              "Boats Without License",
              "15min Free Briefing",
              "Easy and Safe",
              "No Boating License",
            ],
            descriptions: [
              "Rent boats without a license in Blanes. 15-min briefing included. Easy, safe, and fun. Book online.",
              "No license? No problem. No-license boats in Blanes. Training included. From " + lowestPrice + "EUR.",
            ],
          },
        ],
        family: [
          {
            headlines: [
              "Family Boat Day",
              "Boats For Families",
              "Up to " + Math.max(...boats.map((b) => b.capacity)) + " People",
              "Kids Welcome",
              "Family Fun Blanes",
            ],
            descriptions: [
              "Rent a boat for the whole family in Blanes. Up to " + Math.max(...boats.map((b) => b.capacity)) + " people. Safe and fun. From " + lowestPrice + "EUR.",
              "Best family activity on Costa Brava. Easy-to-drive boats, fuel included. Book online today.",
            ],
          },
        ],
        gift_card: [
          {
            headlines: [
              "Boat Gift Card",
              "Gift a Sea Experience",
              "Unique Gift Blanes",
              "From " + lowestPrice + "EUR",
              "Gift an Adventure",
            ],
            descriptions: [
              "Gift a boat day on Costa Brava. Gift cards from " + lowestPrice + "EUR. Instant digital delivery.",
              "The perfect gift: a day at sea. Boat rental gift card in Blanes. Buy online instantly.",
            ],
          },
        ],
      },
      fr: {
        price: [
          {
            headlines: [
              "Bateaux Des " + lowestPrice + "EUR",
              "Location Bateaux Blanes",
              "Essence Incluse",
              "Meilleur Prix En Ligne",
              "Reservez Maintenant",
            ],
            descriptions: [
              "Louez un bateau a Blanes des " + lowestPrice + "EUR. Essence incluse. Reservez en ligne, confirmation immediate.",
              "Prix transparents. Bateaux des " + lowestPrice + "EUR, carburant inclus. Port de Blanes, Costa Brava.",
            ],
          },
        ],
        experience: [
          {
            headlines: [
              "Explorez Costa Brava",
              "Criques Cachees",
              "Aventure en Mer",
              "Souvenirs Inoubliables",
              "Naviguez a Blanes",
            ],
            descriptions: [
              "Decouvrez les criques cachees de la Costa Brava. Louez un bateau a Blanes. Souvenirs inoubliables.",
              "Naviguez de Blanes a Lloret. Eaux cristallines et criques secretes. Reservez aujourd'hui.",
            ],
          },
        ],
        no_license: [
          {
            headlines: [
              "Bateaux Sans Permis",
              "Pas de Permis Requis",
              "Formation 15min Offerte",
              "Facile et Sur",
              "Sans Permis Bateau",
            ],
            descriptions: [
              "Louez un bateau sans permis a Blanes. Formation de 15 min incluse. Facile et amusant. Reservez en ligne.",
              "Pas de permis? Pas de probleme. Bateaux sans permis a Blanes. Des " + lowestPrice + "EUR. Reservez maintenant.",
            ],
          },
        ],
      },
      de: {
        price: [
          {
            headlines: [
              "Boote Ab " + lowestPrice + "EUR",
              "Bootverleih Blanes",
              "Benzin Inklusive",
              "Bester Preis Online",
              "Jetzt Buchen",
            ],
            descriptions: [
              "Mieten Sie ein Boot in Blanes ab " + lowestPrice + "EUR. Benzin inklusive. Online buchen, sofortige Bestaetigung.",
              "Transparente Preise. Boote ab " + lowestPrice + "EUR mit Kraftstoff. Hafen von Blanes, Costa Brava.",
            ],
          },
        ],
        experience: [
          {
            headlines: [
              "Costa Brava Entdecken",
              "Geheime Buchten",
              "Ihr Meeresabenteuer",
              "Unvergessliche Momente",
              "Segeln Ab Blanes",
            ],
            descriptions: [
              "Entdecken Sie versteckte Buchten der Costa Brava. Mieten Sie ein Boot in Blanes. Unvergesslich.",
              "Segeln Sie von Blanes nach Lloret. Kristallklares Wasser und einsame Buchten. Jetzt buchen.",
            ],
          },
        ],
        no_license: [
          {
            headlines: [
              "Boote Ohne Schein",
              "Kein Fuehrerschein Noetig",
              "15min Einweisung Gratis",
              "Einfach und Sicher",
              "Ohne Bootsfuehrerschein",
            ],
            descriptions: [
              "Mieten Sie Boote ohne Fuehrerschein in Blanes. 15-Min-Einweisung inklusive. Einfach und sicher.",
              "Kein Bootsfuehrerschein? Kein Problem. Boote ohne Schein in Blanes. Ab " + lowestPrice + "EUR.",
            ],
          },
        ],
      },
    };

    const metaVariants: Record<string, Record<string, MetaAdVariant[]>> = {
      es: {
        price: [
          {
            primaryText:
              "Alquila un barco en Blanes desde " + lowestPrice + "EUR con gasolina incluida. Sin sorpresas, sin costes ocultos. Reserva online en 2 minutos.",
            headline: "Barcos Desde " + lowestPrice + "EUR en Blanes",
            description: "Gasolina incluida",
            cta: "Book Now",
          },
          {
            primaryText:
              "Este verano, navega por la Costa Brava al mejor precio. Barcos desde " + lowestPrice + "EUR con todo incluido. Puerto de Blanes.",
            headline: "Mejor Precio Costa Brava",
            description: "Reserva online ahora",
            cta: "Learn More",
          },
        ],
        experience: [
          {
            primaryText:
              "Imagina navegar entre calas de aguas cristalinas en la Costa Brava. Alquila un barco en Blanes y descubre rincones solo accesibles desde el mar.",
            headline: "Descubre Calas Secretas",
            description: "Alquiler barcos Blanes",
            cta: "Book Now",
          },
        ],
        no_license: [
          {
            primaryText:
              "No necesitas licencia para vivir la experiencia. Alquila un barco sin carnet en Blanes. Te formamos en 15 minutos. Gasolina incluida.",
            headline: "Barcos Sin Licencia Blanes",
            description: "Formacion incluida",
            cta: "Book Now",
          },
        ],
        family: [
          {
            primaryText:
              "El mejor plan familiar del verano. Alquila un barco en Blanes para hasta " + Math.max(...boats.map((b) => b.capacity)) + " personas. Seguro, facil y con gasolina incluida.",
            headline: "Plan Familiar en Barco",
            description: "Ninos bienvenidos",
            cta: "Book Now",
          },
        ],
        location: [
          {
            primaryText:
              "A solo 1 hora de Barcelona. Alquila un barco en el Puerto de Blanes y explora la Costa Brava desde el mar. Reserva online.",
            headline: "Blanes - 1h de Barcelona",
            description: "Puerto de Blanes",
            cta: "Learn More",
          },
        ],
        gift_card: [
          {
            primaryText:
              "Regala un dia inolvidable en el mar. Tarjetas regalo para alquilar barco en Blanes. Entrega digital inmediata. Desde " + lowestPrice + "EUR.",
            headline: "Tarjeta Regalo Barco",
            description: "Entrega digital",
            cta: "Shop Now",
          },
        ],
      },
      en: {
        price: [
          {
            primaryText:
              "Rent a boat in Blanes from just " + lowestPrice + "EUR with fuel included. No hidden costs. Book online in 2 minutes and get instant confirmation.",
            headline: "Boats From " + lowestPrice + "EUR in Blanes",
            description: "Fuel included",
            cta: "Book Now",
          },
        ],
        experience: [
          {
            primaryText:
              "Imagine sailing through crystal-clear coves on Costa Brava. Rent a boat in Blanes and discover spots only accessible from the sea.",
            headline: "Discover Secret Coves",
            description: "Boat rental Blanes",
            cta: "Book Now",
          },
        ],
        no_license: [
          {
            primaryText:
              "No boating license? No problem. Rent a boat in Blanes without any license. 15-minute briefing included. Fuel included.",
            headline: "No License Boats Blanes",
            description: "Training included",
            cta: "Book Now",
          },
        ],
        family: [
          {
            primaryText:
              "The best family activity this summer. Rent a boat in Blanes for up to " + Math.max(...boats.map((b) => b.capacity)) + " people. Safe, easy, and fuel included.",
            headline: "Family Boat Day Blanes",
            description: "Kids welcome",
            cta: "Book Now",
          },
        ],
        location: [
          {
            primaryText:
              "Just 1 hour from Barcelona. Rent a boat from Blanes port and explore Costa Brava from the sea. Book online.",
            headline: "Blanes - 1h From Barcelona",
            description: "Blanes port",
            cta: "Learn More",
          },
        ],
        gift_card: [
          {
            primaryText:
              "Gift an unforgettable day at sea. Boat rental gift cards in Blanes. Instant digital delivery. From " + lowestPrice + "EUR.",
            headline: "Boat Rental Gift Card",
            description: "Digital delivery",
            cta: "Shop Now",
          },
        ],
      },
    };

    let variants;
    if (platform === "google_ads") {
      const langVariants = googleVariants[language] ?? googleVariants["es"];
      variants = langVariants?.[focus] ?? langVariants?.["price"] ?? [];
    } else {
      const langVariants = metaVariants[language] ?? metaVariants["es"];
      variants = langVariants?.[focus] ?? langVariants?.["price"] ?? [];
    }

    // If a specific boat was requested, add boat-specific variants
    let boatSpecificVariants;
    if (targetBoat) {
      if (platform === "google_ads") {
        boatSpecificVariants = {
          headlines: [
            targetBoat.name.length <= 30 ? targetBoat.name : targetBoat.name.substring(0, 27) + "...",
            "Capacidad " + targetBoat.capacity + " Personas",
            (targetBoat.requiresLicense ? "Con" : "Sin") + " Licencia",
            "Alquiler " + targetBoat.name.split(" ")[0],
            "Reserva Online Hoy",
          ],
          descriptions: [
            "Alquila el " + targetBoat.name + " en Blanes. Capacidad " + targetBoat.capacity + " personas. " + (targetBoat.requiresLicense ? "Licencia requerida" : "Sin licencia") + ". Reserva online.",
            targetBoat.name + ": " + targetBoat.capacity + " personas, " + (targetBoat.requiresLicense ? "con licencia" : "sin licencia") + ". Gasolina incluida. Puerto de Blanes.",
          ],
        };
      } else {
        boatSpecificVariants = {
          primaryText:
            "Alquila el " +
            targetBoat.name +
            " en Blanes. " +
            (targetBoat.requiresLicense
              ? "Barco con licencia"
              : "Sin licencia necesaria") +
            ". Capacidad para " +
            targetBoat.capacity +
            " personas. Gasolina incluida.",
          headline: targetBoat.name.length <= 40 ? targetBoat.name : targetBoat.name.substring(0, 37) + "...",
          description: targetBoat.capacity + " personas max",
          cta: "Book Now",
          landingPage: WEBSITE_BASE_URL + "/barco/" + targetBoat.id,
        };
      }
    }

    // UTM parameters suggestion
    const utmSuggestion = {
      template:
        "?utm_source=" +
        (platform === "google_ads" ? "google" : "meta") +
        "&utm_medium=cpc&utm_campaign={campaign_name}&utm_content=" +
        focus +
        "&utm_term={keyword}",
      example:
        WEBSITE_BASE_URL +
        "/barcos-sin-licencia?utm_source=" +
        (platform === "google_ads" ? "google" : "meta") +
        "&utm_medium=cpc&utm_campaign=no_license_" +
        language +
        "&utm_content=" +
        focus,
    };

    const result = {
      platform,
      language,
      focus,
      boatId: boat_id ?? null,
      characterLimits:
        platform === "google_ads"
          ? {
              headline: "30 characters max",
              description: "90 characters max",
              note: "3-15 headlines, 2-4 descriptions per responsive ad",
            }
          : {
              primaryText: "125 characters recommended (up to 2200)",
              headline: "40 characters recommended",
              description: "30 characters recommended",
            },
      variants,
      boatSpecific: boatSpecificVariants ?? null,
      utmParameters: utmSuggestion,
      callToAction:
        platform === "meta_ads"
          ? [
              "Book Now",
              "Learn More",
              "Shop Now",
              "Get Offer",
              "Send WhatsApp Message",
            ]
          : null,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 6: get_keyword_opportunities
// ---------------------------------------------------------------------------

server.tool(
  "get_keyword_opportunities",
  "Generate comprehensive keyword lists for Google Ads organized by category, with match type suggestions and negative keywords based on the active boat fleet.",
  {},
  async () => {
    const boats = await getActiveBoats();
    const noLicenseBoats = boats.filter((b) => !b.requiresLicense);
    const licenseBoats = boats.filter((b) => b.requiresLicense);
    const maxCapacity = Math.max(...boats.map((b) => b.capacity));

    const locations = [
      "blanes",
      "costa brava",
      "lloret de mar",
      "tossa de mar",
      "girona",
      "barcelona",
    ];

    // Brand keywords
    const brandKeywords = [
      {
        keyword: "costa brava rent a boat",
        matchType: "exact",
        intent: "brand",
        estimatedVolume: "low",
      },
      {
        keyword: "costabravarentaboat",
        matchType: "exact",
        intent: "brand",
        estimatedVolume: "low",
      },
      {
        keyword: "costa brava rent a boat blanes",
        matchType: "exact",
        intent: "brand",
        estimatedVolume: "low",
      },
      {
        keyword: "rent a boat costa brava",
        matchType: "phrase",
        intent: "brand",
        estimatedVolume: "medium",
      },
    ];

    // Product keywords (by boat)
    const productKeywords = boats.flatMap((boat) => [
      {
        keyword: "alquiler " + boat.name.toLowerCase(),
        matchType: "phrase",
        intent: "product",
        estimatedVolume: "low",
      },
      {
        keyword: boat.name.toLowerCase() + " rental blanes",
        matchType: "phrase",
        intent: "product",
        estimatedVolume: "low",
      },
    ]);

    // License-based keywords
    const licenseKeywords = [
      {
        keyword: "alquilar barco sin licencia blanes",
        matchType: "exact",
        intent: "high_commercial",
        estimatedVolume: "medium",
      },
      {
        keyword: "barco sin licencia costa brava",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "medium",
      },
      {
        keyword: "boat rental no license costa brava",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "medium",
      },
      {
        keyword: "alquilar barco sin carnet",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "medium",
      },
      {
        keyword: "location bateau sans permis blanes",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "medium",
      },
      {
        keyword: "boot mieten ohne fuehrerschein costa brava",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "low",
      },
      {
        keyword: "alquiler barco con licencia blanes",
        matchType: "exact",
        intent: "high_commercial",
        estimatedVolume: "low",
      },
    ];

    // Location keywords
    const locationKeywords = locations.flatMap((loc) => [
      {
        keyword: "alquiler barcos " + loc,
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: loc === "costa brava" || loc === "barcelona" ? "high" : "medium",
      },
      {
        keyword: "boat rental " + loc,
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: loc === "costa brava" || loc === "barcelona" ? "high" : "medium",
      },
      {
        keyword: "alquilar barco " + loc,
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: loc === "costa brava" ? "high" : "medium",
      },
    ]);

    // Additional location combos
    const locationCombos = [
      {
        keyword: "alquiler barcos cerca de barcelona",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "high",
      },
      {
        keyword: "boat rental near barcelona",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "high",
      },
      {
        keyword: "boat hire costa brava spain",
        matchType: "phrase",
        intent: "high_commercial",
        estimatedVolume: "medium",
      },
    ];

    // Intent / informational keywords (top of funnel)
    const intentKeywords = [
      {
        keyword: "que hacer en blanes",
        matchType: "broad",
        intent: "informational",
        estimatedVolume: "high",
      },
      {
        keyword: "actividades costa brava",
        matchType: "broad",
        intent: "informational",
        estimatedVolume: "high",
      },
      {
        keyword: "excursion barco costa brava",
        matchType: "phrase",
        intent: "commercial",
        estimatedVolume: "medium",
      },
      {
        keyword: "cosas que hacer lloret de mar",
        matchType: "broad",
        intent: "informational",
        estimatedVolume: "medium",
      },
      {
        keyword: "things to do blanes spain",
        matchType: "broad",
        intent: "informational",
        estimatedVolume: "medium",
      },
      {
        keyword: "best activities costa brava",
        matchType: "broad",
        intent: "informational",
        estimatedVolume: "medium",
      },
      {
        keyword: "calas blanes barco",
        matchType: "phrase",
        intent: "commercial",
        estimatedVolume: "low",
      },
      {
        keyword: "rutas barco costa brava",
        matchType: "phrase",
        intent: "commercial",
        estimatedVolume: "low",
      },
    ];

    // Competitor / generic
    const competitorKeywords = [
      {
        keyword: "alquiler barcos costa brava",
        matchType: "phrase",
        intent: "commercial",
        estimatedVolume: "high",
      },
      {
        keyword: "boat rental spain",
        matchType: "broad",
        intent: "commercial",
        estimatedVolume: "high",
      },
      {
        keyword: "rent boat spain coast",
        matchType: "phrase",
        intent: "commercial",
        estimatedVolume: "medium",
      },
      {
        keyword: "charter barco cataluna",
        matchType: "phrase",
        intent: "commercial",
        estimatedVolume: "low",
      },
    ];

    // Negative keywords
    const negativeKeywords = [
      { keyword: "gratis", reason: "Free seekers - no conversion potential" },
      { keyword: "free", reason: "Free seekers - no conversion potential" },
      { keyword: "segunda mano", reason: "Looking to buy used boats" },
      { keyword: "comprar", reason: "Looking to buy, not rent" },
      { keyword: "vender", reason: "Looking to sell boats" },
      { keyword: "buy boat", reason: "Purchase intent, not rental" },
      { keyword: "sell boat", reason: "Selling boats, not relevant" },
      { keyword: "used boat", reason: "Second-hand market" },
      { keyword: "barco vela", reason: "Sailboats - we offer motor boats" },
      { keyword: "sailboat", reason: "Sailboats - not our product" },
      { keyword: "yate lujo", reason: "Luxury yachts - different market" },
      { keyword: "luxury yacht", reason: "Luxury yachts - different price range" },
      { keyword: "crucero", reason: "Cruise ships - different product" },
      { keyword: "cruise", reason: "Cruise ships - different product" },
      { keyword: "kayak", reason: "Different water activity" },
      { keyword: "paddle surf", reason: "Different water activity" },
      { keyword: "jet ski", reason: "Different water activity" },
      { keyword: "moto de agua", reason: "Different water activity" },
      { keyword: "pesca", reason: "Fishing charters - different service" },
      { keyword: "fishing charter", reason: "Fishing - different service" },
      { keyword: "catamaran", reason: "Different boat type" },
      { keyword: "titulo nautico", reason: "Looking for license course" },
      { keyword: "boating license course", reason: "Education, not rental" },
      { keyword: "empleo", reason: "Job seekers" },
      { keyword: "trabajo barco", reason: "Job seekers" },
    ];

    const result = {
      totalKeywords:
        brandKeywords.length +
        productKeywords.length +
        licenseKeywords.length +
        locationKeywords.length +
        locationCombos.length +
        intentKeywords.length +
        competitorKeywords.length,
      fleetInfo: {
        totalBoats: boats.length,
        noLicenseBoats: noLicenseBoats.length,
        licenseBoats: licenseBoats.length,
        maxCapacity,
      },
      keywordCategories: {
        brand: {
          description: "Brand-specific keywords for protecting brand searches",
          priority: "high",
          suggestedBid: "low (brand terms are cheap)",
          keywords: brandKeywords,
        },
        product: {
          description: "Specific boat model keywords",
          priority: "medium",
          suggestedBid: "medium",
          keywords: productKeywords,
        },
        licenseType: {
          description: "Keywords targeting license/no-license boat searches",
          priority: "high",
          suggestedBid: "high (high purchase intent)",
          keywords: licenseKeywords,
        },
        location: {
          description: "Location-based boat rental searches",
          priority: "high",
          suggestedBid: "high",
          keywords: [...locationKeywords, ...locationCombos],
        },
        intent: {
          description:
            "Informational and discovery keywords (top of funnel)",
          priority: "medium",
          suggestedBid: "low-medium (awareness stage)",
          keywords: intentKeywords,
        },
        competitor: {
          description: "Generic and competitor-related searches",
          priority: "medium",
          suggestedBid: "medium-high",
          keywords: competitorKeywords,
        },
      },
      negativeKeywords,
      matchTypeGuide: {
        exact:
          "Use for brand terms and high-converting specific queries. Highest relevance, lowest volume.",
        phrase:
          "Use for commercial-intent queries where word order matters. Good balance of reach and relevance.",
        broad:
          "Use for top-of-funnel discovery terms. Highest reach, monitor search terms report closely.",
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 7: get_landing_page_recommendations
// ---------------------------------------------------------------------------

server.tool(
  "get_landing_page_recommendations",
  "Map a list of keywords to the best existing landing pages on the website. Includes relevance scoring and suggestions for new pages if needed.",
  {
    keywords: z
      .array(z.string())
      .describe("List of keywords to map to landing pages"),
  },
  async ({ keywords }) => {
    const boats = await getActiveBoats();

    // Build the page catalog with their themes
    const pageCatalog: Array<{
      path: string;
      url: string;
      themes: string[];
      languages: string[];
      description: string;
    }> = [
      {
        path: "/",
        url: WEBSITE_BASE_URL + "/",
        themes: [
          "alquiler barcos",
          "boat rental",
          "costa brava",
          "blanes",
          "rent a boat",
          "general",
          "brand",
        ],
        languages: ["es", "en", "fr", "de", "nl", "it", "ru", "ca"],
        description: "Homepage with fleet overview, booking widget, and trust signals",
      },
      {
        path: "/barcos-sin-licencia",
        url: WEBSITE_BASE_URL + "/barcos-sin-licencia",
        themes: [
          "sin licencia",
          "no license",
          "sans permis",
          "ohne fuehrerschein",
          "zonder vaarbewijs",
          "senza patente",
          "barco facil",
          "principiantes",
        ],
        languages: ["es", "en", "fr", "de", "nl", "it", "ru", "ca"],
        description:
          "No-license boats listing page with pricing and features",
      },
      {
        path: "/barcos-con-licencia",
        url: WEBSITE_BASE_URL + "/barcos-con-licencia",
        themes: [
          "con licencia",
          "with license",
          "avec permis",
          "mit fuehrerschein",
          "charter",
          "potente",
          "grande",
        ],
        languages: ["es", "en", "fr", "de", "nl", "it", "ru", "ca"],
        description: "Licensed boats listing page with specifications",
      },
      {
        path: "/alquiler-barcos-blanes",
        url: WEBSITE_BASE_URL + "/alquiler-barcos-blanes",
        themes: [
          "blanes",
          "puerto blanes",
          "blanes port",
          "alquiler blanes",
          "rental blanes",
          "location blanes",
        ],
        languages: ["es", "en", "fr", "de"],
        description: "Location-specific landing page for Blanes boat rental",
      },
      {
        path: "/alquiler-barcos-cerca-barcelona",
        url: WEBSITE_BASE_URL + "/alquiler-barcos-cerca-barcelona",
        themes: [
          "barcelona",
          "cerca barcelona",
          "near barcelona",
          "pres de barcelone",
          "1 hora barcelona",
        ],
        languages: ["es", "en", "fr", "de"],
        description:
          "Landing page targeting Barcelona tourists looking for nearby boat rental",
      },
      {
        path: "/precios",
        url: WEBSITE_BASE_URL + "/precios",
        themes: [
          "precios",
          "prices",
          "tarifs",
          "preise",
          "cuanto cuesta",
          "how much",
          "tarifas",
          "coste",
        ],
        languages: ["es", "en", "fr", "de", "nl", "it", "ru", "ca"],
        description: "Pricing page with all boats, seasons, and duration options",
      },
      {
        path: "/faq",
        url: WEBSITE_BASE_URL + "/faq",
        themes: [
          "preguntas",
          "faq",
          "informacion",
          "como funciona",
          "how it works",
          "requisitos",
          "requirements",
          "que incluye",
          "que necesito",
        ],
        languages: ["es", "en", "fr", "de", "nl", "it", "ru", "ca"],
        description: "FAQ page with common questions about boat rental",
      },
      {
        path: "/rutas",
        url: WEBSITE_BASE_URL + "/rutas",
        themes: [
          "rutas",
          "routes",
          "calas",
          "coves",
          "excursion",
          "itinerario",
          "donde ir",
          "where to go",
          "lloret",
          "tossa",
        ],
        languages: ["es", "en", "fr", "de"],
        description: "Routes and cove guide from Blanes port",
      },
      {
        path: "/galeria",
        url: WEBSITE_BASE_URL + "/galeria",
        themes: ["fotos", "galeria", "gallery", "photos", "imagenes"],
        languages: ["es", "en"],
        description: "Photo gallery of boats, routes, and customer experiences",
      },
      {
        path: "/tarjeta-regalo",
        url: WEBSITE_BASE_URL + "/tarjeta-regalo",
        themes: [
          "regalo",
          "gift",
          "tarjeta regalo",
          "gift card",
          "voucher",
          "regalo original",
          "experiencia",
        ],
        languages: ["es", "en"],
        description: "Gift card purchase page",
      },
    ];

    // Add individual boat pages
    for (const boat of boats) {
      pageCatalog.push({
        path: "/barco/" + boat.id,
        url: WEBSITE_BASE_URL + "/barco/" + boat.id,
        themes: [
          boat.name.toLowerCase(),
          boat.requiresLicense ? "con licencia" : "sin licencia",
          boat.capacity + " personas",
          "alquiler " + boat.name.toLowerCase(),
        ],
        languages: ["es", "en", "fr", "de", "nl", "it", "ru", "ca"],
        description:
          boat.name +
          " detail page: " +
          boat.capacity +
          " people, " +
          (boat.requiresLicense ? "license required" : "no license"),
      });
    }

    // Match keywords to pages
    const recommendations = keywords.map((keyword) => {
      const kw = keyword.toLowerCase();
      let bestMatch = pageCatalog[0]; // default to homepage
      let bestScore = 0;

      for (const page of pageCatalog) {
        let score = 0;
        for (const theme of page.themes) {
          if (kw.includes(theme) || theme.includes(kw)) {
            score += 10;
          }
          // Partial word match
          const themeWords = theme.split(" ");
          const kwWords = kw.split(" ");
          for (const tw of themeWords) {
            for (const kww of kwWords) {
              if (
                tw.length >= 3 &&
                kww.length >= 3 &&
                (tw.includes(kww) || kww.includes(tw))
              ) {
                score += 3;
              }
            }
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = page;
        }
      }

      // Determine if we should suggest a new page
      let newPageSuggestion: string | null = null;
      if (bestScore < 5) {
        newPageSuggestion =
          "Consider creating a dedicated landing page for '" +
          keyword +
          "' to improve ad relevance and Quality Score.";
      }

      return {
        keyword,
        recommendedPage: {
          path: bestMatch.path,
          url: bestMatch.url,
          description: bestMatch.description,
        },
        relevanceScore: Math.min(100, bestScore * 5),
        reasoning:
          bestScore >= 10
            ? "Strong thematic match between keyword and page content"
            : bestScore >= 5
            ? "Partial match - page covers related topics"
            : "Weak match - homepage as fallback",
        newPageSuggestion,
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              totalKeywords: keywords.length,
              availablePages: pageCatalog.length,
              recommendations,
              generalNotes: [
                "All landing pages support multiple languages via URL parameter (?lang=xx)",
                "Ensure UTM parameters are appended for tracking",
                "Google Ads Quality Score improves with keyword-to-landing-page relevance",
                "Consider A/B testing different landing pages for top-spending keywords",
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ads Intelligence MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting Ads Intelligence MCP server:", error);
  process.exit(1);
});
