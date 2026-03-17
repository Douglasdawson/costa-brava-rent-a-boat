import { Shield, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function AccessibilityDeclarationPage() {
  return (
    <main id="main-content" className="min-h-screen">
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
              Declaración de Accesibilidad
            </h1>
          </div>
          <p className="text-sm text-muted-foreground/60">
            Conforme al Real Decreto 1112/2018, de 7 de septiembre
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Compromiso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Compromiso con la accesibilidad</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
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
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Este sitio web es <strong>parcialmente conforme</strong> con las WCAG 2.1, nivel AA. Las
                no conformidades conocidas se detallan a continuación.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-green-800">Aspectos conformes:</p>
                <ul className="list-disc pl-5 space-y-1 text-green-700">
                  <li>Etiquetas <code>aria-label</code> en todos los elementos interactivos</li>
                  <li>Atributos <code>alt</code> en imágenes</li>
                  <li>Navegación completa por teclado en formularios y dropdowns personalizados</li>
                  <li>Tamaño mínimo de áreas táctiles (44×44 px)</li>
                  <li>Ratio de contraste de color WCAG AA en texto principal</li>
                  <li>Formularios con <code>aria-describedby</code>, <code>aria-invalid</code> y <code>aria-required</code></li>
                  <li>Estructura semántica con encabezados jerarquizados</li>
                  <li>Menú de navegación con <code>aria-expanded</code>, <code>aria-hidden</code> y <code>aria-current</code></li>
                  <li>Landmark regions (<code>nav</code>, <code>main</code>, <code>footer</code>) en todas las páginas</li>
                  <li>Diálogos modales con <code>role="dialog"</code>, <code>aria-modal</code> y gestión de foco</li>
                  <li>Dropdowns con roles ARIA (<code>combobox</code>, <code>listbox</code>, <code>option</code>) y navegación con flechas</li>
                  <li>Carruseles con <code>aria-live="polite"</code> y <code>aria-roledescription</code></li>
                  <li>Iconos decorativos marcados con <code>aria-hidden="true"</code></li>
                  <li>Tablas con <code>scope="col"</code> en encabezados</li>
                  <li>Galería con botones semánticos accesibles por teclado</li>
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
            <CardContent className="text-sm text-muted-foreground space-y-3">
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
              <p className="text-xs text-muted-foreground/60">
                Última auditoría realizada: marzo de 2026. Próxima revisión prevista: septiembre de 2026.
              </p>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contacto y reclamaciones</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
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
          <p className="text-xs text-muted-foreground/60 text-center">
            Esta declaración fue actualizada el 17 de marzo de 2026 mediante autoevaluación.
          </p>

        </div>
      </div>

      <Footer />
    </main>
  );
}
