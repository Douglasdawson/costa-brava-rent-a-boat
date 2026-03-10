import { Shield, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function AccessibilityDeclarationPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title="Declaración de Accesibilidad | Costa Brava Rent a Boat"
        description="Declaración de accesibilidad de costabravarentaboat.com conforme al Real Decreto 1112/2018."
        canonical="https://costabravarentaboat.com/accesibilidad"
      />
      <Navigation />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-20 sm:pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary mr-4" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
              Declaración de Accesibilidad
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Conforme al Real Decreto 1112/2018, de 7 de septiembre
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Compromiso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Compromiso con la accesibilidad</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
              <p>
                <strong>Costa Brava Rent a Boat</strong> se compromete a hacer accesible su sitio web{" "}
                <strong>costabravarentaboat.com</strong> de conformidad con el Real Decreto 1112/2018, de 7 de
                septiembre, sobre accesibilidad de los sitios web y aplicaciones para dispositivos móviles del
                sector público, y teniendo en cuenta las Directrices de Accesibilidad para el Contenido Web
                (WCAG) 2.1, nivel AA.
              </p>
              <p>
                Aunque este sitio es de carácter privado y no está sujeto de forma estricta al RD 1112/2018
                (que aplica principalmente al sector público), nos comprometemos voluntariamente a alcanzar y
                mantener el nivel de conformidad WCAG 2.1 AA en beneficio de todos nuestros usuarios.
              </p>
            </CardContent>
          </Card>

          {/* Estado de conformidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                Estado de conformidad
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
              <p>
                Este sitio web es <strong>parcialmente conforme</strong> con las WCAG 2.1, nivel AA. Las
                no conformidades conocidas se detallan a continuación.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-green-800">Aspectos conformes:</p>
                <ul className="list-disc pl-5 space-y-1 text-green-700">
                  <li>Etiquetas <code>aria-label</code> en elementos interactivos</li>
                  <li>Atributos <code>alt</code> en imágenes</li>
                  <li>Navegación por teclado en formularios</li>
                  <li>Tamaño mínimo de áreas táctiles (44×44 px)</li>
                  <li>Ratio de contraste de color WCAG AA en texto principal</li>
                  <li>Formularios con etiquetas y mensajes de error accesibles</li>
                  <li>Estructura semántica con encabezados jerarquizados</li>
                  <li>Menú de navegación con <code>aria-expanded</code> y <code>aria-hidden</code></li>
                  <li>Landmark regions (nav, main, footer)</li>
                  <li>Breadcrumbs con navegación accesible</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* No conformidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertCircle className="w-5 h-5 text-orange-500" aria-hidden="true" />
                No conformidades conocidas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Contraste de placeholders:</strong> Algunos campos de formulario presentan texto
                  de marcador de posición con contraste inferior a 4.5:1 (limitación del navegador).
                </li>
                <li>
                  <strong>Cabecera CSP con scripts inline:</strong> La política de seguridad de contenidos
                  incluye <code>unsafe-inline</code> requerido por Google Tag Manager. Estamos evaluando
                  alternativas basadas en nonce.
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                Última auditoría realizada: febrero de 2026. Próxima revisión prevista: agosto de 2026.
              </p>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contacto y reclamaciones</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
              <p>
                Si detectas alguna barrera de accesibilidad en nuestro sitio web o necesitas acceder a
                contenido en un formato alternativo, puedes contactar con nosotros:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:costabravarentaboat@gmail.com" className="text-primary underline">
                    costabravarentaboat@gmail.com
                  </a>
                </li>
                <li>
                  <strong>Teléfono:</strong>{" "}
                  <a href="tel:+34611500372" className="text-primary underline">
                    +34 611 500 372
                  </a>
                </li>
              </ul>
              <p>
                Nos comprometemos a responder en un plazo máximo de <strong>5 días hábiles</strong>.
              </p>
              <div className="bg-blue-50 border-l-4 border-primary rounded p-3 mt-2">
                <p>
                  Si no recibes una respuesta satisfactoria, puedes presentar una reclamación a través
                  del{" "}
                  <a
                    href="https://administracion.gob.es"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline inline-flex items-center gap-1"
                  >
                    Portal de la Administración General del Estado
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fecha */}
          <p className="text-xs text-gray-500 text-center">
            Esta declaración fue preparada el 25 de febrero de 2026 mediante autoevaluación.
          </p>

        </div>
      </div>

      <Footer />
    </div>
  );
}
