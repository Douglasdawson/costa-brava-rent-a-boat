import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Plus, Minus, Euro, CreditCard } from "lucide-react";

interface BookingFlowProps {
  boatId?: string;
  onClose?: () => void;
}

export default function BookingFlow({ boatId = "astec-450", onClose }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("2h");
  const [extras, setExtras] = useState<{[key: string]: number}>({});
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    document: ""
  });

  // todo: remove mock functionality - replace with real API data
  const timeSlots = [
    { id: "09:00", label: "09:00", available: true, price: 115 },
    { id: "11:00", label: "11:00", available: false, price: 115 },
    { id: "13:00", label: "13:00", available: true, price: 115 },
    { id: "15:00", label: "15:00", available: true, price: 115 },
    { id: "17:00", label: "17:00", available: true, price: 115 },
  ];

  const availableExtras = [
    { id: "snorkel", name: "Equipo de Snorkel", price: 15, description: "Equipo completo de snorkel para explorar la vida marina" },
    { id: "paddle", name: "Tabla de Paddle Surf", price: 25, description: "Tabla de paddle surf para explorar calas" },
    { id: "cooler", name: "Nevera con Bebidas Frías", price: 10, description: "Nevera con hielo y bebidas refrescantes" }
  ];

  const durations = [
    { id: "1h", label: "1 hora", price: 70 },
    { id: "2h", label: "2 horas", price: 80 },
    { id: "3h", label: "3 horas", price: 90 },
    { id: "4h", label: "4 horas", price: 120 },
    { id: "6h", label: "6 horas", price: 150 },
    { id: "8h", label: "8 horas", price: 180 }
  ];

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
    console.log("Time selected:", timeId);
    setStep(3);
  };

  const updateExtra = (extraId: string, increment: boolean) => {
    setExtras(prev => ({
      ...prev,
      [extraId]: Math.max(0, (prev[extraId] || 0) + (increment ? 1 : -1))
    }));
  };

  const calculateTotal = () => {
    const basePrice = durations.find(d => d.id === duration)?.price || 0;
    const extrasTotal = Object.entries(extras).reduce((total, [id, quantity]) => {
      const extra = availableExtras.find(e => e.id === id);
      return total + (extra ? extra.price * quantity : 0);
    }, 0);
    return basePrice + extrasTotal;
  };

  const handlePayment = () => {
    console.log("Processing payment:", {
      boatId,
      selectedDate,
      selectedTime,
      duration,
      extras,
      customerData,
      total: calculateTotal()
    });
    // Navigate to Stripe payment
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 5 && (
                <div 
                  className={`w-12 h-1 ${
                    stepNumber < step ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Date Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Selecciona la fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg"
                data-testid="input-booking-date"
              />
              <div className="mt-6">
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!selectedDate}
                  className="w-full py-3"
                  data-testid="button-next-step"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Time & Duration Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Horario y duración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Duración</h3>
                <div className="grid grid-cols-2 gap-3">
                  {durations.map((dur) => (
                    <button
                      key={dur.id}
                      onClick={() => setDuration(dur.id)}
                      className={`p-3 border rounded-lg text-center hover-elevate ${
                        duration === dur.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`button-duration-${dur.id}`}
                    >
                      <div className="font-medium">{dur.label}</div>
                      <div className="text-sm text-gray-600">{dur.price}€</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Horario de inicio</h3>
                <div className="space-y-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleTimeSelect(slot.id)}
                      disabled={!slot.available}
                      className={`w-full p-3 border rounded-lg flex items-center justify-between hover-elevate ${
                        !slot.available 
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                          : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                      }`}
                      data-testid={`button-timeslot-${slot.id}`}
                    >
                      <span className="font-medium">{slot.label}</span>
                      {slot.available ? (
                        <Badge variant="secondary">Disponible</Badge>
                      ) : (
                        <Badge variant="outline">Ocupado</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Extras Selection */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Extras (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {availableExtras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{extra.name}</h4>
                      <p className="text-sm text-gray-600">{extra.description}</p>
                      <p className="text-sm font-medium text-primary">{extra.price}€</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateExtra(extra.id, false)}
                        data-testid={`button-decrease-${extra.id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {extras[extra.id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateExtra(extra.id, true)}
                        data-testid={`button-increase-${extra.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setStep(4)}
                className="w-full py-3"
                data-testid="button-continue-customer-data"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Customer Information */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Datos del cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => setCustomerData(prev => ({...prev, name: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ej: Ana García"
                    data-testid="input-customer-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData(prev => ({...prev, email: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="ana@ejemplo.com"
                    data-testid="input-customer-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData(prev => ({...prev, phone: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="+34 600 000 000"
                    data-testid="input-customer-phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento ID (opcional)
                  </label>
                  <input
                    type="text"
                    value={customerData.document}
                    onChange={(e) => setCustomerData(prev => ({...prev, document: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="DNI, NIE, Pasaporte..."
                    data-testid="input-customer-document"
                  />
                </div>
              </div>

              <Button 
                onClick={() => setStep(5)}
                disabled={!customerData.name || !customerData.email || !customerData.phone}
                className="w-full py-3"
                data-testid="button-continue-payment"
              >
                Continuar al pago
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Payment Summary */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Resumen y pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Resumen de la reserva</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Horario:</span>
                    <span className="font-medium">{selectedTime} ({duration})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Embarcación:</span>
                    <span className="font-medium">ASTEC 450</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span>Precio base:</span>
                    <span>{durations.find(d => d.id === duration)?.price}€</span>
                  </div>
                  {Object.entries(extras).map(([id, quantity]) => {
                    const extra = availableExtras.find(e => e.id === id);
                    if (!quantity || !extra) return null;
                    return (
                      <div key={id} className="flex justify-between">
                        <span>{extra.name} x{quantity}:</span>
                        <span>{extra.price * quantity}€</span>
                      </div>
                    );
                  })}
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span className="flex items-center">
                      <Euro className="w-4 h-4 mr-1" />
                      {calculateTotal()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <input type="checkbox" id="terms" className="rounded" />
                  <label htmlFor="terms">
                    Acepto los <a href="#" className="text-primary hover:underline">términos y condiciones</a> y la <a href="#" className="text-primary hover:underline">política de privacidad</a>
                  </label>
                </div>

                <Button 
                  onClick={handlePayment}
                  className="w-full py-3 text-lg font-medium"
                  data-testid="button-pay-now"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar {calculateTotal()}€
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Pago seguro procesado por Stripe. Se aplicará una retención temporal de 15 minutos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        {step > 1 && step < 5 && (
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={() => setStep(step - 1)}
              data-testid="button-back-step"
            >
              Volver
            </Button>
          </div>
        )}

        {onClose && (
          <div className="mt-4 text-center">
            <Button 
              variant="ghost"
              onClick={onClose}
              data-testid="button-close-booking"
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}