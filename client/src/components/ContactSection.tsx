import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    // todo: remove mock functionality - implement real form submission
    alert("Mensaje enviado correctamente. Te contactaremos pronto.");
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, soy ${formData.name}. ${formData.message || "Me gustaría información sobre el alquiler de barcos."}`
    );
    window.open(`https://wa.me/34611500372?text=${message}`, "_blank");
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white" id="contact">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            Contacto - Alquiler de barcos en Blanes
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl sm:max-w-2xl mx-auto px-2">
            ¿Tienes alguna pregunta sobre el alquiler de barcos en Blanes? Estamos en Puerto de Blanes, Costa Brava, 
            para ayudarte a planificar tu experiencia perfecta en el mar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Contact Information */}
          <Card className="flex flex-col">
            <CardHeader className="pb-6">
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-6">
              <div>
                <div className="flex items-start space-x-3 sm:space-x-4 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Teléfono & WhatsApp</h3>
                    <a 
                      href="tel:+34611500372" 
                      className="text-gray-600 hover:text-primary transition-colors cursor-pointer block mb-1 text-sm sm:text-base"
                      data-testid="phone-link"
                    >
                      +34 611 500 372
                    </a>
                    <p className="text-xs sm:text-sm text-gray-500">Disponible 9:00 - 20:00</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start space-x-4 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Email</h3>
                    <a 
                      href="mailto:costabravarentboat@gmail.com" 
                      className="text-gray-600 hover:text-primary transition-colors cursor-pointer block mb-1"
                      data-testid="email-link"
                    >
                      costabravarentboat@gmail.com
                    </a>
                    <p className="text-sm text-gray-500">Respuesta en 24h</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start space-x-4 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Ubicación</h3>
                    <a 
                      href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
                      data-testid="location-link"
                    >
                      <span className="block mb-1">Puerto de Blanes, Costa Brava</span>
                      <span className="block text-sm text-gray-500 hover:text-primary/80">Girona, España - Zona de embarque</span>
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start space-x-4 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Temporada</h3>
                    <p className="text-gray-600 mb-1">Abril - Octubre</p>
                    <p className="text-sm text-gray-500">Horarios flexibles según disponibilidad</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <Button 
                  onClick={() => window.open("https://wa.me/34611500372", "_blank")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 h-12"
                  data-testid="button-whatsapp-quick"
                >
                  <span className="mr-2">💬</span>
                  Consulta por WhatsApp
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle>Envíanos un Mensaje</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <form id="contact-form" onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary h-12"
                    placeholder="Tu nombre completo"
                    data-testid="input-contact-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary h-12"
                    placeholder="tu@email.com"
                    data-testid="input-contact-email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary h-12"
                    placeholder="+34 600 000 000"
                    data-testid="input-contact-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none flex-1 min-h-[120px]"
                    placeholder="Cuéntanos qué necesitas: fechas, tipo de barco, número de personas, extras..."
                    data-testid="textarea-contact-message"
                  />
                </div>

                {/* Form Buttons */}
                <div className="mt-auto space-y-3 pt-6 border-t border-gray-200">
                  <Button 
                    form="contact-form"
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 h-12"
                    data-testid="button-submit-form"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                  <Button 
                    onClick={() => window.open("tel:+34611500372", "_self")}
                    variant="outline"
                    className="w-full px-6 py-3 h-12"
                    data-testid="button-call-phone"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llama al +34 611 500 372
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>


        {/* Map placeholder */}
        <div className="mt-12">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                Nos encontramos en el Puerto de Blanes
              </h3>
              <p className="text-gray-600 mb-4">
                Fácil acceso y parking disponible cerca del puerto deportivo.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.open("https://maps.app.goo.gl/VrSkZNG7289VVdJD9", "_blank")}
                data-testid="button-view-map"
              >
                Ver en Google Maps
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}