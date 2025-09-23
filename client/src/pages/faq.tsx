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
  Umbrella
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";

export default function FAQPage() {
  const handleWhatsAppContact = () => {
    const message = "Hola, tengo una pregunta sobre el alquiler de barcos. ¿Podrían ayudarme?";
    openWhatsApp(message);
  };

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Preguntas Frecuentes (FAQ) - Alquiler de Barcos en Blanes | Costa Brava Rent a Boat"
        description="Resuelve todas tus dudas sobre el alquiler de barcos en Blanes, Costa Brava. Precios, requisitos, qué incluye, políticas de cancelación y más. Sin licencia y con licencia."
        canonical="https://costa-brava-rent-a-boat-blanes.replit.app/faq"
      />
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Anchor className="w-12 h-12 text-primary mr-4" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900">
              Preguntas Frecuentes
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Encuentra respuestas a todas tus dudas sobre el alquiler de barcos en Blanes, Costa Brava. 
            Si no encuentras lo que buscas, ¡contáctanos directamente!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleBookingWhatsApp}
              size="lg"
              className="gap-2"
              data-testid="button-book-now"
            >
              <Phone className="w-5 h-5" />
              Reservar Ahora
            </Button>
            <Button 
              onClick={handleWhatsAppContact}
              variant="outline"
              size="lg"
              className="gap-2"
              data-testid="button-contact"
            >
              <Phone className="w-5 h-5" />
              Hacer Pregunta
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Puerto de Blanes</h3>
                <p className="text-gray-600 text-sm">Salida desde Puerto de Blanes, Costa Brava. Fácil acceso y parking disponible.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Temporada</h3>
                <p className="text-gray-600 text-sm">Abril - Octubre. Reservas flexibles con duración de 1-8 horas.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">7 Embarcaciones</h3>
                <p className="text-gray-600 text-sm">Flota para 4-7 personas. Con y sin licencia náutica.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Reservas y Precios */}
          <Card className="mb-8">
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
                      <p className="text-sm text-gray-600">*Precios orientativos. Consulta disponibilidad y precios exactos para tu fecha.</p>
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
                      <p className="text-sm text-gray-600">Se requiere una seña del 50% para confirmar la reserva.</p>
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
                      <p className="text-sm text-gray-600">En caso de condiciones meteorológicas adversas, siempre priorizamos la seguridad.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Licencias y Requisitos */}
          <Card className="mb-8">
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
                      <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
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
                      <p className="text-sm text-gray-600">El patrón debe presentar DNI o pasaporte válido.</p>
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
                      <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm">Perfectas para primerizos y familias</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Qué Incluye */}
          <Card className="mb-8">
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
                      <div className="grid sm:grid-cols-2 gap-4">
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Embarcación completamente equipada</li>
                          <li>Combustible para uso normal</li>
                          <li>Chalecos salvavidas</li>
                          <li>Kit de seguridad obligatorio</li>
                          <li>Ancla y cabo</li>
                          <li>Escalera de baño</li>
                        </ul>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Equipo de snorkel básico</li>
                          <li>Paddle surf hinchable</li>
                          <li>Nevera portátil</li>
                          <li>Instrucciones y mapa</li>
                          <li>Seguro básico</li>
                          <li>Soporte telefónico</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="combustible" data-testid="faq-combustible">
                  <AccordionTrigger>¿Tengo que pagar combustible extra?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p><strong>El combustible está incluido para uso normal:</strong></p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Navegación por la zona autorizada</li>
                        <li>Paradas para bañarse y fondear</li>
                        <li>Uso típico de recreo familiar</li>
                      </ul>
                      <div className="flex items-center gap-2 mt-3 p-3 bg-yellow-50 rounded-lg">
                        <Fuel className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm">Solo se cobra combustible extra en caso de uso excesivo (navegación a alta velocidad constante)</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="extras" data-testid="faq-extras">
                  <AccordionTrigger>¿Qué extras puedo añadir?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p><strong>Extras disponibles:</strong></p>
                      <div className="grid gap-3">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Toldo/Bimini extra</span>
                          <Badge variant="outline">+25€</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Equipo snorkel profesional</span>
                          <Badge variant="outline">+15€</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Cámara acuática GoPro</span>
                          <Badge variant="outline">+30€</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
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
              </Accordion>
            </CardContent>
          </Card>

          {/* Navegación y Seguridad */}
          <Card className="mb-8">
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
                        <li><strong>Norte:</strong> Hasta Cala Bona (Tossa de Mar)</li>
                        <li><strong>Sur:</strong> Hasta Malgrat de Mar</li>
                        <li><strong>Distancia:</strong> Máximo 3 millas de la costa</li>
                        <li><strong>Calas recomendadas:</strong> Cala Brava, Cala Sant Francesc, Playa de Lloret</li>
                      </ul>
                      <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">Te proporcionamos mapa detallado con puntos de interés</span>
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
                        <li>Radio VHF para emergencias</li>
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
                      <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg">
                        <Umbrella className="w-5 h-5 text-green-600" />
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
                        <li><strong>Llama al 112</strong> (emergencias generales)</li>
                        <li><strong>Contacta al 902 202 202</strong> (Salvamento Marítimo)</li>
                        <li><strong>Llámanos inmediatamente:</strong> +34 XXX XXX XXX</li>
                        <li><strong>Da tu posición GPS</strong> (la encontrarás en el plotter)</li>
                      </ol>
                      <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium">Números de emergencia incluidos en el briefing</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Información Práctica */}
          <Card className="mb-8">
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
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Media mañana</span>
                          <Badge variant="outline">09:00 - 13:00</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Tarde</span>
                          <Badge variant="outline">14:00 - 18:00</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Día completo</span>
                          <Badge variant="outline">09:00 - 17:00</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Atardecer</span>
                          <Badge variant="outline">18:00 - 21:00</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">*Horarios pueden variar según temporada y disponibilidad</p>
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
                      <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
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
                        <li><strong>Parking Puerto:</strong> 2€/hora (muy cerca)</li>
                        <li><strong>Zona azul:</strong> 1,5€/hora (5 min andando)</li>
                        <li><strong>Parking gratuito:</strong> 10 min andando</li>
                        <li><strong>Temporada alta:</strong> Recomendamos reservar plaza</li>
                      </ul>
                      <p className="text-sm text-gray-600">Te enviamos ubicaciones exactas con la confirmación.</p>
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
                      <div className="flex items-center gap-2 mt-3 p-3 bg-yellow-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm">Evita llevar objetos de valor. No nos responsabilizamos por pérdidas</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Temporada y Disponibilidad */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Sun className="w-6 h-6 text-primary" />
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
                      <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg">
                        <Sun className="w-5 h-5 text-green-600" />
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

          {/* Contacto y Soporte */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Phone className="w-6 h-6 text-primary" />
                ¿Más Preguntas?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Si no has encontrado la respuesta que buscabas, estamos aquí para ayudarte. 
                Nuestro equipo responde rápidamente y estará encantado de resolver cualquier duda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleWhatsAppContact} className="gap-2 flex-1" data-testid="button-whatsapp-questions">
                  <Phone className="w-5 h-5" />
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

      <Footer />
    </div>
  );
}