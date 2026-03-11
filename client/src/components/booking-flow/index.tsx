import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useBookingFlowState } from "./useBookingFlowState";
import { useBookingFlowActions } from "./useBookingFlowActions";
import { BookingProgressIndicator } from "./BookingProgressIndicator";
import { BookingStepDate } from "./BookingStepDate";
import { BookingStepBoat } from "./BookingStepBoat";
import { BookingStepTime } from "./BookingStepTime";
import { BookingStepExtras } from "./BookingStepExtras";
import { BookingStepCustomer } from "./BookingStepCustomer";
import { BookingStepPayment } from "./BookingStepPayment";
import type { BookingFlowProps } from "./types";

export default function BookingFlow(props: BookingFlowProps) {
  const { onClose } = props;
  const [, setLocation] = useLocation();
  const state = useBookingFlowState(props);
  const { createQuote, handlePayment } = useBookingFlowActions(state, onClose);

  const { step, setStep, t } = state;

  return (
    <div className="min-h-screen bg-primary/5 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back to home button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="flex items-center text-muted-foreground hover:text-foreground"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.booking.backToHome}
          </Button>
        </div>

        <BookingProgressIndicator currentStep={step} />

        {step === 1 && (
          <BookingStepDate
            selectedDate={state.selectedDate}
            setSelectedDate={state.setSelectedDate}
            setStep={setStep}
            t={t}
          />
        )}

        {step === 2 && (
          <BookingStepBoat
            availableBoats={state.availableBoats}
            selectedBoat={state.selectedBoat}
            setSelectedBoat={state.setSelectedBoat}
            licenseFilter={state.licenseFilter}
            setLicenseFilter={state.setLicenseFilter}
            setStep={setStep}
          />
        )}

        {step === 3 && (
          <BookingStepTime
            timeSlots={state.timeSlots}
            selectedTime={state.selectedTime}
            setSelectedTime={state.setSelectedTime}
            duration={state.duration}
            setDuration={state.setDuration}
            getAvailableDurations={state.getAvailableDurations}
            setStep={setStep}
          />
        )}

        {step === 4 && (
          <BookingStepExtras
            availableExtras={state.availableExtras}
            extras={state.extras}
            updateExtra={state.updateExtra}
            setStep={setStep}
          />
        )}

        {step === 5 && (
          <BookingStepCustomer
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
            setStep={setStep}
            t={t}
          />
        )}

        {step === 6 && (
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
            calculateTotal={state.calculateTotal}
            createQuote={createQuote}
            handlePayment={handlePayment}
            t={t}
          />
        )}

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
              onClick={onClose}
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

