import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import {
  Calendar,
  MessageSquare,
  Users,
  CreditCard,
  Globe,
  BarChart3,
  ChevronRight,
  Check,
  Anchor,
  ArrowRight,
} from "lucide-react";

// ===== Multi-language support (ES, EN, FR, IT) =====

type NauticFlowLang = "es" | "en" | "fr" | "it";

interface NauticFlowTranslations {
  meta: { title: string; description: string };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
  };
  features: {
    title: string;
    subtitle: string;
    items: Array<{ title: string; description: string }>;
  };
  howItWorks: {
    title: string;
    steps: Array<{ title: string; description: string }>;
  };
  pricing: {
    title: string;
    subtitle: string;
    monthly: string;
    plans: Array<{
      name: string;
      price: string;
      description: string;
      features: string[];
      cta: string;
      popular?: boolean;
    }>;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  footer: {
    product: string;
    company: string;
    links: Record<string, string>;
  };
}

const translations: Record<NauticFlowLang, NauticFlowTranslations> = {
  es: {
    meta: {
      title: "NauticFlow - Software de gestion para alquiler de barcos",
      description:
        "Gestiona tu negocio de alquiler de barcos con reservas online, chatbot IA por WhatsApp, pagos Stripe y CRM integrado. Prueba gratuita de 14 dias.",
    },
    hero: {
      title: "Software de gestion para alquiler de barcos",
      subtitle:
        "Reservas online, chatbot IA, pagos integrados y CRM en una sola plataforma. Todo lo que necesitas para gestionar tu flota.",
      cta: "Prueba gratuita",
      secondaryCta: "Ver demo",
    },
    features: {
      title: "Todo lo que necesitas para tu negocio nautico",
      subtitle:
        "Una plataforma completa para gestionar reservas, clientes y pagos sin complicaciones.",
      items: [
        {
          title: "Gestion de reservas y calendario",
          description:
            "Calendario visual con disponibilidad en tiempo real. Control de slots horarios, temporadas y precios dinamicos.",
        },
        {
          title: "Chatbot IA por WhatsApp",
          description:
            "Asistente inteligente que responde consultas, sugiere barcos y gestiona reservas 24/7 por WhatsApp Business.",
        },
        {
          title: "CRM y fidelizacion de clientes",
          description:
            "Perfiles de cliente completos, historial de reservas, segmentacion y campanas de fidelizacion automaticas.",
        },
        {
          title: "Pagos con Stripe integrados",
          description:
            "Cobros seguros con tarjeta, links de pago, reembolsos automaticos y conciliacion en tiempo real.",
        },
        {
          title: "Multi-idioma (8 idiomas)",
          description:
            "Tu web de reservas traducida a 8 idiomas para captar clientes internacionales sin esfuerzo.",
        },
        {
          title: "Dashboard de analiticas",
          description:
            "Metricas clave de tu negocio: ingresos, ocupacion, rendimiento por barco y tendencias estacionales.",
        },
      ],
    },
    howItWorks: {
      title: "Empieza en 3 pasos",
      steps: [
        {
          title: "Registra tu negocio",
          description:
            "Crea tu cuenta en minutos. Sin tarjeta de credito, 14 dias de prueba gratuita.",
        },
        {
          title: "Configura tu flota",
          description:
            "Anade tus barcos, precios por temporada, horarios y opciones extras.",
        },
        {
          title: "Empieza a recibir reservas",
          description:
            "Tu web de reservas lista para recibir clientes. Comparte el enlace o integra en tu web existente.",
        },
      ],
    },
    pricing: {
      title: "Planes para cada tipo de flota",
      subtitle: "Sin compromiso. Cancela cuando quieras.",
      monthly: "/mes",
      plans: [
        {
          name: "Starter",
          price: "49",
          description: "Para flotas pequenas",
          features: [
            "Hasta 5 barcos",
            "Reservas online",
            "Calendario visual",
            "Pagos con Stripe",
            "Soporte por email",
          ],
          cta: "Empezar gratis",
        },
        {
          name: "Professional",
          price: "99",
          description: "Para flotas en crecimiento",
          features: [
            "Hasta 15 barcos",
            "Todo de Starter",
            "Chatbot IA por WhatsApp",
            "CRM completo",
            "Multi-idioma",
            "Analiticas avanzadas",
            "Soporte prioritario",
          ],
          cta: "Empezar gratis",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "199",
          description: "Para grandes operadores",
          features: [
            "Flota ilimitada",
            "Todo de Professional",
            "API personalizada",
            "Dominio propio",
            "Soporte dedicado",
            "Onboarding personalizado",
            "SLA garantizado",
          ],
          cta: "Contactar ventas",
        },
      ],
    },
    cta: {
      title: "Empieza tu prueba gratuita de 14 dias",
      subtitle:
        "Sin tarjeta de credito. Sin compromiso. Configura tu flota en minutos.",
      button: "Crear cuenta gratis",
    },
    footer: {
      product: "Producto",
      company: "Empresa",
      links: {
        features: "Funcionalidades",
        pricing: "Precios",
        blog: "Blog",
        contact: "Contacto",
        privacy: "Privacidad",
        terms: "Terminos",
      },
    },
  },
  en: {
    meta: {
      title: "NauticFlow - Boat Rental Management Software",
      description:
        "Manage your boat rental business with online bookings, AI WhatsApp chatbot, Stripe payments and integrated CRM. 14-day free trial.",
    },
    hero: {
      title: "Boat rental management software",
      subtitle:
        "Online bookings, AI chatbot, integrated payments and CRM in one platform. Everything you need to manage your fleet.",
      cta: "Start free trial",
      secondaryCta: "View demo",
    },
    features: {
      title: "Everything you need for your nautical business",
      subtitle:
        "A complete platform to manage bookings, customers and payments without hassle.",
      items: [
        {
          title: "Booking & calendar management",
          description:
            "Visual calendar with real-time availability. Time slot control, seasons and dynamic pricing.",
        },
        {
          title: "AI WhatsApp chatbot",
          description:
            "Smart assistant that answers queries, suggests boats and manages bookings 24/7 via WhatsApp Business.",
        },
        {
          title: "CRM & customer loyalty",
          description:
            "Complete customer profiles, booking history, segmentation and automated loyalty campaigns.",
        },
        {
          title: "Stripe payments integrated",
          description:
            "Secure card payments, payment links, automatic refunds and real-time reconciliation.",
        },
        {
          title: "Multi-language (8 languages)",
          description:
            "Your booking website translated into 8 languages to attract international customers effortlessly.",
        },
        {
          title: "Analytics dashboard",
          description:
            "Key business metrics: revenue, occupancy, per-boat performance and seasonal trends.",
        },
      ],
    },
    howItWorks: {
      title: "Get started in 3 steps",
      steps: [
        {
          title: "Register your business",
          description:
            "Create your account in minutes. No credit card required, 14-day free trial.",
        },
        {
          title: "Set up your fleet",
          description:
            "Add your boats, seasonal pricing, schedules and extras.",
        },
        {
          title: "Start receiving bookings",
          description:
            "Your booking website ready for customers. Share the link or embed on your existing site.",
        },
      ],
    },
    pricing: {
      title: "Plans for every fleet size",
      subtitle: "No commitment. Cancel anytime.",
      monthly: "/month",
      plans: [
        {
          name: "Starter",
          price: "49",
          description: "For small fleets",
          features: [
            "Up to 5 boats",
            "Online bookings",
            "Visual calendar",
            "Stripe payments",
            "Email support",
          ],
          cta: "Start free",
        },
        {
          name: "Professional",
          price: "99",
          description: "For growing fleets",
          features: [
            "Up to 15 boats",
            "Everything in Starter",
            "AI WhatsApp chatbot",
            "Full CRM",
            "Multi-language",
            "Advanced analytics",
            "Priority support",
          ],
          cta: "Start free",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "199",
          description: "For large operators",
          features: [
            "Unlimited fleet",
            "Everything in Professional",
            "Custom API",
            "Custom domain",
            "Dedicated support",
            "Personalised onboarding",
            "Guaranteed SLA",
          ],
          cta: "Contact sales",
        },
      ],
    },
    cta: {
      title: "Start your 14-day free trial",
      subtitle:
        "No credit card. No commitment. Set up your fleet in minutes.",
      button: "Create free account",
    },
    footer: {
      product: "Product",
      company: "Company",
      links: {
        features: "Features",
        pricing: "Pricing",
        blog: "Blog",
        contact: "Contact",
        privacy: "Privacy",
        terms: "Terms",
      },
    },
  },
  fr: {
    meta: {
      title: "NauticFlow - Logiciel de gestion pour location de bateaux",
      description:
        "Gerez votre entreprise de location de bateaux avec reservations en ligne, chatbot IA WhatsApp, paiements Stripe et CRM integre. Essai gratuit de 14 jours.",
    },
    hero: {
      title: "Logiciel de gestion pour location de bateaux",
      subtitle:
        "Reservations en ligne, chatbot IA, paiements integres et CRM sur une seule plateforme. Tout ce dont vous avez besoin pour gerer votre flotte.",
      cta: "Essai gratuit",
      secondaryCta: "Voir la demo",
    },
    features: {
      title: "Tout ce dont vous avez besoin pour votre activite nautique",
      subtitle:
        "Une plateforme complete pour gerer reservations, clients et paiements sans complication.",
      items: [
        {
          title: "Gestion des reservations et calendrier",
          description:
            "Calendrier visuel avec disponibilite en temps reel. Controle des creneaux, saisons et tarification dynamique.",
        },
        {
          title: "Chatbot IA par WhatsApp",
          description:
            "Assistant intelligent qui repond aux questions, suggere des bateaux et gere les reservations 24/7 via WhatsApp Business.",
        },
        {
          title: "CRM et fidelisation clients",
          description:
            "Profils clients complets, historique de reservations, segmentation et campagnes de fidelisation automatiques.",
        },
        {
          title: "Paiements Stripe integres",
          description:
            "Paiements securises par carte, liens de paiement, remboursements automatiques et rapprochement en temps reel.",
        },
        {
          title: "Multi-langue (8 langues)",
          description:
            "Votre site de reservation traduit en 8 langues pour attirer les clients internationaux sans effort.",
        },
        {
          title: "Tableau de bord analytique",
          description:
            "Metriques cles de votre activite : revenus, occupation, performance par bateau et tendances saisonnieres.",
        },
      ],
    },
    howItWorks: {
      title: "Commencez en 3 etapes",
      steps: [
        {
          title: "Inscrivez votre entreprise",
          description:
            "Creez votre compte en quelques minutes. Sans carte bancaire, 14 jours d'essai gratuit.",
        },
        {
          title: "Configurez votre flotte",
          description:
            "Ajoutez vos bateaux, tarifs saisonniers, horaires et options supplementaires.",
        },
        {
          title: "Recevez des reservations",
          description:
            "Votre site de reservation pret a accueillir les clients. Partagez le lien ou integrez-le a votre site.",
        },
      ],
    },
    pricing: {
      title: "Des plans pour chaque taille de flotte",
      subtitle: "Sans engagement. Annulez a tout moment.",
      monthly: "/mois",
      plans: [
        {
          name: "Starter",
          price: "49",
          description: "Pour les petites flottes",
          features: [
            "Jusqu'a 5 bateaux",
            "Reservations en ligne",
            "Calendrier visuel",
            "Paiements Stripe",
            "Support par email",
          ],
          cta: "Commencer gratuitement",
        },
        {
          name: "Professional",
          price: "99",
          description: "Pour les flottes en croissance",
          features: [
            "Jusqu'a 15 bateaux",
            "Tout de Starter",
            "Chatbot IA WhatsApp",
            "CRM complet",
            "Multi-langue",
            "Analytiques avancees",
            "Support prioritaire",
          ],
          cta: "Commencer gratuitement",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "199",
          description: "Pour les grands operateurs",
          features: [
            "Flotte illimitee",
            "Tout de Professional",
            "API personnalisee",
            "Domaine propre",
            "Support dedie",
            "Onboarding personnalise",
            "SLA garanti",
          ],
          cta: "Contacter les ventes",
        },
      ],
    },
    cta: {
      title: "Commencez votre essai gratuit de 14 jours",
      subtitle:
        "Sans carte bancaire. Sans engagement. Configurez votre flotte en quelques minutes.",
      button: "Creer un compte gratuit",
    },
    footer: {
      product: "Produit",
      company: "Entreprise",
      links: {
        features: "Fonctionnalites",
        pricing: "Tarifs",
        blog: "Blog",
        contact: "Contact",
        privacy: "Confidentialite",
        terms: "Conditions",
      },
    },
  },
  it: {
    meta: {
      title: "NauticFlow - Software di gestione per noleggio barche",
      description:
        "Gestisci la tua attivita di noleggio barche con prenotazioni online, chatbot IA WhatsApp, pagamenti Stripe e CRM integrato. Prova gratuita di 14 giorni.",
    },
    hero: {
      title: "Software di gestione per noleggio barche",
      subtitle:
        "Prenotazioni online, chatbot IA, pagamenti integrati e CRM in un'unica piattaforma. Tutto cio di cui hai bisogno per gestire la tua flotta.",
      cta: "Prova gratuita",
      secondaryCta: "Vedi demo",
    },
    features: {
      title: "Tutto cio di cui hai bisogno per la tua attivita nautica",
      subtitle:
        "Una piattaforma completa per gestire prenotazioni, clienti e pagamenti senza complicazioni.",
      items: [
        {
          title: "Gestione prenotazioni e calendario",
          description:
            "Calendario visuale con disponibilita in tempo reale. Controllo fasce orarie, stagioni e prezzi dinamici.",
        },
        {
          title: "Chatbot IA via WhatsApp",
          description:
            "Assistente intelligente che risponde alle domande, suggerisce barche e gestisce prenotazioni 24/7 via WhatsApp Business.",
        },
        {
          title: "CRM e fidelizzazione clienti",
          description:
            "Profili clienti completi, storico prenotazioni, segmentazione e campagne di fidelizzazione automatiche.",
        },
        {
          title: "Pagamenti Stripe integrati",
          description:
            "Pagamenti sicuri con carta, link di pagamento, rimborsi automatici e riconciliazione in tempo reale.",
        },
        {
          title: "Multi-lingua (8 lingue)",
          description:
            "Il tuo sito di prenotazione tradotto in 8 lingue per attrarre clienti internazionali senza sforzo.",
        },
        {
          title: "Dashboard analitico",
          description:
            "Metriche chiave della tua attivita: ricavi, occupazione, performance per barca e tendenze stagionali.",
        },
      ],
    },
    howItWorks: {
      title: "Inizia in 3 passi",
      steps: [
        {
          title: "Registra la tua attivita",
          description:
            "Crea il tuo account in pochi minuti. Senza carta di credito, 14 giorni di prova gratuita.",
        },
        {
          title: "Configura la tua flotta",
          description:
            "Aggiungi le tue barche, prezzi stagionali, orari e opzioni extra.",
        },
        {
          title: "Inizia a ricevere prenotazioni",
          description:
            "Il tuo sito di prenotazione pronto per i clienti. Condividi il link o integralo nel tuo sito esistente.",
        },
      ],
    },
    pricing: {
      title: "Piani per ogni dimensione di flotta",
      subtitle: "Senza impegno. Annulla quando vuoi.",
      monthly: "/mese",
      plans: [
        {
          name: "Starter",
          price: "49",
          description: "Per flotte piccole",
          features: [
            "Fino a 5 barche",
            "Prenotazioni online",
            "Calendario visuale",
            "Pagamenti Stripe",
            "Supporto via email",
          ],
          cta: "Inizia gratis",
        },
        {
          name: "Professional",
          price: "99",
          description: "Per flotte in crescita",
          features: [
            "Fino a 15 barche",
            "Tutto di Starter",
            "Chatbot IA WhatsApp",
            "CRM completo",
            "Multi-lingua",
            "Analisi avanzate",
            "Supporto prioritario",
          ],
          cta: "Inizia gratis",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "199",
          description: "Per grandi operatori",
          features: [
            "Flotta illimitata",
            "Tutto di Professional",
            "API personalizzata",
            "Dominio proprio",
            "Supporto dedicato",
            "Onboarding personalizzato",
            "SLA garantito",
          ],
          cta: "Contatta vendite",
        },
      ],
    },
    cta: {
      title: "Inizia la tua prova gratuita di 14 giorni",
      subtitle:
        "Senza carta di credito. Senza impegno. Configura la tua flotta in pochi minuti.",
      button: "Crea account gratuito",
    },
    footer: {
      product: "Prodotto",
      company: "Azienda",
      links: {
        features: "Funzionalita",
        pricing: "Prezzi",
        blog: "Blog",
        contact: "Contatto",
        privacy: "Privacy",
        terms: "Termini",
      },
    },
  },
};

const FEATURE_ICONS = [Calendar, MessageSquare, Users, CreditCard, Globe, BarChart3];

function detectLanguage(): NauticFlowLang {
  const browserLang = navigator.language.substring(0, 2).toLowerCase();
  if (browserLang === "es" || browserLang === "en" || browserLang === "fr" || browserLang === "it") {
    return browserLang;
  }
  return "es";
}

export default function NauticFlowLanding() {
  const [lang, setLang] = useState<NauticFlowLang>(detectLanguage);
  const [, setLocation] = useLocation();
  const t = translations[lang];

  const handleRegister = () => {
    setLocation("/onboarding");
  };

  return (
    <>
      <SEO
        title={t.meta.title}
        description={t.meta.description}
        canonical="https://costabravarentaboat.app/nauticflow"
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Anchor className="h-6 w-6 text-[hsl(210,35%,76%)]" />
              <span className="font-heading text-xl font-bold tracking-tight">
                NauticFlow
              </span>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {t.footer.links.features}
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {t.footer.links.pricing}
              </a>
            </nav>

            <div className="flex items-center gap-3">
              {/* Language selector */}
              <div className="flex gap-1 rounded-md border border-border p-0.5">
                {(["es", "en", "fr", "it"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`rounded px-2 py-1 text-xs font-medium uppercase transition-colors ${
                      lang === l
                        ? "bg-[hsl(210,35%,76%)] text-[hsl(215,45%,20%)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label={`Switch language to ${l}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleRegister}
                className="bg-[hsl(210,35%,76%)] text-[hsl(215,45%,20%)] hover:bg-[hsl(210,35%,68%)] font-semibold"
              >
                {t.hero.cta}
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(210,35%,76%,0.08)] to-transparent" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge
                variant="secondary"
                className="mb-6 rounded-full px-4 py-1.5 text-sm font-medium"
              >
                14 days free trial
              </Badge>
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t.hero.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                {t.hero.subtitle}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  onClick={handleRegister}
                  className="bg-[hsl(210,35%,76%)] text-[hsl(215,45%,20%)] hover:bg-[hsl(210,35%,68%)] font-semibold px-8 py-6 text-base"
                >
                  {t.hero.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-base"
                >
                  {t.hero.secondaryCta}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {t.features.title}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t.features.subtitle}
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {t.features.items.map((feature, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <Card key={i} className="border-border/50 bg-card/50">
                    <CardHeader className="pb-3">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(210,35%,76%,0.15)]">
                        <Icon className="h-5 w-5 text-[hsl(210,35%,76%)]" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold">
                        {feature.title}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border/40 bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {t.howItWorks.title}
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {t.howItWorks.steps.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(210,35%,76%)] text-[hsl(215,45%,20%)] font-heading text-xl font-bold">
                    {i + 1}
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  {i < 2 && (
                    <ChevronRight className="absolute right-0 top-7 hidden h-5 w-5 text-muted-foreground/50 md:block -mr-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {t.pricing.title}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t.pricing.subtitle}
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {t.pricing.plans.map((plan, i) => (
                <Card
                  key={i}
                  className={`relative flex flex-col ${
                    plan.popular
                      ? "border-[hsl(210,35%,76%)] shadow-lg ring-1 ring-[hsl(210,35%,76%)]"
                      : "border-border/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[hsl(210,35%,76%)] text-[hsl(215,45%,20%)] font-semibold px-4">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-8">
                    <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-bold">
                        {plan.price}\u20AC
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t.pricing.monthly}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col pt-4">
                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(210,35%,76%)]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={handleRegister}
                      className={`mt-8 w-full font-semibold ${
                        plan.popular
                          ? "bg-[hsl(210,35%,76%)] text-[hsl(215,45%,20%)] hover:bg-[hsl(210,35%,68%)]"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/40 bg-[hsl(215,45%,20%)] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t.cta.title}
              </h2>
              <p className="mt-4 text-lg text-white/70">
                {t.cta.subtitle}
              </p>
              <Button
                size="lg"
                onClick={handleRegister}
                className="mt-10 bg-[hsl(210,35%,76%)] text-[hsl(215,45%,20%)] hover:bg-[hsl(210,35%,68%)] font-semibold px-10 py-6 text-base"
              >
                {t.cta.button}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-background py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-[hsl(210,35%,76%)]" />
                <span className="font-heading text-lg font-bold">NauticFlow</span>
              </div>
              <nav className="flex flex-wrap justify-center gap-6">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.links.features}
                </a>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.links.pricing}
                </a>
                <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.links.blog}
                </a>
                <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.links.privacy}
                </a>
                <a href="/terms-conditions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.links.terms}
                </a>
              </nav>
              <p className="text-xs text-muted-foreground">
                {new Date().getFullYear()} NauticFlow. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
