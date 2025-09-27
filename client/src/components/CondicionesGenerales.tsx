import Navigation from "./Navigation";
import Footer from "./Footer";
import { SEO } from "./SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";

export default function CondicionesGenerales() {
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('condicionesGenerales', language);
  const hreflangLinks = generateHreflangLinks('condicionesGenerales');
  const canonical = generateCanonicalUrl('condicionesGenerales', language);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Condiciones Generales del Alquiler
          </h1>

          {/* Embarcaciones CON Titulación */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                Condiciones Generales del Alquiler para Embarcaciones CON TITULACIÓN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                Las embarcaciones con titulación sólo podrán ser arrendadas por la persona designada en el contrato y que debe poseer la correspondiente titulación en vigor.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">PROHIBICIONES:</h3>
                <p className="text-gray-700">
                  Queda prohibido sobrepasar la distancia de una milla desde la costa, sobrepasar el número de plazas máximo permitido según el modelo de la embarcación alquilada, varar la embarcación en la playa o acceder a ella. Entrar, permanecer o salir del agua con el motor en funcionamiento y dejar la embarcación amarrada o anclada sin ninguna persona a bordo.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">RESPONSABILIDADES:</h3>
                <div className="space-y-3 text-gray-700">
                  <p>• La velocidad máxima en puertos y en canales específicos señalizados en playas es de 3 nudos. Debe respetarse la zona de bañistas y fondear siempre fuera de las boyas amarillas de las playas. La distancia mínima a la que se debe navegar de playas y acantilados es de 200 m. Debe guardarse una distancia de 100 m de las embarcaciones y boyas con bandera de submarinistas.</p>
                  <p>• Durante la navegación se recomienda el uso de los chalecos salvavidas e ir sentados en los respectivos asientos de la embarcación.</p>
                  <p>• El arrendatario asume toda responsabilidad por multa, sanción, perjuicio o daño causado o derivado de la infracción de alguna cláusula de este contrato y/o por cualquiera de las infracciones de las leyes españolas e internacionales vigentes.</p>
                  <p>• El uso indebido de la embarcación dará derecho a cualquier persona autorizada por la empresa a finalizar la salida, sin derecho a la devolución del importe del alquiler al arrendatario.</p>
                  <p>• Es muy importante que el patrón y/o tripulantes lleven siempre un teléfono disponible para poder contactar con nosotros o para que el equipo de Costa Brava Rent a Boat tenga la posibilidad llamarles para informarles de cualquier imprevisto que surja.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">ENTREGA Y RECOGIDA:</h3>
                <p className="text-gray-700">
                  La embarcación será entregada y devuelta en el puerto base (Puerto de Blanes). Se devolverá con todo su equipamiento en las mismas condiciones en las que se entregó y en la fecha y hora estipuladas en el contrato. Si el check-out se realiza más tarde de la hora estipulada sin aviso se cobrará un importe de 150€ por cada 30 minutos de retraso o su parte proporcional. En caso de devolver la embarcación antes de la hora prevista de entrega no se hará ningún tipo de abono.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">CARBURANTE:</h3>
                <p className="text-gray-700">
                  La gasolina no está incluida en el precio. La embarcación se entregará con el depósito lleno y se devolverá en el mismo estado.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">SEGURO:</h3>
                <div className="space-y-3 text-gray-700">
                  <p>Las tarifas incluyen un seguro de Responsabilidad Civil Obligatoria. También disponen de seguro para daños físicos para la tripulación. El cliente deberá depositar una fianza de 500,00€ o 1.000,00€ dependiendo de la embarcación alquilada para responder a cualquier desperfecto, pérdida de material o retraso en la devolución de la embarcación. No obstante si la cantidad resultante de los incidentes anteriormente citados fuera superior a la fianza, el cliente queda obligado a pagar la diferencia.</p>
                  <p>Quedan excluidas de la cobertura del seguro las actividades realizadas por la embarcación asegurada que conlleven el arrastre de artefactos como bananas, ruedas neumáticas, esquís, etc. El arrendatario de la embarcación se responsabilizará de la utilización de los mismos y de las consecuencias que de ello pudieran derivarse.</p>
                  <p>La empresa no asume responsabilidad alguna por pérdidas o daños en cualquiera de los bienes que el arrendatario u otra persona olvide, deposite o transporte en la embarcación durante o después de finalizado el alquiler. El arrendatario asume el riesgo de tales pérdidas y exime a la empresa de toda reclamación de los mismos y se compromete a mantenerla libre e indemne de cualquier reclamación que se produzca por esta causa, así como por retrasos por consecuencia de avería de la embarcación e incluso el posible cambio del estado del mar producido por causas meteorológicas imprevistas una vez que la embarcación se ha hecho a la mar.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">ZONA DE NAVEGACIÓN:</h3>
                <p className="text-gray-700">
                  Costa Brava Rent a Boat recomienda por seguridad no sobrepasar el puerto de Sant Feliu, ya que en caso de mal tiempo o cambio repentino de climatología puede ocasionar problemas hallarse tan lejos del puerto base. Si bajo su responsabilidad deciden rebasar ese punto deben saber que si navegando en zonas no autorizadas se requiere de asistencia la empresa no se hará responsable y el seguro no cubrirá ningún tipo de pérdidas y/o daños personales. En caso de necesidad de remolque de la embarcación por avería o falta de combustible se cobrará 1.000,00€ en concepto de maniobra de rescate.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">AVERÍAS:</h3>
                <p className="text-gray-700">
                  En caso de avería, colisión o pérdida de material, el arrendatario deberá avisar imperativamente e inmediatamente a Costa Brava Rent a Boat, que le informará sobre las instrucciones a seguir. Si durante el alquiler se produjera una avería no imputable al arrendatario y que no permitiera seguir con el alquiler, Costa Brava Rent a Boat reembolsará al contratante las horas no navegadas o entregará una embarcación de características similares a la contratada. Dicha elección quedará exclusivamente al buen criterio de Costa Brava Rent a Boat sin otra responsabilidad. En caso de que la avería o accidente fuera imputable al contratante, éste deberá abonar los gastos de remolque y de las reparaciones oportunas para quedar la embarcación, motor o accesorios en el estado en que se le entregó por la empresa al inicio del contrato de alquiler, siendo sólo Costa Brava Rent a Boat la autorizada a efectuar dichas reparaciones.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">LEGISLACIÓN:</h3>
                <p className="text-gray-700">
                  Para cuanta controversia pudiera surgir del contenido o interpretación del presente documento, ambas partes, con expresa renuncia al fuero propio o aquel al que pudiera acceder, se compromete de mutuo acuerdo a los jueces y tribunales de Blanes y superiores jerarquías correspondientes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Embarcaciones SIN Titulación */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                Condiciones Generales del Alquiler para Embarcaciones SIN TITULACIÓN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                La embarcación sólo podrá ser arrendada por la persona designada en el contrato, que debe ser mayor de 18 años.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">PROHIBICIONES:</h3>
                <p className="text-gray-700">
                  Queda prohibido sobrepasar la distancia de una milla desde la costa (1.8 km), sobrepasar el número de plazas máximo permitido según el modelo de la embarcación alquilada, varar la embarcación en la playa o acceder a ella, entrar permanecer o salir del agua con el motor en funcionamiento y dejar la embarcación amarrada o anclada sin ninguna persona a bordo.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">RESPONSABILIDADES:</h3>
                <div className="space-y-3 text-gray-700">
                  <p>• La velocidad máxima en puertos y en canales específicos señalizados en playas es de 3 nudos. Debe respetarse la zona de bañistas y fondear siempre fuera de las boyas amarillas de las playas. La distancia mínima a la que se debe navegar de playas y acantilados es de 200m. Debe guardarse una distancia de 100m de las embarcaciones y boyas con bandera de submarinistas.</p>
                  <p>• Queda prohibido realizar giros bruscos y continuos (donuts) con la embarcación. En caso de incumplimiento podrá ser motivo de la finalización del alquiler sin derecho a ninguna devolución del importe.</p>
                  <p>• Durante la navegación se recomienda el uso de los chalecos salvavidas e ir sentados en los respectivos asientos de la embarcación.</p>
                  <p>• El arrendatario asume toda responsabilidad por multa, sanción, perjuicio o daño causado o derivado de la infracción de alguna cláusula de este contrato y/o por cualquiera de las infracciones de las leyes españolas e internacionales vigentes. El uso indebido de la embarcación dará derecho a cualquier persona autorizada por la empresa a finalizar la salida sin derecho a la devolución del importe del alquiler al arrendatario.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">ENTREGA Y RECOGIDA:</h3>
                <div className="space-y-3 text-gray-700">
                  <p>La embarcación será entregada y devuelta en el puerto base, Puerto de Blanes. Se devolverá con todo su equipamiento en las mismas condiciones en las que se entregó y en la fecha y hora estipuladas en el contrato. Si el check-out se realiza más tarde de la hora estipulada sin aviso, se cobrará un importe de 150€ por cada 30 minutos de retraso o su parte proporcional. En caso de devolver la embarcación antes de la hora prevista de entrega no se hará ningún tipo de abono.</p>
                  <p>Es muy importante que el patrón y/o tripulantes lleven siempre un teléfono disponible para poder contactar con nosotros o para que el equipo de Costa Brava Rent a Boat tenga la posibilidad llamarles para informarles de cualquier imprevisto que surja.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">CARBURANTE:</h3>
                <p className="text-gray-700">
                  La gasolina está incluida en el precio. Las embarcaciones disponen de un depósito de 25 litros incluido en el precio del alquiler.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">SEGURO:</h3>
                <div className="space-y-3 text-gray-700">
                  <p>Las tarifas incluyen un seguro de Responsabilidad Civil Obligatoria. También disponen de seguro para daños físicos para la tripulación. El cliente deberá depositar una fianza de 200€ para responder a cualquier desperfecto, pérdida de material o retraso en la devolución de la embarcación. No obstante si la cantidad resultante de los incidentes anteriormente citados fuera superior a la fianza, el cliente queda obligado a pagar la diferencia.</p>
                  <p>La empresa no asume responsabilidad alguna por daños o pérdidas en cualquiera de los bienes que el arrendatario u otra persona olvide, deposite o transporte en la embarcación, durante o después de finalizado el alquiler. El arrendatario asume el riesgo de tales pérdidas y exime a la empresa de toda reclamación de los mismos y se compromete a mantenerla libre e indemne de cualquier reclamación que se produzca por esta causa, por demora o retraso como consecuencia de avería de la embarcación e incluso el posible cambio del estado del mar producido por causas meteorológicas imprevistas una vez que la embarcación se ha hecho a la mar.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">CANCELACIONES Y CAMBIOS:</h3>
                <div className="space-y-3 text-gray-700">
                  <p>La cancelación de la reserva por parte del cliente ocasionará gastos de tramitación, gestión y bloqueo de la embarcación, por lo que todas las cancelaciones conllevarán la no devolución del importe pagado al formalizar la reserva.</p>
                  <p>• Costa Brava Rent a Boat Blanes acepta el cambio de una reserva por parte del cliente únicamente con una comunicación previa por escrito a <a href="mailto:costabravarentboat@gmail.com" className="text-primary underline">costabravarentboat@gmail.com</a> o por WhatsApp al +34 611 500 372, con un mínimo de 7 días de antelación al día del alquiler.</p>
                  <p>• Cuando el alquiler no pueda disfrutarse por motivos climatológicos justificados y verificados por Costa Brava Rent a Boat Blanes, se ofrecerá al cliente un cambio de fecha para disfrutar del alquiler otro día, sujeto a la disponibilidad de la embarcación.</p>
                  <p>• No se realizarán cambios por condiciones meteorológicas hasta el mismo día del alquiler. Nuestro personal informará de las condiciones meteorológicas en la fecha de la reserva. Si el cliente decide no salir a navegar aun siendo positivo el veredicto de nuestro personal, Costa Brava Rent a Boat Blanes no efectuará la devolución del importe pagado al formalizar la reserva.</p>
                  <p>• Si el cliente no puede salir a navegar por un problema personal, Costa Brava Rent a Boat Blanes no se hará responsable, por lo tanto no se devolverá el importe de la reserva ni se cambiará el día del alquiler.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">ZONA DE NAVEGACIÓN:</h3>
                <div className="space-y-3 text-gray-700">
                  <p>Las embarcaciones tienen una zona restringida de navegación. Esta zona abarca desde el rio Tordera al sur hasta el final de la playa de Fenals al norte. Estos límites se indican al cliente en su teléfono móvil.</p>
                  <p>Costa Brava Rent a Boat - Blanes le recuerda los siguientes puntos:</p>
                  <p>• Si navegando en zonas no autorizadas se requiere asistencia, la empresa no se hará responsable y el seguro no cubrirá ningún tipo de pérdidas y/o daños personales.</p>
                  <p>• En el caso que se sobrepase la zona de navegación indicada en el mismo contrato podrá ser sancionado con 200,00€ por imprudencia.</p>
                  <p>• En caso de necesidad de remolque de la embarcación por avería fuera de la zona de navegación o falta de combustible se cobrará 500,00€ por dicho servicio.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">AVERÍAS:</h3>
                <p className="text-gray-700">
                  En caso de avería, colisión o pérdida de material, el arrendatario deberá avisar imperativamente e inmediatamente al arrendador que le informará sobre las instrucciones a seguir. Si durante el alquiler se produjera una avería no imputable al arrendatario, la cual no permitiera seguir con el alquiler, Costa Brava Rent a Boat reembolsará al contratante las horas no navegadas o entregará una embarcación de características similares a la contratada. Dicha elección quedará exclusivamente al buen criterio de Costa Brava Rent a Boat sin otra responsabilidad. En caso de que la avería o accidente fuera imputable a la responsabilidad del contratante, éste deberá abonar los gastos de remolque y de las reparaciones oportunas para quedar la embarcación, motor o accesorios en el estado en que se le entregó por la empresa al inicio del contrato de alquiler, siendo sólo Costa Brava Rent a Boat la autorizada a efectuar dichas reparaciones.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contacto para dudas */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Tienes dudas sobre nuestras condiciones?</h3>
                <p className="text-blue-800 mb-4">Contacta con nosotros para resolver cualquier consulta</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="mailto:costabravarentboat@gmail.com"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Enviar email
                  </a>
                  <a 
                    href="https://wa.me/34611500372"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}