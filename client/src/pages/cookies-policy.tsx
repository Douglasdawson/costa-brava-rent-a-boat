import { useEffect } from "react";
import { useTranslations } from "@/lib/translations";
import { SEO } from "@/components/SEO";
import { getSEOConfig } from "@/utils/seo-config";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useLanguage } from "@/hooks/use-language";

export default function CookiesPolicy() {
  const t = useTranslations();
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('cookiesPolicy', language);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 max-w-4xl">
          <Breadcrumbs 
            items={[
              { label: 'breadcrumbs.home', href: '/' },
              { label: 'Política de Cookies' }
            ]}
          />
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
            Política de Cookies
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                En cumplimiento con lo dispuesto en el artículo 22.2 de la Ley 34/2002, de 11 de julio, 
                de Servicios de la Sociedad de la Información y de Comercio Electrónico, esta página web 
                le informa, en esta sección, sobre la política de recogida y tratamiento de cookies.
              </p>

              <h2 className="text-2xl font-heading font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                ¿Qué son las cookies?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. 
                Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre 
                los hábitos de navegación de un usuario o de su equipo y, dependiendo de la información que contengan 
                y de la forma en que utilice su equipo, pueden utilizarse para reconocer al usuario.
              </p>

              <h2 className="text-2xl font-heading font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                ¿Qué tipos de cookies utiliza esta página web?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Esta página web utiliza los siguientes tipos de cookies:
              </p>

              <div className="space-y-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cookies de análisis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Son aquellas que bien tratadas por nosotros o por terceros, nos permiten cuantificar el número 
                    de usuarios y así realizar la medición y análisis estadístico de la utilización que hacen los 
                    usuarios del servicio ofertado. Para ello se analiza su navegación en nuestra página web con el 
                    fin de mejorar la oferta de productos o servicios que le ofrecemos.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cookies técnicas
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Son aquellas que permiten al usuario la navegación a través del área restringida y la utilización 
                    de sus diferentes funciones, como por ejemplo, llevar a cabo el proceso de reserva de una embarcación.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cookies de personalización
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Son aquellas que permiten al usuario acceder al servicio con algunas características de carácter 
                    general predefinidas en función de una serie de criterios en el terminal del usuario como por 
                    ejemplo serían el idioma o el tipo de navegador a través del cual se conecta al servicio.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cookies publicitarias
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Son aquéllas que, bien tratadas por esta web o por terceros, permiten gestionar de la forma más 
                    eficaz posible la oferta de los espacios publicitarios que hay en la página web, adecuando el 
                    contenido del anuncio al contenido del servicio solicitado o al uso que realice de nuestra página 
                    web. Para ello podemos analizar sus hábitos de navegación en Internet y podemos mostrarle publicidad 
                    relacionada con su perfil de navegación.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cookies de terceros
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Esta página web utiliza servicios de terceros para recopilar información con fines estadísticos 
                    y de uso de la web. En concreto, usamos los servicios de Google Analytics para nuestras estadísticas. 
                    Algunas cookies son esenciales para el funcionamiento del sitio.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Nuestro sitio incluye otras funcionalidades proporcionadas por terceros. Usted puede fácilmente 
                    compartir el contenido en redes sociales como Facebook, Instagram o TikTok, con los botones que 
                    hemos incluido a tal efecto.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-heading font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Desactivar las cookies
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Puede usted permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración 
                de las opciones del navegador instalado en su ordenador. En la mayoría de los navegadores web se ofrece 
                la posibilidad de permitir, bloquear o eliminar las cookies instaladas en su equipo.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A continuación puede acceder a la configuración de los navegadores webs más frecuentes para aceptar, 
                instalar o desactivar las cookies:
              </p>

              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li>
                  <a 
                    href="http://support.google.com/chrome/answer/95647?hl=es" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="link-cookies-chrome"
                  >
                    Configurar cookies en Google Chrome
                  </a>
                </li>
                <li>
                  <a 
                    href="http://windows.microsoft.com/es-xl/internet-explorer/delete-manage-cookies" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="link-cookies-ie"
                  >
                    Configurar cookies en Microsoft Internet Explorer
                  </a>
                </li>
                <li>
                  <a 
                    href="https://support.mozilla.org/es/kb/Deshabilitar%20cookies%20de%20terceros" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="link-cookies-firefox"
                  >
                    Configurar cookies en Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a 
                    href="http://support.apple.com/kb/ph5042" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="link-cookies-safari"
                  >
                    Configurar cookies en Safari (Apple)
                  </a>
                </li>
                <li>
                  <a 
                    href="http://help.opera.com/Windows/11.50/es-ES/cookies.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="link-cookies-opera"
                  >
                    Configurar cookies en Opera
                  </a>
                </li>
              </ul>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Advertencia sobre eliminar cookies
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Usted puede eliminar y bloquear todas las cookies de este sitio, pero parte del sitio no funcionará 
                  o la calidad de la página web puede verse afectada.
                </p>
              </div>

              <p className="text-gray-600 dark:text-gray-300">
                Si tiene cualquier duda acerca de nuestra política de cookies, puede contactar con nosotros a través 
                de nuestros canales de contacto disponibles en{" "}
                <a 
                  href="/#contact" 
                  className="text-primary hover:underline"
                  data-testid="link-contact-section"
                >
                  la sección de contacto
                </a>.
              </p>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Última actualización: Octubre 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
