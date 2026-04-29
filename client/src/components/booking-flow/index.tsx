import { useBookingFlowState } from "./useBookingFlowState";
import { useBookingFlowActions } from "./useBookingFlowActions";
import { BookingProgressIndicator } from "./BookingProgressIndicator";
import { BookingStepExperience } from "./BookingStepExperience";
import { BookingStepPersonalize } from "./BookingStepPersonalize";
import { BookingStepPayment } from "./BookingStepPayment";
import type { BookingFlowProps } from "./types";
import { trackBookingAbandoned } from "@/utils/analytics";
import { getMinActivePrice } from "@shared/pricing";

export default function BookingFlow(props: BookingFlowProps) {
  const { onClose } = props;
  const state = useBookingFlowState(props);
  const { createQuote, handlePayment } = useBookingFlowActions(state, onClose);

  const { step, setStep, t } = state;

  const onBack = step > 1
    ? () => {
        trackBookingAbandoned(`step_${step}_back`, state.selectedBoat);
        setStep(step - 1);
      }
    : undefined;

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex-shrink-0 px-5 sm:px-8 pt-6 pb-5 border-b border-border/60">
        <BookingProgressIndicator currentStep={step} t={t} />
      </header>

      <div
        className="flex-1 min-h-0 overflow-y-auto"
        aria-live="polite"
        aria-atomic="false"
      >
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 px-5 sm:px-8 pt-7 pb-6">
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
          </div>
        )}

        {step === 2 && (() => {
          const boat = state.availableBoats.find(b => b.id === state.selectedBoat);
          const boatName = boat?.name || state.selectedBoat;
          const pricing = boat?.pricing as Record<string, { prices: Record<string, number> }> | null;
          const boatPrice = pricing ? (getMinActivePrice(pricing.BAJA?.prices) ?? 75) : 0;
          return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 px-5 sm:px-8 pt-7 pb-6">
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
                boat={boat}
                duration={state.duration}
                selectedDate={state.selectedDate}
                selectedTime={state.selectedTime}
                setStep={setStep}
                onBack={onBack}
                t={t}
              />
            </div>
          );
        })()}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 px-5 sm:px-8 pt-7 pb-6">
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
              customerData={state.customerData}
              isLoading={state.isLoading}
              isProcessingPayment={state.isProcessingPayment}
              calculateTotal={state.calculateTotal}
              createQuote={createQuote}
              handlePayment={handlePayment}
              onBack={onBack}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
}
