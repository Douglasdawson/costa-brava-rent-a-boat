import { FileText, UserCheck, AlertTriangle, Shield, ArrowLeftRight, Fuel, DollarSign, MapPin, XCircle, Edit, Cloud, Wrench, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen">
      <SEO 
        title="Términos y Condiciones - Alquiler de Barcos en Blanes | Costa Brava Rent a Boat"
        description="Condiciones generales del alquiler de embarcaciones con y sin licencia en Costa Brava Rent a Boat Blanes. Términos, responsabilidades y políticas de cancelación."
        canonical="https://costa-brava-rent-a-boat-blanes.replit.app/terms-conditions"
      />
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-primary mr-4" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
              Términos y Condiciones
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-2 pb-12 sm:pt-4 sm:pb-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Embarcaciones CON Titulación */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="w-6 h-6 text-primary" />
                Condiciones para Embarcaciones CON Titulación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Requisitos de Alquiler
                </h3>
                <p className="text-sm text-gray-700">Las embarcaciones con titulación sólo podrán ser arrendadas por la persona designada en el contrato y que debe poseer la correspondiente titulación en vigor.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Prohibiciones
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                  <li>Sobrepasar la distancia de una milla desde la costa</li>
                  <li>Sobrepasar el número de plazas máximo permitido según el modelo de la embarcación</li>
                  <li>Varar la embarcación en la playa o acceder a ella</li>
                  <li>Entrar, permanecer o salir del agua con el motor en funcionamiento</li>
                  <li>Dejar la embarcación amarrada o anclada sin ninguna persona a bordo</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Responsabilidades
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>La velocidad máxima en puertos y canales específicos es de 3 nudos</li>
                    <li>Respetar la zona de bañistas y fondear fuera de las boyas amarillas</li>
                    <li>Mantener distancia mínima de 200m de playas y acantilados</li>
                    <li>Guardar 100m de distancia de embarcaciones con bandera de submarinistas</li>
                    <li>Se recomienda el uso de chalecos salvavidas durante la navegación</li>
                  </ul>
                  <p>El arrendatario asume toda responsabilidad por multas, sanciones, perjuicios o daños causados por infracción de alguna cláusula del contrato.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                  Entrega y Recogida
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>La embarcación será entregada y devuelta en el Puerto de Blanes. Se devolverá con todo su equipamiento en las mismas condiciones en las que se entregó.</p>
                  <p><strong>Importante:</strong> Si el check-out se realiza más tarde de la hora estipulada sin aviso se cobrará 150€ por cada 30 minutos de retraso.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-primary" />
                  Carburante
                </h3>
                <p className="text-sm text-gray-700">La gasolina NO está incluida en el precio. La embarcación se entregará con el depósito lleno y se devolverá en el mismo estado.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Seguro y Fianza
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Las tarifas incluyen seguro de Responsabilidad Civil Obligatoria y seguro para daños físicos para la tripulación.</p>
                  <p><strong>Fianza:</strong> 500€ o 1.000€ dependiendo de la embarcación alquilada para responder a cualquier desperfecto, pérdida de material o retraso en la devolución.</p>
                  <p>Quedan excluidas del seguro las actividades que conlleven el arrastre de artefactos como bananas, ruedas neumáticas, esquís, etc.</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Embarcaciones SIN Titulación */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="w-6 h-6 text-primary" />
                Condiciones para Embarcaciones SIN Titulación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Requisitos de Alquiler
                </h3>
                <p className="text-sm text-gray-700">La embarcación sólo podrá ser arrendada por la persona designada en el contrato, que debe ser mayor de 18 años.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Prohibiciones
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                  <li>Sobrepasar la distancia de una milla desde la costa (1.8 km)</li>
                  <li>Sobrepasar el número de plazas máximo permitido</li>
                  <li>Varar la embarcación en la playa o acceder a ella</li>
                  <li>Entrar, permanecer o salir del agua con el motor en funcionamiento</li>
                  <li>Realizar giros bruscos y continuos (donuts) con la embarcación</li>
                  <li>Dejar la embarcación amarrada sin ninguna persona a bordo</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Zona de Navegación Restringida
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Las embarcaciones tienen una zona restringida de navegación que abarca desde el río Tordera al sur hasta el final de la playa de Fenals al norte.</p>
                  <p><strong>Importante:</strong> Si se sobrepasa la zona de navegación indicada podrá ser sancionado con 200€ por imprudencia.</p>
                  <p>En caso de necesidad de remolque fuera de la zona autorizada se cobrará 500€ por dicho servicio.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-primary" />
                  Carburante
                </h3>
                <p className="text-sm text-gray-700">La gasolina SÍ está incluida en el precio. Las embarcaciones disponen de un depósito de 25 litros incluido en el precio del alquiler.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Seguro y Fianza
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Las tarifas incluyen seguro de Responsabilidad Civil Obligatoria y seguro para daños físicos para la tripulación.</p>
                  <p><strong>Fianza:</strong> 200€ para responder a cualquier desperfecto, pérdida de material o retraso en la devolución de la embarcación.</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Cancelaciones y Cambios */}
          <Card className="mb-6 sm:mb-8" id="cancelaciones-cambios">
            <CardHeader>
              <CardTitle className="text-xl">
                Cancelaciones y Cambios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-primary" />
                  Política de Cancelación
                </h3>
                <p className="text-sm text-gray-700 mb-3">La cancelación de la reserva por parte del cliente ocasionará gastos de tramitación, gestión y bloqueo de la embarcación, por lo que <strong>todas las cancelaciones conllevarán la no devolución del importe pagado</strong> al formalizar la reserva.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Cambios de Reserva
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Costa Brava Rent a Boat acepta el cambio de una reserva únicamente con una comunicación previa por escrito a:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Email: costabravarentboat@gmail.com</li>
                    <li>WhatsApp: +34 611 500 372</li>
                  </ul>
                  <p><strong>Requisito:</strong> Mínimo de 7 días de antelación al día del alquiler.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-primary" />
                  Condiciones Meteorológicas
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Cuando el alquiler no pueda disfrutarse por motivos climatológicos justificados y verificados por Costa Brava Rent a Boat, se ofrecerá al cliente un cambio de fecha, sujeto a disponibilidad.</p>
                  <p>Si el cliente decide no salir a navegar aun siendo positivo el veredicto de nuestro personal, no se efectuará la devolución del importe pagado.</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Averías y Responsabilidades */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                Averías y Responsabilidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  En Caso de Avería
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>En caso de avería, colisión o pérdida de material, el arrendatario deberá avisar inmediatamente a Costa Brava Rent a Boat.</p>
                  <p>Si la avería no es imputable al arrendatario, Costa Brava Rent a Boat reembolsará las horas no navegadas o entregará una embarcación de características similares.</p>
                  <p>Si la avería es imputable al contratante, éste deberá abonar los gastos de remolque y reparaciones necesarias.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Limitación de Responsabilidad
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>La empresa no asume responsabilidad alguna por pérdidas o daños en cualquiera de los bienes que el arrendatario u otra persona olvide, deposite o transporte en la embarcación.</p>
                  <p>El arrendatario asume el riesgo de tales pérdidas y exime a la empresa de toda reclamación por retrasos consecuencia de avería o cambios meteorológicos imprevistas.</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Legislación */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                Legislación Aplicable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">Para cualquier controversia que pudiera surgir del contenido o interpretación del presente documento, ambas partes se comprometen a los jueces y tribunales de Blanes y superiores jerarquías correspondientes.</p>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}