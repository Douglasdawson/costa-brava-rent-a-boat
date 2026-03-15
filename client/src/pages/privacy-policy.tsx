import { Shield, User, Database, Clock, Lock, Mail, Globe, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { useTranslations } from "@/lib/translations";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('privacyPolicy', language);
  const hreflangLinks = generateHreflangLinks('privacyPolicy');
  const canonical = generateCanonicalUrl('privacyPolicy', language);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.privacyPolicy, url: "/privacy-policy" }
  ]);

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={breadcrumbSchema}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-20 sm:pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary mr-4" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
              Política de Privacidad
            </h1>
          </div>
          <p className="text-sm text-muted-foreground/60">Última actualización: febrero de 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* 1. Responsable del tratamiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="w-5 h-5 text-primary" aria-hidden="true" />
                1. Responsable del tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Identidad:</strong> Costa Brava Rent a Boat</p>
              <p><strong>NIF:</strong> B22566327</p>
              <p><strong>Domicilio:</strong> Puerto de Blanes, Girona, España</p>
              <p><strong>Teléfono:</strong> +34 611 500 372</p>
              <p><strong>Email de contacto:</strong>{" "}
                <a href="mailto:costabravarentaboat@gmail.com" className="text-primary underline">
                  costabravarentaboat@gmail.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* 2. Datos que recopilamos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Database className="w-5 h-5 text-primary" aria-hidden="true" />
                2. Datos personales que recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Datos facilitados por el usuario al realizar una reserva:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nombre y apellidos</li>
                  <li>Número de teléfono</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Fecha y hora de la reserva, embarcación seleccionada y número de personas</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Datos recopilados automáticamente:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Datos de navegación (dirección IP, tipo de navegador, páginas visitadas) mediante Google Analytics</li>
                  <li>Cookies técnicas y de preferencia (idioma seleccionado)</li>
                </ul>
              </div>
              <p>No recopilamos datos de categorías especiales (salud, origen racial, opiniones políticas, etc.) ni datos de menores de 14 años.</p>
            </CardContent>
          </Card>

          {/* 3. Finalidad y base jurídica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
                3. Finalidad del tratamiento y base jurídica
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2 border border-border font-semibold">Finalidad</th>
                      <th className="text-left p-2 border border-border font-semibold">Base jurídica (RGPD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-border">Gestión y confirmación de reservas de embarcaciones</td>
                      <td className="p-2 border border-border">Art. 6.1.b — ejecución de un contrato</td>
                    </tr>
                    <tr className="bg-muted">
                      <td className="p-2 border border-border">Envío de recordatorios y comunicaciones relativas a la reserva</td>
                      <td className="p-2 border border-border">Art. 6.1.b — ejecución de un contrato</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-border">Atención al cliente y resolución de incidencias</td>
                      <td className="p-2 border border-border">Art. 6.1.b — ejecución de un contrato / Art. 6.1.f — interés legítimo</td>
                    </tr>
                    <tr className="bg-muted">
                      <td className="p-2 border border-border">Análisis estadístico del tráfico web (Google Analytics)</td>
                      <td className="p-2 border border-border">Art. 6.1.a — consentimiento (banner de cookies)</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-border">Cumplimiento de obligaciones legales y fiscales</td>
                      <td className="p-2 border border-border">Art. 6.1.c — obligación legal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground/60">No tomamos decisiones automatizadas ni elaboramos perfiles con fines de segmentación publicitaria a partir de tus datos de reserva.</p>
            </CardContent>
          </Card>

          {/* 4. Plazos de conservación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
                4. Plazos de conservación
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Datos de reserva:</strong> Se conservan durante 5 años desde la fecha del servicio, en cumplimiento de las obligaciones fiscales (RD 1619/2012, Ley 58/2003 General Tributaria).</li>
                <li><strong>Comunicaciones por WhatsApp/email:</strong> 1 año desde la última comunicación, salvo reclamación en curso.</li>
                <li><strong>Datos de análisis web (Google Analytics):</strong> Según la configuración de retención de Google Analytics (por defecto, 14 meses).</li>
                <li><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 5. Destinatarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Globe className="w-5 h-5 text-primary" aria-hidden="true" />
                5. Destinatarios y transferencias internacionales
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>Tus datos pueden ser comunicados a los siguientes terceros encargados del tratamiento:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>SendGrid (Twilio Inc., EE. UU.):</strong> Servicio de envío de emails de confirmación y recordatorios de reserva. Transferencia internacional amparada en las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.</li>
                <li><strong>Google LLC (EE. UU.):</strong> Google Analytics (análisis de tráfico web) y Google Tag Manager. Solo si el usuario ha dado su consentimiento a través del banner de cookies. Transferencia amparada en el Marco de Privacidad de Datos UE-EE. UU.</li>
                <li><strong>Stripe Inc. (EE. UU.):</strong> Procesamiento de pagos con tarjeta, en su caso. No almacenamos datos de tarjeta; Stripe actúa como encargado independiente bajo PCI-DSS.</li>
                <li><strong>WhatsApp (Meta Platforms Ireland Ltd.):</strong> Canal de comunicación para gestión de reservas. Las comunicaciones iniciadas por el usuario en WhatsApp están sujetas a la política de privacidad de WhatsApp.</li>
              </ul>
              <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>
            </CardContent>
          </Card>

          {/* 6. Derechos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
                6. Tus derechos (ARCO+)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>En virtud de los artículos 15 a 22 del RGPD y la LOPD-GDD, tienes derecho a:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Acceso:</strong> Obtener confirmación sobre si tratamos tus datos y, en su caso, una copia.</li>
                <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos.</li>
                <li><strong>Supresión («derecho al olvido»):</strong> Pedir la eliminación de tus datos cuando ya no sean necesarios para los fines para los que fueron recogidos, salvo obligación legal de conservación.</li>
                <li><strong>Oposición:</strong> Oponerte al tratamiento basado en interés legítimo.</li>
                <li><strong>Limitación del tratamiento:</strong> Solicitar que suspendamos el tratamiento mientras se resuelve una reclamación.</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado y legible por máquina.</li>
                <li><strong>Retirada del consentimiento:</strong> Puedes retirar en cualquier momento el consentimiento prestado (p. ej., para cookies analíticas) sin que ello afecte a la licitud del tratamiento previo.</li>
              </ul>
              <div className="bg-blue-50 border-l-4 border-primary rounded p-3">
                <p><strong>Cómo ejercer tus derechos:</strong> Envía un email a{" "}
                  <a href="mailto:costabravarentaboat@gmail.com" className="text-primary underline">
                    costabravarentaboat@gmail.com
                  </a>{" "}
                  indicando el derecho que deseas ejercer y adjuntando copia de tu DNI u otro documento identificativo. Responderemos en el plazo máximo de 1 mes.
                </p>
              </div>
              <p>Si consideras que el tratamiento no es conforme al RGPD, tienes derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>:{" "}
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  www.aepd.es
                </a>
              </p>
            </CardContent>
          </Card>

          {/* 7. Medidas de seguridad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
                7. Medidas de seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos contra accesos no autorizados, pérdida o destrucción accidental, conforme al art. 32 RGPD:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Transmisión cifrada mediante HTTPS (TLS 1.2+)</li>
                <li>Acceso restringido a los datos mediante autenticación</li>
                <li>Cabeceras de seguridad HTTP (Content-Security-Policy, X-Frame-Options, etc.)</li>
                <li>Limitación de velocidad de peticiones (rate limiting) para prevenir ataques</li>
              </ul>
            </CardContent>
          </Card>

          {/* 8. Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
                8. Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Para información detallada sobre las cookies que utilizamos, consulta nuestra{" "}
                <a href="/cookies-policy" className="text-primary underline">
                  Política de Cookies
                </a>.
              </p>
            </CardContent>
          </Card>

          {/* 9. Cambios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">9. Cambios en esta política</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Podemos actualizar esta política de privacidad para reflejar cambios legales o en nuestros servicios. Te notificaremos los cambios relevantes mediante un aviso en la web. La fecha de última actualización siempre aparecerá al inicio de este documento.</p>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}
