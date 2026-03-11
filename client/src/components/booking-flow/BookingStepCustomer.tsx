import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import type { Translations } from "@/lib/translations";
import type { PhonePrefix } from "@/utils/phone-prefixes";
import type { CustomerData } from "./types";

interface BookingStepCustomerProps {
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
  maxCapacity: number;
  phonePrefixSearch: string;
  setPhonePrefixSearch: (search: string) => void;
  showPhonePrefixDropdown: boolean;
  setShowPhonePrefixDropdown: (show: boolean) => void;
  filteredPhoneCountries: PhonePrefix[];
  nationalitySearch: string;
  setNationalitySearch: (search: string) => void;
  showNationalityDropdown: boolean;
  setShowNationalityDropdown: (show: boolean) => void;
  filteredNationalities: string[];
  setStep: (step: number) => void;
  t: Translations;
}

export function BookingStepCustomer({
  customerData, setCustomerData, maxCapacity,
  phonePrefixSearch, setPhonePrefixSearch,
  showPhonePrefixDropdown, setShowPhonePrefixDropdown,
  filteredPhoneCountries,
  nationalitySearch, setNationalitySearch,
  showNationalityDropdown, setShowNationalityDropdown,
  filteredNationalities,
  setStep, t,
}: BookingStepCustomerProps) {
  return (
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
              <label className="block text-base font-medium text-foreground mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={customerData.customerName}
                onChange={(e) => setCustomerData(prev => ({...prev, customerName: e.target.value}))}
                className="w-full p-3 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                placeholder="Ana"
                data-testid="input-customer-name"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-foreground mb-2">
                Apellidos *
              </label>
              <input
                type="text"
                value={customerData.customerSurname}
                onChange={(e) => setCustomerData(prev => ({...prev, customerSurname: e.target.value}))}
                className="w-full p-3 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                placeholder="García López"
                data-testid="input-customer-surname"
              />
            </div>
          </div>
          <div>
            <label className="block text-base font-medium text-foreground mb-2">
              Email *
            </label>
            <input
              type="email"
              value={customerData.customerEmail}
              onChange={(e) => setCustomerData(prev => ({...prev, customerEmail: e.target.value}))}
              className="w-full p-3 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
              placeholder="ana@ejemplo.com (opcional)"
              data-testid="input-customer-email"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-foreground mb-2">
              Teléfono *
            </label>
            <div className="flex gap-2">
              <div className="relative w-28 flex-shrink-0">
                <input
                  type="text"
                  value={phonePrefixSearch || customerData.phonePrefix}
                  onChange={(e) => {
                    setPhonePrefixSearch(e.target.value);
                    setShowPhonePrefixDropdown(true);
                  }}
                  onFocus={() => setShowPhonePrefixDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowPhonePrefixDropdown(false), 200);
                  }}
                  placeholder="+34"
                  className="w-full p-3 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm text-foreground"
                  data-testid="input-phone-prefix-search"
                />
                {showPhonePrefixDropdown && filteredPhoneCountries.length > 0 && (
                  <div className="absolute z-10 left-0 w-full max-w-xs max-h-48 overflow-y-auto bg-white border border-primary/20 rounded-lg shadow-lg mt-1">
                    {filteredPhoneCountries.slice(0, 8).map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setCustomerData(prev => ({...prev, phonePrefix: country.code}));
                          setPhonePrefixSearch("");
                          setShowPhonePrefixDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 text-sm border-b last:border-b-0 text-foreground"
                        data-testid={`option-prefix-${country.code}`}
                      >
                        <span className="font-mono">{country.code}</span> {country.country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="tel"
                  value={customerData.customerPhone}
                  onChange={(e) => setCustomerData(prev => ({...prev, customerPhone: e.target.value}))}
                  className="w-full p-3 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                  placeholder="600 000 000"
                  data-testid="input-customer-phone"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nacionalidad *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nationalitySearch || customerData.customerNationality}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNationalitySearch(value);
                    setShowNationalityDropdown(true);
                    setCustomerData(prev => ({...prev, customerNationality: value}));
                  }}
                  onBlur={() => {
                    if (nationalitySearch) {
                      setCustomerData(prev => ({...prev, customerNationality: nationalitySearch}));
                      setNationalitySearch("");
                    }
                    setShowNationalityDropdown(false);
                  }}
                  onFocus={() => setShowNationalityDropdown(true)}
                  placeholder="Buscar nacionalidad"
                  className="w-full p-3 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                  data-testid="input-nationality-search"
                />
                {showNationalityDropdown && filteredNationalities.length > 0 && (
                  <div className="absolute z-10 w-full max-h-48 overflow-y-auto bg-white border border-primary/20 rounded-lg shadow-lg mt-1">
                    {filteredNationalities.slice(0, 10).map((nationality) => (
                      <button
                        key={nationality}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCustomerData(prev => ({...prev, customerNationality: nationality}));
                          setNationalitySearch("");
                          setShowNationalityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 border-b last:border-b-0 text-foreground"
                        data-testid={`option-nationality-${nationality.toLowerCase()}`}
                      >
                        {nationality}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Número de personas *
              </label>
              <Select value={customerData.numberOfPeople.toString()} onValueChange={(value) => setCustomerData(prev => ({...prev, numberOfPeople: parseInt(value)}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'persona' : 'personas'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setStep(6)}
          disabled={!customerData.customerName || !customerData.customerSurname || !customerData.customerPhone || !customerData.customerNationality || customerData.numberOfPeople < 1 || customerData.customerPhone?.length < 9}
          className="w-full py-3"
          data-testid="button-continue-payment"
        >
          {t.booking.continueToPayment}
        </Button>
      </CardContent>
    </Card>
  );
}
