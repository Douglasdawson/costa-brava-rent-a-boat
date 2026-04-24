import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useBookingFlowState } from "./useBookingFlowState";
import { useBookingFlowActions } from "./useBookingFlowActions";
import { BookingProgressIndicator } from "./BookingProgressIndicator";
import { BookingStepExperience } from "./BookingStepExperience";
import { BookingStepPersonalize } from "./BookingStepPersonalize";
import { BookingStepPayment } from "./BookingStepPayment";
import type { BookingFlowProps } from "./types";
import { trackBookingAbandoned } from "@/utils/analytics";
import { getMinActivePrice } from "@shared/pricing";

// Days remaining until 2026 season price increase (June 1). Recomputed on
// every render — cheap and always fresh without effects. Clamped to >=0 so
// the banner silently disappears after the deadline.
function daysUntilSeasonIncrease(): number {
  const target = new Date("2026-06-01T00:00:00Z").getTime();
  const diff = target - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function BookingFlow(props: BookingFlowProps) {
  const { onClose } = props;
  const [, setLocation] = useLocation();
  const { localizedPath } = useLanguage();
  const state = useBookingFlowState(props);
  const { createQuote, handlePayment } = useBookingFlowActions(state, onClose);

  const { step, setStep, t } = state;

  return (
    <div className="min-h-screen bg-primary/5 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back to home button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => { trackBookingAbandoned(`step_${step}`, state.selectedBoat); setLocation(localizedPath("home")); }}
            className="flex items-center text-muted-foreground hover:text-foreground"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.booking.backToHome}
          </Button>
        </div>

        {(() => {
          const days = daysUntilSeasonIncrease();
          if (days === 0) return null;
          return (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs sm:text-sm text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" aria-hidden />
              <span>
                {t.booking?.seasonCountdown
                  ? t.booking.seasonCountdown.replace("{days}", String(days))
                  : `Precios temporada 2026 suben el 1 de junio · quedan ${days} días · confirma hoy`}
              </span>
            </div>
          );
        })()}

        <BookingProgressIndicator currentStep={step} t={t} />

        {/* min-height prevents CLS when switching between steps */}
        <div className="min-h-[420px]" aria-live="polite" aria-atomic="false">
        {step === 1 && (
          <BookingStepExperience
            selectedDate={state.selectedDate}
            setSelectedDate={state.setSelectedDate}
            availableBoats={state.availableBoats}
            selectedBoat={state.selectedBoat}
            setSelectedBoat={state.setSelectedBoat}
            licenseFilter={state.licenseFilter}
            setLicenseFilter={state.setLicenseFilter}
            timeSlots={state.timeSlots}
            selectedTime={state.selectedTime}
            setSelectedTime={state.setSelectedTime}
            duration={state.duration}
            setDuration={state.setDuration}
            getAvailableDurations={state.getAvailableDurations}
            setStep={setStep}
            t={t}
          />
        )}

        {step === 2 && (() => {
          const boat = state.availableBoats.find(b => b.id === state.selectedBoat);
          const boatName = boat?.name || state.selectedBoat;
          const pricing = boat?.pricing as Record<string, { prices: Record<string, number> }> | null;
          const boatPrice = pricing ? (getMinActivePrice(pricing.BAJA?.prices) ?? 75) : 0;
          return (
            <BookingStepPersonalize
              availableExtras={state.availableExtras}
              extras={state.extras}
              updateExtra={state.updateExtra}
              customerData={state.customerData}
              setCustomerData={state.setCustomerData}
              maxCapacity={state.maxCapacity}
              phonePrefixSearch={state.phonePrefixSearch}
              setPhonePrefixSearch={state.setPhonePrefixSearch}
              showPhonePrefixDropdown={state.showPhonePrefixDropdown}
              setShowPhonePrefixDropdown={state.setShowPhonePrefixDropdown}
              filteredPhoneCountries={state.filteredPhoneCountries}
              nationalitySearch={state.nationalitySearch}
              setNationalitySearch={state.setNationalitySearch}
              showNationalityDropdown={state.showNationalityDropdown}
              setShowNationalityDropdown={state.setShowNationalityDropdown}
              filteredNationalities={state.filteredNationalities}
              boatId={state.selectedBoat}
              boatName={boatName}
              boatPrice={boatPrice}
              setStep={setStep}
              t={t}
            />
          );
        })()}

        {step === 3 && (
          <BookingStepPayment
            selectedDate={state.selectedDate}
            selectedTime={state.selectedTime}
            duration={state.duration}
            selectedBoat={state.selectedBoat}
            availableBoats={state.availableBoats}
            quote={state.quote}
            holdId={state.holdId}
            durations={state.durations}
            extras={state.extras}
            availableExtras={state.availableExtras}
            isLoading={state.isLoading}
            isProcessingPayment={state.isProcessingPayment}
            calculateTotal={state.calculateTotal}
            createQuote={createQuote}
            handlePayment={handlePayment}
            t={t}
          />
        )}
        </div>

        {/* Navigation buttons */}
        {step > 1 && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              data-testid="button-back-step"
            >
              {t.booking.back}
            </Button>
          </div>
        )}

        {onClose && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => { trackBookingAbandoned(`step_${step}`, state.selectedBoat); onClose(); }}
              data-testid="button-close-booking"
            >
              {t.booking.close}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
