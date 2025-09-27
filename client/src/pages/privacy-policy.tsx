import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('privacyPolicy', language);
  const hreflangLinks = generateHreflangLinks('privacyPolicy');
  const canonical = generateCanonicalUrl('privacyPolicy', language);

  return (
    <div className="min-h-screen">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
      />
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-primary mr-4" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
              Política de Privacidad
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Política de Cookies */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Shield className="w-6 h-6 text-primary" />
                Política de Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Qué son las cookies?</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Las cookies son pequeños archivos de datos que se reciben en el terminal desde el sitio Web visitado y se usan para registrar ciertas interacciones de la navegación en un sitio Web almacenando datos que podrán ser actualizados y recuperados. Estos archivos se almacenan en el ordenador del usuario y contiene datos anónimos que no son perjudiciales para su equipo.</p>
                  <p>Se utilizan para recordar las preferencias del usuario, como el idioma seleccionado, datos de acceso o personalización de la página. También pueden ser utilizadas para registrar información anónima acerca de cómo un visitante utiliza un sitio.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Por qué Costa Brava Rent a Boat utiliza cookies?</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Costa Brava Rent a Boat - Blanes utiliza cookies estrictamente necesarias y esenciales para que usted utilice nuestro sitio Web y le permitan moverse libremente, utilizar áreas seguras, opciones personalizadas, etc.</p>
                  <p>Además, utilizamos cookies que recogen datos relativos al análisis de uso de la Web para ayudar a mejorar el servicio al cliente, midiendo el uso y el rendimiento de la página, para optimizarla y personalizarla.</p>
                  <p>Nuestro sitio también pueden tener enlaces de redes sociales (como Facebook o Twitter). Costa Brava Rent a Boat - Blanes no controla las cookies utilizadas por estas Web externas.</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Tipos de Cookies */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                Tipos de Cookies que Utilizamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Según su finalidad:</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cookies técnicas</h4>
                    <p className="text-sm text-gray-700">Son aquellas imprescindibles y estrictamente necesarias para el correcto funcionamiento de un portal Web y la utilización de las diferentes opciones y servicios que ofrece. Por ejemplo, las que sirven para el mantenimiento de la sesión, la gestión del tiempo de respuesta, rendimiento o validación de opciones.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cookies de personalización</h4>
                    <p className="text-sm text-gray-700">Permiten al usuario especificar o personalizar algunas características de las opciones generales de la página Web. Por ejemplo, definir el idioma, configuración regional o tipo de navegador.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cookies analíticas</h4>
                    <p className="text-sm text-gray-700">Son utilizadas para elaborar perfiles de navegación y poder conocer las preferencias de los usuarios con el fin de mejorar la oferta de productos y servicios. Por ejemplo, controlar las áreas geográficas de mayor interés o el producto de más aceptación.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cookies publicitarias</h4>
                    <p className="text-sm text-gray-700">Permiten la gestión de los espacios publicitarios en base a criterios concretos. Las cookies de publicidad permiten almacenar información del comportamiento a través de la observación de hábitos, estudiando los accesos y formando un perfil de preferencias del usuario.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Según plazo:</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cookies de sesión</h4>
                    <p className="text-sm text-gray-700">Son aquellas que duran el tiempo que el usuario está navegando por la página Web y se borran al término.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cookies persistentes</h4>
                    <p className="text-sm text-gray-700">Quedan almacenadas en el terminal del usuario por un tiempo más largo, facilitando así el control de las preferencias elegidas sin tener que repetir ciertos parámetros cada vez que se visite el sitio Web.</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Gestión de Cookies */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                Gestión y Control de Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Y si no quiero tener estas cookies?</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Para cumplir con la legislación vigente, tenemos que pedir su permiso para gestionar cookies. Si decide no autorizar el tratamiento, sólo usaríamos las cookies técnicas, puesto que son imprescindibles para la navegación por nuestra Web.</p>
                  <p>Tenga en cuenta que si rechaza o borra las cookies de navegación por la Web, no podremos mantener sus preferencias, algunas características de las páginas no estarán operativas, no podremos ofrecerle servicios personalizados y cada vez que vaya a navegar por nuestra Web tendremos que solicitarle de nuevo su autorización para el uso de cookies.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cómo deshabilitar las cookies en los navegadores:</h3>
                <div className="space-y-2">
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                    <li><strong>Microsoft Internet Explorer:</strong> Herramientas → Opciones de Internet → Privacidad → Configuración</li>
                    <li><strong>Firefox:</strong> Herramientas → Opciones → Privacidad → Cookies</li>
                    <li><strong>Chrome:</strong> Configuración → Mostrar opciones avanzadas → Privacidad → Configuración de contenido</li>
                    <li><strong>Safari:</strong> Preferencias → Seguridad</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">Para otros navegadores, consulte las instrucciones específicas del navegador en la sección de "Privacidad" o "Configuración".</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                Compromiso con la Transparencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700">
                <p>Si acepta nuestras cookies, nos permite la mejora de la Web de Costa Brava Rent a Boat - Blanes para ofrecerle un acceso óptimo y darle un servicio más eficaz y personalizado.</p>
                <p>Además, usted puede configurar su navegador para establecer que sólo los sitios Web de confianza o las páginas por las que está navegando en este momento puedan gestionar cookies, lo que le permite seleccionar sus preferencias.</p>
                <p>Proporcionando esta política, Costa Brava Rent a Boat - Blanes demuestra el compromiso adquirido con la legislación vigente sobre el uso de cookies, proporcionándole información para que usted pueda comprender qué tipo de cookies utilizamos y por qué lo hacemos.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}