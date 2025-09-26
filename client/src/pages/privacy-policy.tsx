import { Shield } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <SEO 
        title="Política de Privacidad - Alquiler de Barcos en Blanes | Costa Brava Rent a Boat"
        description="Conoce nuestra política de privacidad y cookies en Costa Brava Rent a Boat Blanes. Información sobre el tratamiento de datos y navegación en nuestro sitio web."
        canonical="https://costa-brava-rent-a-boat-blanes.replit.app/privacy-policy"
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
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">POLÍTICA DE COOKIES</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">¿QUÉ SON LAS COOKIES?</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Las cookies son pequeños archivos de datos que se reciben en el terminal desde el sitio Web visitado y se usan para registrar ciertas interacciones de la navegación en un sitio Web almacenando datos que podrán ser actualizados y recuperados. Estos archivos se almacenan en el ordenador del usuario y contiene datos anónimos que no son perjudiciales para su equipo. Se utilizan para recordar las preferencias del usuario, como el idioma seleccionado, datos de acceso o personalización de la página.</li>
              <li>Las cookies también pueden ser utilizadas para registrar información anónima acerca de cómo un visitante utiliza un sitio. Por ejemplo, desde qué página Web ha accedido, o si ha utilizado un "banner" publicitario para llegar.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">¿POR QUÉ RENTA BOAT BLANES UTILIZA COOKIES?</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Costa Brava Rent a Boat - Blanes utiliza cookies estrictamente necesarias y esenciales para que usted utilice nuestro sitio Web y le permitan moverse libremente, utilizar áreas seguras, opciones personalizadas, etc. Además, Costa Brava Rent a Boat - Blanes utiliza cookies que recogen datos relativos al análisis de uso de la Web. Éstas se utilizan para ayudar a mejorar el servicio al cliente, midiendo el uso y el rendimiento de la página, para optimizarla y personalizarla.</li>
              <li>Nuestro sitio también pueden tener enlaces de redes sociales (como Facebook o Twitter). Costa Brava Rent a Boat - Blanes no controla las cookies utilizadas por estas Web externas. Para más información sobre las cookies de las redes sociales u otras Webs ajenas, aconsejamos revisar sus propias políticas de cookies.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">¿QUÉ USO LE DAMOS A LOS DIFERENTES TIPOS DE COOKIES?</h3>
            
            <h4 className="text-lg font-medium text-gray-900 mb-2">SEGÚN SU FINALIDAD:</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Cookies técnicas</strong> - Las cookies técnicas son aquellas imprescindibles y estrictamente necesarias para el correcto funcionamiento de un portal Web y la utilización de las diferentes opciones y servicios que ofrece.</li>
              <li>Por ejemplo, las que sirven para el mantenimiento de la sesión, la gestión del tiempo de respuesta, rendimiento o validación de opciones, utilizar elementos de seguridad, compartir contenido con redes sociales, etc.</li>
              <li><strong>Cookies de personalización</strong> - Estas cookies permiten al usuario especificar o personalizar algunas características de las opciones generales de la página Web, Por ejemplo, definir el idioma, configuración regional o tipo de navegador.</li>
              <li><strong>Cookies analíticas</strong> - Las cookies analíticas son las utilizadas por nuestros portales Web, para elaborar perfiles de navegación y poder conocer las preferencias de los usuarios del mismo con el fin de mejorar la oferta de productos y servicios.</li>
              <li>Por ejemplo, mediante una cookie analítica se controlarían las áreas geográficas de mayor interés de un usuario, cuál es el producto de más aceptación, etc.</li>
              <li><strong>Cookies publicitarias / de publicidad</strong> - Las cookies publicitarias permiten la gestión de los espacios publicitarios en base a criterios concretos. Por ejemplo la frecuencia de acceso, el contenido editado, etc.</li>
              <li>Las cookies de publicidad permiten a través de la gestión de la publicidad almacenar información del comportamiento a través de la observación de hábitos, estudiando los accesos y formando un perfil de preferencias del usuario, para ofrecerle publicidad relacionada con los intereses de su perfil.</li>
            </ul>

            <h4 className="text-lg font-medium text-gray-900 mb-2">SEGÚN PLAZO:</h4>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li><strong>Cookies de sesión</strong> - Las cookies de sesión son aquellas que duran el tiempo que el usuario está navegando por la página Web y se borran al término.</li>
              <li>Estas cookies quedan almacenadas en el terminal del usuario, por un tiempo más largo, facilitando así el control de las preferencias elegidas sin tener que repetir ciertos parámetros cada vez que se visite el sitio Web.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">¿Y SI NO QUIERO TENER ESTAS COOKIES O NO HAGO NADA AL RESPECTO?</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Para cumplir con la legislación vigente, tenemos que pedir su permiso para gestionar cookies. Si decide no autorizar el tratamiento indicándonos su no conformidad, sólo usaríamos las cookies técnicas, puesto que son imprescindibles para la navegación por nuestra Web. En este caso, no almacenaríamos ninguna cookie. En el caso de seguir navegando por nuestro sitio Web sin denegar su autorización implica que acepta su uso.</li>
              <li>Tenga en cuenta que si rechaza o borra las cookies de navegación por la Web, no podremos mantener sus preferencias, algunas características de las páginas no estarán operativas, no podremos ofrecerle servicios personalizados y cada vez que vaya a navegar por nuestra Web tendremos que solicitarle de nuevo su autorización para el uso de cookies.</li>
              <li>Si aún así, decide modificar la configuración de su acceso a la página Web, debe saber que es posible eliminar las cookies o impedir que se registre esta información en su equipo en cualquier momento mediante la modificación de los parámetros de configuración de su navegador:</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">CÓMO DESHABILITAR LAS COOKIES EN LOS NAVEGADORES MÁS USADOS:</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li><strong>Microsoft Internet Explorer</strong>, en la opción de menú Herramientas → Opciones de Internet → Privacidad → Configuración.</li>
              <li><strong>Firefox</strong>, en la opción de menú Herramientas → Opciones → Privacidad → Cookies.</li>
              <li><strong>Chrome</strong>: Configuración → Mostrar opciones avanzadas → Privacidad → Configuración de contenido.</li>
              <li><strong>Safari</strong>: Preferencias → Seguridad.</li>
              <li>Para modificar las opciones en otros navegadores, consulte las instrucciones del navegador.</li>
              <li>Estos navegadores están sometidos a actualizaciones o modificaciones, por lo que no podemos garantizar que se ajusten completamente a la versión de su navegador. También puede ser que utilice otro navegador no contemplado en estos enlaces como Konqueror, Arora, Flock, etc. Para evitar estos desajustes, puede acceder directamente desde las opciones de su navegador que se encuentra generalmente en el menú de Opciones, en la sección de "Privacidad". (Por favor, consulte la ayuda de su navegador para más información.)</li>
              <li>Si está de acuerdo con la política de cookies Costa Brava Rent a Boat - Blanes haga click en Aceptar.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">ENTONCES, ¿QUÉ SIGNIFICA LA INFORMACIÓN ANTERIOR?</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Si acepta nuestras cookies, nos permite la mejora de la Web de Costa Brava Rent a Boat - Blanes para ofrecerle un acceso óptimo y darle un servicio más eficaz y personalizado.</li>
              <li>Además, usted puede configurar su navegador para establecer que sólo los sitios Web de confianza o las páginas por las que está navegando en este momento puedan gestionar cookies lo que le permite seleccionar sus preferencias.</li>
              <li>Proporcionando esta política, Costa Brava Rent a Boat - Blanes demuestra el compromiso adquirido con la legislación vigente sobre el uso de cookies, proporcionándole información para que usted pueda comprender qué tipo de cookies utilizamos y por qué lo hacemos. Con esto, pretendemos proporcionarle transparencia en cuanto a los datos tratados acerca de la navegación realizada desde su equipo en nuestra Web.</li>
            </ul>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}