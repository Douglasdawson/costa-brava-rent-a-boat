import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Anchor, 
  Clock, 
  MapPin, 
  Users, 
  Shield, 
  CreditCard, 
  Phone, 
  Waves, 
  Sun, 
  FileText,
  AlertCircle,
  CheckCircle,
  Euro,
  Calendar,
  Fuel,
  Camera,
  Umbrella,
  Ship
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useState } from "react";
import { useTranslations } from "@/lib/translations";

export default function FAQPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('faq', language);
  const hreflangLinks = generateHreflangLinks('faq');
  const canonical = generateCanonicalUrl('faq', language);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleWhatsAppContact = () => {
    const message = "Hola, tengo una pregunta sobre el alquiler de barcos. ¿Podrían ayudarme?";
    openWhatsApp(message);
  };

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // FAQ Schema for structured data — includes ALL questions displayed on the page
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": "Preguntas Frecuentes - Alquiler de Barcos en Blanes",
    "description": "Resuelve todas tus dudas sobre el alquiler de barcos en Blanes, Costa Brava",
    "mainEntity": [
      // Reservas y Precios
      {
        "@type": "Question",
        "name": "¿Cuáles son los precios del alquiler?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nuestros precios varían según la embarcación y duración. Barcos sin licencia desde 70€ con gasolina incluida (1h, 2h, 3h, 4h, 6h, 8h). Barcos con licencia desde 150€ sin gasolina incluida (2h, 4h, 8h)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo puedo hacer una reserva?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Hacer una reserva es muy fácil: 1) Selecciona tu barco favorito, 2) Elige fecha, hora y duración, 3) Completa tus datos y extras, 4) Realiza el pago seguro, 5) Recibe confirmación por WhatsApp y email."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué formas de pago aceptan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Aceptamos tarjeta de crédito/débito (Visa, Mastercard), transferencia bancaria, efectivo (solo en puerto, antes de salir) y Bizum (para clientes españoles). Se requiere una paga y señal de 50€ para confirmar la reserva."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la política de cancelación?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Política flexible: Más de 48h antes = 100% reembolso, 24-48h antes = 50% reembolso, menos de 24h = sin reembolso. Mal tiempo = reprogramación gratuita o 100% reembolso."
        }
      },
      // Licencias y Requisitos
      {
        "@type": "Question",
        "name": "¿Puedo alquilar sin tener licencia náutica?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "¡Sí! Tenemos barcos perfectos sin licencia. Son de hasta 15 CV, máximo 4-5 personas, fáciles de manejar con briefing completo. Solo necesitas ser mayor de 18 años."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué licencias aceptan para barcos grandes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Para barcos con licencia aceptamos: PER (Patrón de Embarcaciones de Recreo), PNB (Patrón de Navegación Básica), Capitán de Yate, licencias europeas equivalentes y licencias internacionales homologadas. Debes presentar la licencia original el día del alquiler."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la edad mínima para alquilar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El patrón debe tener mínimo 18 años. Los pasajeros no tienen límite de edad (con adulto responsable). Menores de 12 años deben llevar chaleco salvavidas obligatorio. El patrón debe presentar DNI o pasaporte válido."
        }
      },
      {
        "@type": "Question",
        "name": "¿Necesito experiencia previa navegando?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No es necesaria experiencia previa. Proporcionamos explicación completa del funcionamiento, mapa de la zona autorizada, consejos de seguridad, contacto directo para emergencias y embarcaciones fáciles de manejar."
        }
      },
      // Qué Incluye
      {
        "@type": "Question",
        "name": "¿Qué está incluido en el precio?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Incluido: embarcación equipada, combustible (en barcos sin licencia), chalecos salvavidas, kit de seguridad, ancla y cabo, escalera de baño, instrucciones y mapa, seguro básico y soporte telefónico."
        }
      },
      {
        "@type": "Question",
        "name": "¿Tengo que pagar combustible?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El combustible está incluido en las embarcaciones sin licencia. En las embarcaciones con licencia, se entregan con el depósito lleno y al finalizar el alquiler nuestro equipo te acompaña a la gasolinera para llenar de nuevo el depósito."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué extras puedo añadir?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Extras disponibles: Paddle Surf (+25€), Gafas de snorkel (+5€), Cámara acuática GoPro (+30€) y Patrón profesional (+100€)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué debo llevar yo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Imprescindible: DNI o pasaporte, licencia náutica (si aplica), protector solar, gorra/sombrero y toallas. Recomendado: comida y bebidas, gafas de sol, calzado antideslizante, ropa de cambio y cámara/móvil en bolsa estanca."
        }
      },
      // Navegación y Seguridad
      {
        "@type": "Question",
        "name": "¿Por dónde puedo navegar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zona autorizada: Norte hasta Playa de Fenals (sin licencia) o Sant Feliu de Guíxols (con licencia). Sur hasta final playa de Blanes (sin licencia) o sin límite (con licencia). Máximo 2 millas de la costa. Calas recomendadas: Cala Brava, Cala Sant Francesc, Playa de Lloret."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué medidas de seguridad tienen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Chalecos salvavidas homologados para todos, kit de seguridad reglamentario, GPS y plotter en barcos grandes, señalización marítima completa, contacto 24h para emergencias y revisiones diarias de embarcaciones."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué pasa si hace mal tiempo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Viento fuerte: no salimos con viento superior a fuerza 4. Lluvia intensa: reprogramamos sin coste. Tormenta: suspensión automática. Cambio durante navegación: regreso guiado al puerto. Siempre priorizamos la seguridad con reprogramación gratuita o reembolso del 100%."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué hago en caso de emergencia?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Procedimiento de emergencia: 1) Mantén la calma, 2) Llámanos inmediatamente al +34 611 500 372, 3) Encontraremos tu posición gracias a los GPS instalados en nuestros barcos. Números de emergencia incluidos en el briefing."
        }
      },
      // Información Práctica
      {
        "@type": "Question",
        "name": "¿Cuáles son los horarios disponibles?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Horarios de alquiler: Media mañana (09:00 - 13:00), Tarde (14:00 - 18:00), Día completo (09:00 - 17:00), Atardecer (18:00 - 21:00). Los horarios pueden variar según temporada y disponibilidad."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuándo debo llegar al puerto?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Recomendamos llegar 30 minutos antes de la hora de salida para check-in y verificación de documentos, briefing de seguridad completo, explicación del funcionamiento, entrega de material y mapa, y resolver dudas de última hora."
        }
      },
      {
        "@type": "Question",
        "name": "¿Hay parking disponible?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Opciones de aparcamiento: Parking Puerto 10€/alquiler (dentro del puerto y delante del barco), Zona azul 1,5€/hora (10 min andando), Parking gratuito (20/30 min andando). En temporada alta recomendamos reservar plaza."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo dejar equipaje en el puerto?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Opciones para equipaje: en la embarcación (espacio limitado pero seguro), consignas puerto (5€/día por maleta), hotel/apartamento (recomendamos dejar equipaje grande). Evita llevar objetos de valor."
        }
      },
      // Temporada y Disponibilidad
      {
        "@type": "Question",
        "name": "¿Cuándo está abierta la temporada?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Temporada alta: Junio - Septiembre. Temporada media: Abril-Mayo y Octubre. Cerrado: Noviembre - Marzo. La mejor época es mayo-junio y septiembre (menos masificado, buen tiempo)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo puedo consultar disponibilidad?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Puedes consultar disponibilidad a través de nuestra web (calendario en tiempo real), WhatsApp (respuesta inmediata), teléfono (llamada directa) o email (consultas detalladas)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Con qué antelación debo reservar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Recomendaciones: Temporada alta 1-2 semanas mínimo, fines de semana 3-5 días, entre semana posible reserva del día, grupos grandes máximo antelación posible. En julio-agosto reservar con al menos 2 semanas de antelación."
        }
      },
      // New questions — common customer concerns
      {
        "@type": "Question",
        "name": "¿Puedo llevar comida y bebida a bordo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "¡Por supuesto! Puedes traer tu propia comida, bebidas y snacks. Tenemos nevera a bordo. Solo pedimos que no se use cristal por seguridad."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es la fianza y cuándo se devuelve?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La fianza es un depósito de seguridad (200-500€ según el barco) que se paga en el puerto antes de salir y se devuelve íntegramente al regresar si el barco está en buen estado."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué equipamiento de seguridad incluye el barco?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Todos nuestros barcos incluyen chalecos salvavidas para todos los pasajeros, botiquín de primeros auxilios, extintor, ancla, y kit de señalización según normativa."
        }
      },
      {
        "@type": "Question",
        "name": "¿Hay descuentos para grupos o reservas anticipadas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, ofrecemos el código BIENVENIDO10 para un 10% de descuento en tu primera reserva. También tenemos tarifas especiales para reservas de día completo."
        }
      },
      {
        "@type": "Question",
        "name": "¿Hasta dónde puedo navegar desde Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Puedes explorar toda la costa entre Blanes y Tossa de Mar. Te recomendamos las calas de Sa Forcanera, Cala Bona y Cala Sant Francesc, accesibles solo por mar."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo llevar mascotas a bordo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, las mascotas son bienvenidas en nuestros barcos. Recomendamos traer agua fresca y una toalla para tu mascota. El animal debe llevar chaleco salvavidas si está disponible."
        }
      },
      {
        "@type": "Question",
        "name": "¿Se puede pescar desde el barco?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, puedes pescar desde nuestros barcos. Necesitarás tu propia licencia de pesca recreativa. No proporcionamos equipos de pesca, pero puedes traer los tuyos."
        }
      }
    ]
  };

  // Generate breadcrumb schema with localized names
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.faq, url: "/faq" }
  ]);

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      faqSchema,
      breadcrumbSchema
    ]
  };

  const categories = [
    { id: 'all', name: 'Todas', icon: FileText },
    { id: 'reservas', name: 'Reservas y Precios', icon: Euro },
    { id: 'licencias', name: 'Licencias y Requisitos', icon: Shield },
    { id: 'incluye', name: 'Qué Incluye', icon: CheckCircle },
    { id: 'navegacion', name: 'Navegación y Seguridad', icon: Waves },
    { id: 'practica', name: 'Información Práctica', icon: Clock },
    { id: 'temporada', name: 'Temporada', icon: Calendar }
  ];

  const shouldShowCategory = (categoryId: string) => {
    return selectedCategory === 'all' || selectedCategory === categoryId;
  };

  return (
    <main id="main-content" className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 pt-20 sm:pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Anchor className="w-8 h-8 text-primary mr-4" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
              Preguntas Frecuentes
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-8 max-w-4xl mx-auto">
            Encuentra respuestas a todas tus dudas sobre el alquiler de barcos en Blanes, Costa Brava.
            <br />
            Si no encuentras lo que buscas, ¡contáctanos directamente!
          </p>
        </div>
      </div>


      {/* FAQ Sections */}
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Category Filter */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Filtrar por categoría</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="gap-2"
                    data-testid={`filter-${category.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
          
          {/* Reservas y Precios */}
          {shouldShowCategory('reservas') && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Euro className="w-6 h-6 text-primary" />
                  Reservas y Precios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="precios" data-testid="faq-precios">
                    <AccordionTrigger>¿Cuáles son los precios del alquiler?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p>Nuestros precios varían según la embarcación y duración:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Barcos sin licencia:</strong> Desde 70€. Con gasolina incluida y posibilidad de alquilar 1h, 2h, 3h, 4h, 6h, o 8h</li>
                          <li><strong>Barcos con licencia:</strong> Desde 150€. Sin gasolina incluida y posibilidad de alquilar 2h, 4h y 8h.</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">*Precios orientativos. Consulta disponibilidad y precios exactos para tu fecha.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="reserva" data-testid="faq-reserva">
                    <AccordionTrigger>¿Cómo puedo hacer una reserva?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p>Hacer una reserva es muy fácil:</p>
                        <ol className="list-decimal pl-6 space-y-1">
                          <li>Selecciona tu barco favorito en nuestra flota</li>
                          <li>Elige fecha, hora y duración</li>
                          <li>Completa tus datos y extras deseados</li>
                          <li>Realiza el pago seguro con tarjeta</li>
                          <li>Recibe confirmación por WhatsApp y email</li>
                        </ol>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleBookingWhatsApp} className="gap-2" data-testid="button-book-inline">
                            <Phone className="w-4 h-4" />
                            Reservar por WhatsApp
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="pago" data-testid="faq-pago">
                    <AccordionTrigger>¿Qué formas de pago aceptan?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p>Aceptamos múltiples formas de pago:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Tarjeta de crédito/débito (Visa, Mastercard)</li>
                          <li>Transferencia bancaria</li>
                          <li>Efectivo (solo en puerto, antes de salir)</li>
                          <li>Bizum (para clientes españoles)</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">Se requiere una paga y señal de 50€ para confirmar la reserva.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cancelacion" data-testid="faq-cancelacion">
                    <AccordionTrigger>¿Cuál es la política de cancelación?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Política de cancelación flexible:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Más de 48h antes:</strong> Reembolso del 100%</li>
                          <li><strong>24-48h antes:</strong> Reembolso del 50%</li>
                          <li><strong>Menos de 24h:</strong> Sin reembolso</li>
                          <li><strong>Mal tiempo:</strong> Reprogramación gratuita o reembolso del 100%</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">En caso de condiciones meteorológicas adversas, siempre priorizamos la seguridad.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="descuentos" data-testid="faq-descuentos">
                    <AccordionTrigger>¿Hay descuentos para grupos o reservas anticipadas?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Descuentos disponibles:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Primera reserva:</strong> Usa el código BIENVENIDO10 para un 10% de descuento</li>
                          <li><strong>Día completo:</strong> Tarifas especiales para alquileres de jornada completa</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">Código: BIENVENIDO10 — 10% en tu primera reserva</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Licencias y Requisitos */}
          {shouldShowCategory('licencias') && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Shield className="w-6 h-6 text-primary" />
                  Licencias y Requisitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="sin-licencia" data-testid="faq-sin-licencia">
                    <AccordionTrigger>¿Puedo alquilar sin tener licencia náutica?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>¡Sí! Tenemos barcos perfectos para ti.</strong></p>
                        <p>Nuestros barcos sin licencia son:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Hasta 15 CV de potencia (normativa española)</li>
                          <li>Máximo 4-5 personas</li>
                          <li>Fáciles de manejar</li>
                          <li>Briefing completo antes de salir</li>
                          <li>Zona de navegación delimitada y segura</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">Solo necesitas ser mayor de 18 años</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="con-licencia" data-testid="faq-con-licencia">
                    <AccordionTrigger>¿Qué licencias aceptan para barcos grandes?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p>Para nuestros barcos con licencia aceptamos:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>PER</strong> - Patrón de Embarcaciones de Recreo</li>
                          <li><strong>PNB</strong> - Patrón de Navegación Básica</li>
                          <li><strong>Capitán de Yate</strong></li>
                          <li><strong>Licencias europeas equivalentes</strong></li>
                          <li><strong>Licencias internacionales homologadas</strong></li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-orange-50 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                          <span className="text-sm">Debes presentar la licencia original el día del alquiler</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="edad" data-testid="faq-edad">
                    <AccordionTrigger>¿Cuál es la edad mínima para alquilar?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Requisitos de edad:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Patrón:</strong> Mínimo 18 años</li>
                          <li><strong>Pasajeros:</strong> Sin límite (con adulto responsable)</li>
                          <li><strong>Menores de 12 años:</strong> Chaleco salvavidas obligatorio</li>
                          <li><strong>Grupos de menores:</strong> Siempre con adulto responsable</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">El patrón debe presentar DNI o pasaporte válido.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="experiencia" data-testid="faq-experiencia">
                    <AccordionTrigger>¿Necesito experiencia previa navegando?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>¡No es necesaria experiencia previa!</strong></p>
                        <p>Te proporcionamos:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Explicación completa del funcionamiento</li>
                          <li>Mapa de la zona autorizada</li>
                          <li>Consejos de seguridad</li>
                          <li>Contacto directo para emergencias</li>
                          <li>Embarcaciones fáciles de manejar</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm">Perfectas para primerizos y familias</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Qué Incluye */}
          {shouldShowCategory('incluye') && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  Qué Incluye el Alquiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="incluido" data-testid="faq-incluido">
                    <AccordionTrigger>¿Qué está incluido en el precio?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Incluido en todas las reservas:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Embarcación completamente equipada</li>
                          <li>Combustible incluido en las embarcaciones sin licencia</li>
                          <li>Chalecos salvavidas</li>
                          <li>Kit de seguridad obligatorio</li>
                          <li>Ancla y cabo</li>
                          <li>Escalera de baño</li>
                          <li>Instrucciones y mapa</li>
                          <li>Seguro básico de la embarcacion</li>
                          <li>Soporte telefónico</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="combustible" data-testid="faq-combustible">
                    <AccordionTrigger>¿Tengo que pagar combustible?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p>El combustible únicamente no está incluido en las embarcaciones que precisan de licencia.</p>
                        <p>En las embarcaciones que no precisan de licencia, el combustible está incluido.</p>
                        <p>Las embarcaciones que precisan de licencia, se entregarán con del depósito lleno, y nuestro equipo te acompañará a la gasolina al finalizar tu alquiler, para llenar de nuevo el depósito.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="extras" data-testid="faq-extras">
                    <AccordionTrigger>¿Qué extras puedo añadir?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Extras disponibles:</strong></p>
                        <div className="grid gap-3">
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Paddle Surf</span>
                            <Badge variant="outline">+25€</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Gafas de snorkel</span>
                            <Badge variant="outline">+5€</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Cámara acuática GoPro</span>
                            <Badge variant="outline">+30€</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Patrón profesional</span>
                            <Badge variant="outline">+100€</Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="llevar" data-testid="faq-llevar">
                    <AccordionTrigger>¿Qué debo llevar yo?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Recomendamos llevar:</strong></p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Imprescindible:</h4>
                            <ul className="list-disc pl-6 space-y-1 text-sm">
                              <li>DNI o pasaporte</li>
                              <li>Licencia náutica (si aplica)</li>
                              <li>Protector solar</li>
                              <li>Gorra/sombrero</li>
                              <li>Toallas</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Recomendado:</h4>
                            <ul className="list-disc pl-6 space-y-1 text-sm">
                              <li>Comida y bebidas</li>
                              <li>Gafas de sol</li>
                              <li>Calzado antideslizante</li>
                              <li>Ropa de cambio</li>
                              <li>Cámara/móvil en bolsa estanca</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="comida-bebida" data-testid="faq-comida-bebida">
                    <AccordionTrigger>¿Puedo llevar comida y bebida a bordo?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>¡Por supuesto!</strong> Puedes traer tu propia comida, bebidas y snacks.</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Nevera disponible a bordo para mantener las bebidas frescas</li>
                          <li>No se permite cristal por seguridad (usa envases de plástico o aluminio)</li>
                          <li>Recomendamos fruta, bocadillos y agua en abundancia</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Navegación y Seguridad */}
          {shouldShowCategory('navegacion') && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Waves className="w-6 h-6 text-primary" />
                  Navegación y Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="zona" data-testid="faq-zona">
                    <AccordionTrigger>¿Por dónde puedo navegar?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Zona de navegación autorizada:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Norte:</strong> Para las embarcaciones Sin licencia, hasta la Playa de Fenals  (Lloret de Mar). Y para las embarcaciones Con Licencia, recomendamos no sobrepasar Sant Feliu de Guixols</li>
                          <li><strong>Sur:</strong> Hasta el final de la playa de Blanes para las embarcaciones sin licencia. Y sin límite para las embarcaciones Con Licencia</li>
                          <li><strong>Distancia:</strong> Máximo 2 millas de la costa</li>
                          <li><strong>Calas recomendadas:</strong> Cala Brava, Cala Sant Francesc, Playa de Lloret</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span className="text-sm">Durante el Check-In te proporcionamos las mejores ubicaciones detalladas</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="seguridad" data-testid="faq-seguridad">
                    <AccordionTrigger>¿Qué medidas de seguridad tienen?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Tu seguridad es nuestra prioridad:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Chalecos salvavidas homologados para todos</li>
                          <li>Kit de seguridad reglamentario</li>
                          <li>GPS y plotter en barcos grandes</li>
                          <li>Señalización marítima completa</li>
                          <li>Contacto 24h para emergencias</li>
                          <li>Revisiones diarias de embarcaciones</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tiempo" data-testid="faq-tiempo">
                    <AccordionTrigger>¿Qué pasa si hace mal tiempo?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Política de seguridad meteorológica:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Viento fuerte:</strong> No salimos con viento superior a fuerza 4</li>
                          <li><strong>Lluvia intensa:</strong> Reprogramamos sin coste</li>
                          <li><strong>Tormenta:</strong> Suspensión automática</li>
                          <li><strong>Cambio durante navegación:</strong> Regreso guiado al puerto</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <Umbrella className="w-5 h-5 text-primary" />
                          <span className="text-sm">Siempre priorizamos la seguridad. Reprogramación gratuita o reembolso del 100%</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="emergencia" data-testid="faq-emergencia">
                    <AccordionTrigger>¿Qué hago en caso de emergencia?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Procedimiento de emergencia:</strong></p>
                        <ol className="list-decimal pl-6 space-y-1">
                          <li><strong>Mantén la calma</strong></li>
                          <li><strong>Llámanos inmediatamente:</strong> +34 611 500 372</li>
                          <li><strong>Encontraremos tu posición gracias a los GPS que tienen instalados nuestros barcos </strong></li>
                        </ol>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium">Números de emergencia incluidos en el briefing</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fianza" data-testid="faq-fianza">
                    <AccordionTrigger>¿Qué es la fianza y cuándo se devuelve?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Depósito de seguridad:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Importe:</strong> 200-500€ según la embarcación</li>
                          <li><strong>Pago:</strong> En el puerto antes de salir (efectivo o tarjeta)</li>
                          <li><strong>Devolución:</strong> Íntegra al regresar si el barco está en buen estado</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm">La fianza se devuelve en el acto, sin demoras</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="equipamiento-seguridad" data-testid="faq-equipamiento-seguridad">
                    <AccordionTrigger>¿Qué equipamiento de seguridad incluye el barco?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Todos nuestros barcos incluyen:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Chalecos salvavidas homologados para todos los pasajeros</li>
                          <li>Botiquín de primeros auxilios</li>
                          <li>Extintor</li>
                          <li>Ancla y cabo</li>
                          <li>Kit de señalización según normativa vigente</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="hasta-donde" data-testid="faq-hasta-donde">
                    <AccordionTrigger>¿Hasta dónde puedo navegar desde Blanes?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p>Puedes explorar toda la costa entre Blanes y Tossa de Mar.</p>
                        <p><strong>Calas recomendadas (accesibles solo por mar):</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Sa Forcanera:</strong> Cala virgen de aguas cristalinas</li>
                          <li><strong>Cala Bona:</strong> Perfecta para fondear y hacer snorkel</li>
                          <li><strong>Cala Sant Francesc:</strong> Una de las más bonitas de la Costa Brava</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span className="text-sm">Te damos un mapa con las mejores rutas durante el briefing</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Información Práctica */}
          {shouldShowCategory('practica') && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Clock className="w-6 h-6 text-primary" />
                  Información Práctica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="horarios" data-testid="faq-horarios">
                    <AccordionTrigger>¿Cuáles son los horarios disponibles?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Horarios de alquiler:</strong></p>
                        <div className="grid gap-3">
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Media mañana</span>
                            <Badge variant="outline">09:00 - 13:00</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Tarde</span>
                            <Badge variant="outline">14:00 - 18:00</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Día completo</span>
                            <Badge variant="outline">09:00 - 17:00</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                            <span>Atardecer</span>
                            <Badge variant="outline">18:00 - 21:00</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">*Horarios pueden variar según temporada y disponibilidad</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="llegada" data-testid="faq-llegada">
                    <AccordionTrigger>¿Cuándo debo llegar al puerto?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Recomendamos llegar 30 minutos antes</strong> de la hora de salida para:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Check-in y verificación de documentos</li>
                          <li>Briefing de seguridad completo</li>
                          <li>Explicación del funcionamiento</li>
                          <li>Entrega de material y mapa</li>
                          <li>Resolver dudas de última hora</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <Clock className="w-5 h-5 text-primary" />
                          <span className="text-sm">Te enviaremos la ubicación exacta y teléfono de contacto por WhatsApp</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="parking" data-testid="faq-parking">
                    <AccordionTrigger>¿Hay parking disponible?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Opciones de aparcamiento:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Parking Puerto:</strong> 10€/alquiler (dentro del puerto y delante del barco)</li>
                          <li><strong>Zona azul:</strong> 1,5€/hora (10 min andando)</li>
                          <li><strong>Parking gratuito:</strong> 20/30 min andando</li>
                          <li><strong>Temporada alta:</strong> Recomendamos reservar plaza</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">Te enviaremos la ubicación exacta con la confirmación de la reserva.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="equipaje" data-testid="faq-equipaje">
                    <AccordionTrigger>¿Puedo dejar equipaje en el puerto?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Opciones para equipaje:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>En la embarcación:</strong> Espacio limitado pero seguro</li>
                          <li><strong>Consignas puerto:</strong> 5€/día por maleta</li>
                          <li><strong>Hotel/apartamento:</strong> Recomendamos dejar equipaje grande</li>
                          <li><strong>Parking personal:</strong> Bajo tu responsabilidad</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-cta/10 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-cta" />
                          <span className="text-sm">Evita llevar objetos de valor. No nos responsabilizamos por pérdidas</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Temporada y Disponibilidad */}
          {shouldShowCategory('temporada') && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                  Temporada y Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="temporada" data-testid="faq-temporada">
                    <AccordionTrigger>¿Cuándo está abierta la temporada?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Temporada de navegación:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Temporada alta:</strong> Junio - Septiembre</li>
                          <li><strong>Temporada media:</strong> Abril-Mayo y Octubre</li>
                          <li><strong>Cerrado:</strong> Noviembre - Marzo</li>
                          <li><strong>Días especiales:</strong> Consultar disponibilidad</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
                          <Sun className="w-5 h-5 text-primary" />
                          <span className="text-sm">La mejor época es mayo-junio y septiembre (menos masificado, buen tiempo)</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="disponibilidad" data-testid="faq-disponibilidad">
                    <AccordionTrigger>¿Cómo puedo consultar disponibilidad?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Consultar disponibilidad:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Web: Calendario en tiempo real</li>
                          <li>WhatsApp: Respuesta inmediata</li>
                          <li>Teléfono: Llamada directa</li>
                          <li>Email: Consultas detalladas</li>
                        </ul>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleWhatsAppContact} variant="outline" className="gap-2" data-testid="button-check-availability">
                            <Phone className="w-4 h-4" />
                            Consultar Disponibilidad
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="antelacion" data-testid="faq-antelacion">
                    <AccordionTrigger>¿Con qué antelación debo reservar?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p><strong>Recomendaciones de reserva:</strong></p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>Temporada alta:</strong> 1-2 semanas mínimo</li>
                          <li><strong>Fines de semana:</strong> 3-5 días</li>
                          <li><strong>Entre semana:</strong> Posible reserva del día</li>
                          <li><strong>Grupos grandes:</strong> Máximo antelación posible</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-3 p-3 bg-orange-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-orange-600" />
                          <span className="text-sm">En julio-agosto reservar con al menos 2 semanas de antelación</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Contacto y Soporte */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Phone className="w-6 h-6 text-primary" />
                ¿Más Preguntas?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Si no has encontrado la respuesta que buscabas, estamos aquí para ayudarte. 
                Nuestro equipo responde rápidamente y estará encantado de resolver cualquier duda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleWhatsAppContact} 
                  className="gap-2 flex-1 bg-[#25D366] hover:bg-[#128C7E] active:bg-[#075E54] border-[#25D366]" 
                  data-testid="button-whatsapp-questions"
                >
                  <SiWhatsapp className="w-5 h-5" />
                  Preguntar por WhatsApp
                </Button>
                <Button onClick={handleBookingWhatsApp} variant="outline" className="gap-2 flex-1" data-testid="button-direct-booking">
                  <Anchor className="w-5 h-5" />
                  Reservar Directamente
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="py-8 sm:py-12 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Puerto de Blanes</h3>
                <p className="text-muted-foreground text-sm">Salida desde Puerto de Blanes, Costa Brava. Fácil acceso y parking disponible.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Temporada</h3>
                <p className="text-muted-foreground text-sm">Abril - Octubre. Reservas flexibles con duración de 1-8 horas.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Ship className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">7 Embarcaciones</h3>
                <p className="text-muted-foreground text-sm">Flota para desde 4-7 personas. Con y sin licencia náutica.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
