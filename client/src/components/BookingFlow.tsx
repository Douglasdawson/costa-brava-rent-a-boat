import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, Plus, Minus, Euro, CreditCard, Anchor } from "lucide-react";
import { BOAT_DATA } from "@shared/boatData";

interface BookingFlowProps {
  boatId?: string;
  onClose?: () => void;
}

export default function BookingFlow({ boatId = "astec-450", onClose }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedBoat, setSelectedBoat] = useState(boatId);
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("2h");
  const [extras, setExtras] = useState<{[key: string]: number}>({});
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phonePrefix: "+34",
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
    { id: "parking", name: "Parking dentro del puerto", price: 10, description: "Parking dentro del puerto y delante del barco" },
    { id: "cooler", name: "Nevera", price: 5, description: "Nevera para mantener bebidas frías" },
    { id: "snorkel", name: "Equipo snorkel", price: 5, description: "Equipo completo de snorkel" },
    { id: "paddle", name: "Tabla de paddlesurf", price: 25, description: "Tabla de paddle surf" },
    { id: "seascooter", name: "Seascooter", price: 50, description: "Scooter acuático" }
  ];

  const phoneCountries = [
    { code: "+34", country: "España" },
    { code: "+33", country: "Francia" },
    { code: "+44", country: "Reino Unido" },
    { code: "+49", country: "Alemania" },
    { code: "+39", country: "Italia" },
    { code: "+1", country: "Estados Unidos" }
  ];

  const availableBoats = Object.values(BOAT_DATA);

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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div 
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 ${
                  stepNumber <= step 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 6 && (
                <div 
                  className={`w-8 sm:w-12 h-1 ${
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

        {/* Step 2: Boat Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Anchor className="w-5 h-5 mr-2" />
                Selecciona tu embarcación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableBoats.map((boat) => {
                  const isSelected = selectedBoat === boat.id;
                  return (
                    <div
                      key={boat.id}
                      onClick={() => setSelectedBoat(boat.id)}
                      className={`p-4 border rounded-lg cursor-pointer hover-elevate ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`boat-option-${boat.id}`}
                    >
                      <div className="flex items-center mb-3">
                        <img 
                          src={boat.image} 
                          alt={boat.name}
                          className="w-16 h-16 object-cover rounded-lg mr-3"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{boat.name}</h3>
                          <p className="text-sm text-gray-600">{boat.subtitle}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>👥 {boat.specifications.capacity}</div>
                        <div>📏 {boat.specifications.length}</div>
                        <div>⛽ {boat.specifications.engine}</div>
                        <div>💰 Desde {Math.min(...Object.values(boat.pricing.BAJA.prices))}€</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <Button 
                  onClick={() => setStep(3)}
                  disabled={!selectedBoat}
                  className="w-full py-3"
                  data-testid="button-next-step"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Time & Duration Selection */}
        {step === 3 && (
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
                      onClick={() => {
                        setSelectedTime(slot.id);
                        console.log("Time selected:", slot.id);
                        setStep(4);
                      }}
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

        {/* Step 4: Extras Selection */}
        {step === 4 && (
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
                onClick={() => setStep(5)}
                className="w-full py-3"
                data-testid="button-continue-customer-data"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Customer Information */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Datos del cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={customerData.firstName}
                      onChange={(e) => setCustomerData(prev => ({...prev, firstName: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ana"
                      data-testid="input-customer-firstname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={customerData.lastName}
                      onChange={(e) => setCustomerData(prev => ({...prev, lastName: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="García López"
                      data-testid="input-customer-lastname"
                    />
                  </div>
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
                  <div className="flex gap-2">
                    <Select value={customerData.phonePrefix} onValueChange={(value) => setCustomerData(prev => ({...prev, phonePrefix: value}))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.code} {country.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData(prev => ({...prev, phone: e.target.value}))}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="600 000 000"
                      data-testid="input-customer-phone"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de documento *
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
                onClick={() => setStep(6)}
                disabled={!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone || !customerData.document}
                className="w-full py-3"
                data-testid="button-continue-payment"
              >
                Continuar al pago
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Payment Summary */}
        {step === 6 && (
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
                    <span className="font-medium">{BOAT_DATA[selectedBoat]?.name || 'N/A'}</span>
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
        {step > 1 && step < 6 && (
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