# Booking Wizard Mobile — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wrap the BookingFormWidget in a 4-step wizard on mobile screens (<768px), leaving the desktop form completely unchanged.

**Architecture:** `BookingFormWidget.tsx` keeps all state and logic. A new `BookingWizardMobile.tsx` component receives all state/handlers as props and renders the step-by-step UI. `useIsMobile()` determines which render path to use. Step navigation state (`currentStep`) lives in `BookingFormWidget`.

**Tech Stack:** React, TailwindCSS, shadcn/ui, `useIsMobile` hook (already exists at `client/src/hooks/use-mobile.tsx`), lucide-react icons.

---

## Task 1: Add step navigation state to BookingFormWidget

**Files:**
- Modify: `client/src/components/BookingFormWidget.tsx`

**Step 1: Import useIsMobile**

At the top of the file, after the existing imports, add:

```tsx
import { useIsMobile } from "@/hooks/use-mobile";
```

**Step 2: Add currentStep state after the existing state declarations (around line 149)**

Find the block ending with:
```tsx
const [touched, setTouched] = useState<Record<string, boolean>>({});
```

Add immediately after:
```tsx
  // Mobile wizard navigation
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
```

**Step 3: Add step validation helpers after `getFieldError` function (around line 414)**

Find the end of `showFieldError`:
```tsx
  const showFieldError = (field: string): boolean => {
    return !!touched[field] && !!getFieldError(field);
  };
```

Add immediately after:
```tsx
  // Step validation for mobile wizard
  const canAdvanceFromStep1 = (): boolean => {
    return !!selectedBoat && !!selectedDate && selectedDate >= getLocalISODate();
  };

  const canAdvanceFromStep2 = (): boolean => {
    return !!selectedDuration && !!preferredTime && !!numberOfPeople && parseInt(numberOfPeople) >= 1;
  };

  const canAdvanceFromStep3 = (): boolean => {
    return (
      !!firstName.trim() &&
      !!lastName.trim() &&
      !!phoneNumber.trim() &&
      /^\d+$/.test(phoneNumber.trim()) &&
      !!email.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!canAdvanceFromStep1()) {
        setTouched(prev => ({ ...prev, boat: true, date: true }));
        return;
      }
    }
    if (currentStep === 2) {
      if (!canAdvanceFromStep2()) {
        setTouched(prev => ({ ...prev, duration: true, time: true, people: true }));
        return;
      }
    }
    if (currentStep === 3) {
      if (!canAdvanceFromStep3()) {
        setTouched(prev => ({ ...prev, firstName: true, lastName: true, phone: true, email: true }));
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
```

**Step 4: Reset currentStep when modal closes**

Find the `onClose` call in `handleBookingSearch` (around line 676):
```tsx
    if (onClose) {
      onClose();
    }
```

Replace with:
```tsx
    setCurrentStep(1);
    if (onClose) {
      onClose();
    }
```

**Step 5: Commit**

```bash
git add client/src/components/BookingFormWidget.tsx
git commit -m "feat: add step navigation state for mobile wizard"
```

---

## Task 2: Create BookingWizardMobile shell with progress bar and navigation

**Files:**
- Create: `client/src/components/BookingWizardMobile.tsx`

**Step 1: Create the file with the interface and shell**

```tsx
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Boat } from "@shared/schema";
import { EXTRA_PACKS } from "@shared/boatData";

// Re-exported type from BookingFormWidget constants
interface PhonePrefix {
  code: string;
  flag: string;
  country: string;
}

interface ValidatedCode {
  type: "gift_card" | "discount";
  code: string;
  value?: number;
  percentage?: number;
}

interface ExtraItem {
  name: string;
  price: string;
  icon: string;
}

export interface BookingWizardMobileProps {
  // Navigation
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  // Personal data (step 3)
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  phonePrefix: string; setPhonePrefix: (v: string) => void;
  phoneNumber: string; setPhoneNumber: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  showPrefixDropdown: boolean; setShowPrefixDropdown: (v: boolean) => void;
  prefixSearch: string; setPrefixSearch: (v: string) => void;
  prefixDropdownRef: React.RefObject<HTMLDivElement>;
  filteredPrefixes: PhonePrefix[];
  selectedPrefixInfo: PhonePrefix | undefined;
  // Boat & schedule (steps 1+2)
  licenseFilter: "with" | "without";
  setLicenseFilter: (v: "with" | "without") => void;
  selectedBoat: string; setSelectedBoat: (v: string) => void;
  selectedDate: string; setSelectedDate: (v: string) => void;
  selectedDuration: string; setSelectedDuration: (v: string) => void;
  preferredTime: string; setPreferredTime: (v: string) => void;
  numberOfPeople: string; setNumberOfPeople: (v: string) => void;
  filteredBoats: Boat[];
  selectedBoatInfo: Boat | undefined;
  getDurationOptions: () => { value: string; label: string }[];
  getMaxCapacity: () => number;
  getLocalISODate: () => string;
  preSelectedBoatId?: string;
  timeSlots: string[];
  // Extras (step 4)
  boatExtras: ExtraItem[];
  selectedExtras: string[];
  selectedPack: string | null;
  showExtras: boolean; setShowExtras: (v: boolean) => void;
  extrasInPack: Set<string>;
  totalExtrasPrice: number;
  handlePackSelect: (packId: string) => void;
  handleExtraToggle: (extraName: string) => void;
  // Discount code (step 4)
  showCodeSection: boolean; setShowCodeSection: (v: boolean) => void;
  codeInput: string; setCodeInput: (v: string) => void;
  isValidatingCode: boolean;
  validatedCode: ValidatedCode | null;
  codeError: string;
  handleValidateCode: () => void;
  handleRemoveCode: () => void;
  getCodeDiscount: () => number;
  // Price & submit
  getBookingPrice: () => number | null;
  handleBookingSearch: () => void;
  // Validation
  showFieldError: (field: string) => boolean;
  getFieldError: (field: string) => string;
  handleBlur: (field: string) => void;
  // i18n
  t: any;
  // Icon map
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  calculatePackSavings: (packId: string) => number;
}

const STEP_LABELS = ["Barco", "Excursión", "Tus datos", "Confirmar"];

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isActive
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? "✓" : stepNum}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium ${
                  isActive ? "text-primary" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 w-8 mx-1 mb-4 transition-colors ${
                  isCompleted ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BookingWizardMobile(props: BookingWizardMobileProps) {
  const { currentStep, onNext, onBack, t, handleBookingSearch } = props;

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar - fixed at top */}
      <ProgressBar currentStep={currentStep} />

      {/* Step content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {currentStep === 1 && <Step1Boat {...props} />}
        {currentStep === 2 && <Step2Trip {...props} />}
        {currentStep === 3 && <Step3PersonalData {...props} />}
        {currentStep === 4 && <Step4Confirm {...props} />}
      </div>

      {/* Navigation - fixed at bottom */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 flex gap-3">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 py-5 text-sm font-semibold"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Atrás
          </Button>
        )}
        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={onNext}
            className="flex-1 py-5 text-sm font-semibold"
          >
            Siguiente →
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleBookingSearch}
            className="flex-1 py-5 text-sm font-semibold"
          >
            <SiWhatsapp className="w-4 h-4 mr-2" />
            Reservar por WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}

// Step components defined below in Task 3, 4, 5, 6
function Step1Boat(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 1 — coming in Task 3</div>;
}
function Step2Trip(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 2 — coming in Task 4</div>;
}
function Step3PersonalData(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 3 — coming in Task 5</div>;
}
function Step4Confirm(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 4 — coming in Task 6</div>;
}
```

**Step 2: Commit**

```bash
git add client/src/components/BookingWizardMobile.tsx
git commit -m "feat: add BookingWizardMobile shell with progress bar and navigation"
```

---

## Task 3: Implement Step 1 — Elige tu barco

**Files:**
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Step 1: Replace the Step1Boat placeholder with the real implementation**

Find:
```tsx
function Step1Boat(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 1 — coming in Task 3</div>;
}
```

Replace with:
```tsx
function Step1Boat({
  licenseFilter, setLicenseFilter,
  selectedBoat, setSelectedBoat,
  selectedDate, setSelectedDate,
  filteredBoats, selectedBoatInfo,
  preSelectedBoatId,
  getLocalISODate,
  showFieldError, getFieldError, handleBlur,
  t,
}: BookingWizardMobileProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Elige tu barco</h2>
        <p className="text-sm text-gray-500">¿Tienes licencia náutica?</p>
      </div>

      {/* License filter */}
      {!preSelectedBoatId && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLicenseFilter("without")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
              licenseFilter === "without"
                ? "border-primary bg-primary text-white"
                : "border-gray-200 text-gray-600"
            }`}
          >
            Sin licencia
          </button>
          <button
            type="button"
            onClick={() => setLicenseFilter("with")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
              licenseFilter === "with"
                ? "border-primary bg-primary text-white"
                : "border-gray-200 text-gray-600"
            }`}
          >
            Con licencia
          </button>
        </div>
      )}

      {/* Boat selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Selecciona un barco
        </label>
        <div className="space-y-2">
          {filteredBoats.map((boat) => (
            <button
              key={boat.id}
              type="button"
              onClick={() => setSelectedBoat(boat.id)}
              disabled={!!preSelectedBoatId && boat.id !== preSelectedBoatId}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                selectedBoat === boat.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedBoat === boat.id ? "border-primary bg-primary" : "border-gray-300"
              }`}>
                {selectedBoat === boat.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{boat.name}</p>
                {boat.pricing && (
                  <p className="text-xs text-primary font-medium">
                    Desde {Object.values(boat.pricing)[0]?.prices
                      ? Math.min(...Object.values(Object.values(boat.pricing)[0]?.prices || {}))
                      : "—"}€
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {boat.capacity} pers.
              </span>
            </button>
          ))}
        </div>
        {showFieldError('boat') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('boat')}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="wizard-date" className="block text-sm font-semibold text-gray-700 mb-2">
          Fecha
        </label>
        <input
          type="date"
          id="wizard-date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          onBlur={() => handleBlur('date')}
          min={getLocalISODate()}
          className={`w-full p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
            showFieldError('date') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('date') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('date')}</p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/BookingWizardMobile.tsx
git commit -m "feat: implement wizard step 1 - boat and date selection"
```

---

## Task 4: Implement Step 2 — Tu excursión

**Files:**
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Step 1: Replace the Step2Trip placeholder**

Find:
```tsx
function Step2Trip(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 2 — coming in Task 4</div>;
}
```

Replace with:
```tsx
function Step2Trip({
  selectedDuration, setSelectedDuration,
  preferredTime, setPreferredTime,
  numberOfPeople, setNumberOfPeople,
  selectedBoatInfo,
  getDurationOptions, getMaxCapacity,
  timeSlots,
  showFieldError, getFieldError, handleBlur,
  t,
}: BookingWizardMobileProps) {
  const durationOptions = getDurationOptions();
  const maxCapacity = getMaxCapacity();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tu excursión</h2>
        <p className="text-sm text-gray-500">¿Cuánto tiempo y cuántos sois?</p>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Duración
        </label>
        <div className="space-y-2">
          {durationOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedDuration(opt.value)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                selectedDuration === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="text-sm font-medium text-gray-900">{opt.label.split(' - ')[0]}</span>
              {opt.label.includes(' - ') && (
                <span className="text-xs font-bold text-primary">
                  {opt.label.split(' - ')[1]}
                </span>
              )}
            </button>
          ))}
        </div>
        {showFieldError('duration') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('duration')}</p>
        )}
      </div>

      {/* Departure time */}
      <div>
        <label htmlFor="wizard-time" className="block text-sm font-semibold text-gray-700 mb-2">
          Hora de salida
        </label>
        <select
          id="wizard-time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          onBlur={() => handleBlur('time')}
          className={`w-full p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary bg-white ${
            showFieldError('time') ? 'border-red-500' : 'border-gray-200'
          }`}
        >
          <option value="">Selecciona hora</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>{time}h</option>
          ))}
        </select>
        {showFieldError('time') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('time')}</p>
        )}
      </div>

      {/* Number of people */}
      <div>
        <label htmlFor="wizard-people" className="block text-sm font-semibold text-gray-700 mb-2">
          Número de personas
          {selectedBoatInfo && (
            <span className="font-normal text-gray-400 ml-1">(máx. {maxCapacity})</span>
          )}
        </label>
        <input
          type="number"
          id="wizard-people"
          value={numberOfPeople}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || (parseInt(val) >= 1 && parseInt(val) <= maxCapacity)) {
              setNumberOfPeople(val);
            }
          }}
          onBlur={() => handleBlur('people')}
          min={1}
          max={maxCapacity}
          placeholder={`1 - ${maxCapacity}`}
          className={`w-full p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary text-center ${
            showFieldError('people') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('people') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('people')}</p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/BookingWizardMobile.tsx
git commit -m "feat: implement wizard step 2 - duration, time and people"
```

---

## Task 5: Implement Step 3 — Tus datos

**Files:**
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Step 1: Replace the Step3PersonalData placeholder**

Find:
```tsx
function Step3PersonalData(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 3 — coming in Task 5</div>;
}
```

Replace with:
```tsx
function Step3PersonalData({
  firstName, setFirstName,
  lastName, setLastName,
  phonePrefix, setPhonePrefix,
  phoneNumber, setPhoneNumber,
  email, setEmail,
  showPrefixDropdown, setShowPrefixDropdown,
  prefixSearch, setPrefixSearch,
  prefixDropdownRef,
  filteredPrefixes,
  selectedPrefixInfo,
  showFieldError, getFieldError, handleBlur,
  t,
}: BookingWizardMobileProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tus datos</h2>
        <p className="text-sm text-gray-500">Para confirmar tu reserva por WhatsApp</p>
      </div>

      {/* First name */}
      <div>
        <label htmlFor="wizard-firstname" className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre
        </label>
        <input
          type="text"
          id="wizard-firstname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onBlur={() => handleBlur('firstName')}
          placeholder="Juan"
          autoComplete="given-name"
          className={`w-full p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
            showFieldError('firstName') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('firstName') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('firstName')}</p>
        )}
      </div>

      {/* Last name */}
      <div>
        <label htmlFor="wizard-lastname" className="block text-sm font-semibold text-gray-700 mb-1">
          Apellidos
        </label>
        <input
          type="text"
          id="wizard-lastname"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onBlur={() => handleBlur('lastName')}
          placeholder="García López"
          autoComplete="family-name"
          className={`w-full p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
            showFieldError('lastName') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('lastName') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('lastName')}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="wizard-phone" className="block text-sm font-semibold text-gray-700 mb-1">
          Teléfono
        </label>
        <div className="flex gap-2">
          <div className="relative w-28 flex-shrink-0" ref={prefixDropdownRef}>
            <button
              type="button"
              onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
              className="w-full p-3 border-2 border-gray-200 bg-white rounded-xl text-gray-900 font-medium text-sm flex items-center justify-between"
            >
              <span>{selectedPrefixInfo?.flag} {phonePrefix}</span>
            </button>
            {showPrefixDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2 border-b sticky top-0 bg-white">
                  <input
                    type="text"
                    value={prefixSearch}
                    onChange={(e) => setPrefixSearch(e.target.value)}
                    placeholder="Buscar país..."
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                {filteredPrefixes.map((prefix) => (
                  <button
                    key={`${prefix.code}-${prefix.country}`}
                    type="button"
                    onClick={() => {
                      setPhonePrefix(prefix.code);
                      setShowPrefixDropdown(false);
                      setPrefixSearch("");
                    }}
                    className="w-full p-2.5 hover:bg-gray-50 text-left flex items-center gap-2 text-sm"
                  >
                    <span>{prefix.flag}</span>
                    <span className="font-medium">{prefix.code}</span>
                    <span className="text-gray-500 text-xs truncate">{prefix.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="tel"
            id="wizard-phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onBlur={() => handleBlur('phone')}
            placeholder="612345678"
            autoComplete="tel"
            className={`flex-1 p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
              showFieldError('phone') ? 'border-red-500' : 'border-gray-200'
            }`}
          />
        </div>
        {showFieldError('phone') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('phone')}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="wizard-email" className="block text-sm font-semibold text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="wizard-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="tu@email.com"
          autoComplete="email"
          className={`w-full p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
            showFieldError('email') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('email') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('email')}</p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/BookingWizardMobile.tsx
git commit -m "feat: implement wizard step 3 - personal data fields"
```

---

## Task 6: Implement Step 4 — Extras y confirmar

**Files:**
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Step 1: Add needed imports at the top of the file (if not already present)**

Ensure these imports are at the top:
```tsx
import { Check, ChevronDown, ChevronUp, Gift, Loader2, Package, Tag, X } from "lucide-react";
```

**Step 2: Replace the Step4Confirm placeholder**

Find:
```tsx
function Step4Confirm(_props: BookingWizardMobileProps) {
  return <div className="text-gray-400 text-sm">Step 4 — coming in Task 6</div>;
}
```

Replace with:
```tsx
function Step4Confirm({
  selectedBoatInfo, selectedDate, selectedDuration, preferredTime, numberOfPeople,
  firstName, lastName,
  boatExtras, selectedExtras, selectedPack, showExtras, setShowExtras,
  extrasInPack, totalExtrasPrice, handlePackSelect, handleExtraToggle,
  showCodeSection, setShowCodeSection, codeInput, setCodeInput,
  isValidatingCode, validatedCode, codeError, handleValidateCode, handleRemoveCode,
  getCodeDiscount, getBookingPrice,
  calculatePackSavings, iconMap,
  t,
}: BookingWizardMobileProps) {
  const basePrice = getBookingPrice();
  const discount = getCodeDiscount();
  const total = basePrice !== null ? basePrice + totalExtrasPrice - discount : null;

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Confirmar reserva</h2>
        <p className="text-sm text-gray-500">Revisa los detalles y añade extras opcionales</p>
      </div>

      {/* Booking summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Barco</span>
          <span className="font-semibold text-gray-900">{selectedBoatInfo?.name || "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Fecha</span>
          <span className="font-semibold text-gray-900">{selectedDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Hora salida</span>
          <span className="font-semibold text-gray-900">{preferredTime}h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Duración</span>
          <span className="font-semibold text-gray-900">{selectedDuration}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Personas</span>
          <span className="font-semibold text-gray-900">{numberOfPeople}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Cliente</span>
          <span className="font-semibold text-gray-900">{firstName} {lastName}</span>
        </div>
        {basePrice !== null && (
          <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
            <span className="text-gray-500">Precio base</span>
            <span className="font-bold text-primary text-base">{basePrice}€</span>
          </div>
        )}
      </div>

      {/* Extras section (optional) */}
      {boatExtras.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-800 bg-gray-50"
          >
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Extras y Packs
              {(selectedExtras.length > 0 || selectedPack) && (
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                  {totalExtrasPrice}€
                </span>
              )}
            </span>
            {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showExtras && (
            <div className="p-4 space-y-4 bg-white">
              {/* Packs */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Packs con descuento</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { handlePackSelect(""); }}
                    className={`w-full p-3 rounded-xl border-2 text-left text-sm transition-all ${!selectedPack ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                  >
                    Sin pack
                  </button>
                  {EXTRA_PACKS.map((pack) => {
                    const isSelected = selectedPack === pack.id;
                    const savings = calculatePackSavings(pack.id);
                    const IconComp = iconMap[pack.icon] || Package;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => handlePackSelect(pack.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">{pack.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary">{pack.price}€</span>
                            {savings > 0 && (
                              <span className="block text-[10px] text-green-600">Ahorras {savings.toFixed(0)}€</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Individual extras */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Extras individuales</p>
                <div className="grid grid-cols-2 gap-2">
                  {boatExtras.map((extra) => {
                    const isChecked = selectedExtras.includes(extra.name);
                    const isInPack = extrasInPack.has(extra.name);
                    const IconComp = iconMap[extra.icon] || Package;
                    return (
                      <button
                        key={extra.name}
                        type="button"
                        onClick={() => handleExtraToggle(extra.name)}
                        disabled={isInPack}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                          isInPack ? 'border-primary/40 bg-primary/10 opacity-75 cursor-not-allowed'
                          : isChecked ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${(isChecked || isInPack) ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {(isChecked || isInPack) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{extra.name}</p>
                          <p className="text-[10px] text-gray-500">{isInPack ? 'En pack' : extra.price}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discount code */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCodeSection(!showCodeSection)}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-800 bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            {t.codeValidation.haveCode}
            {validatedCode && (
              <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">Aplicado</span>
            )}
          </span>
          {showCodeSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showCodeSection && (
          <div className="p-4 bg-white">
            {!validatedCode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); }}
                    placeholder={t.codeValidation.enterCode}
                    className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-sm font-mono uppercase tracking-wider"
                    disabled={isValidatingCode}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleValidateCode}
                    disabled={isValidatingCode || !codeInput.trim()}
                    className="px-4 py-3 h-auto"
                  >
                    {isValidatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
                {codeError && <p className="text-xs text-red-500">{codeError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  {validatedCode.type === "gift_card" ? <Gift className="w-4 h-4 text-green-600" /> : <Tag className="w-4 h-4 text-green-600" />}
                  <div>
                    <p className="text-xs font-semibold text-green-700">
                      {validatedCode.type === "gift_card" ? t.codeValidation.validGiftCard : t.codeValidation.validDiscount}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono">{validatedCode.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-600">
                    {validatedCode.type === "gift_card" ? `-${discount}€` : `-${validatedCode.percentage}%`}
                  </span>
                  <button type="button" onClick={handleRemoveCode} className="text-gray-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Total price */}
      {total !== null && (
        <div className="bg-primary rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium opacity-90">Total estimado</span>
            <span className="text-2xl font-bold">{total}€</span>
          </div>
          {discount > 0 && (
            <p className="text-xs opacity-75 mt-1">Descuento aplicado: -{discount}€</p>
          )}
          <p className="text-xs opacity-60 mt-1">El precio final se confirma por WhatsApp</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/BookingWizardMobile.tsx
git commit -m "feat: implement wizard step 4 - extras, discount code and price summary"
```

---

## Task 7: Wire BookingFormWidget to use the wizard on mobile

**Files:**
- Modify: `client/src/components/BookingFormWidget.tsx`

**Step 1: Import BookingWizardMobile and TIME_SLOTS at the top**

After the existing imports, add:
```tsx
import BookingWizardMobile from "@/components/BookingWizardMobile";
```

Also find the `TIME_SLOTS` constant (around line 83) — it's already defined in the file. We need to pass it as a prop.

**Step 2: Add the mobile render branch at the start of the return statement**

Find the current return:
```tsx
  return (
    <Card id="booking-form" className="bg-white/75 backdrop-blur-md p-3 sm:p-4 w-full shadow-2xl border-0">
```

Add the mobile branch BEFORE it (so it reads: if mobile render wizard, else render existing card):

```tsx
  if (isMobile) {
    return (
      <BookingWizardMobile
        // Navigation
        currentStep={currentStep}
        onNext={handleNextStep}
        onBack={handlePrevStep}
        // Personal data
        firstName={firstName} setFirstName={setFirstName}
        lastName={lastName} setLastName={setLastName}
        phonePrefix={phonePrefix} setPhonePrefix={setPhonePrefix}
        phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
        email={email} setEmail={setEmail}
        showPrefixDropdown={showPrefixDropdown} setShowPrefixDropdown={setShowPrefixDropdown}
        prefixSearch={prefixSearch} setPrefixSearch={setPrefixSearch}
        prefixDropdownRef={prefixDropdownRef}
        filteredPrefixes={filteredPrefixes}
        selectedPrefixInfo={selectedPrefixInfo}
        // Boat & schedule
        licenseFilter={licenseFilter} setLicenseFilter={setLicenseFilter}
        selectedBoat={selectedBoat} setSelectedBoat={setSelectedBoat}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        selectedDuration={selectedDuration} setSelectedDuration={setSelectedDuration}
        preferredTime={preferredTime} setPreferredTime={setPreferredTime}
        numberOfPeople={numberOfPeople} setNumberOfPeople={setNumberOfPeople}
        filteredBoats={filteredBoats}
        selectedBoatInfo={selectedBoatInfo}
        getDurationOptions={getDurationOptions}
        getMaxCapacity={getMaxCapacity}
        getLocalISODate={getLocalISODate}
        preSelectedBoatId={preSelectedBoatId}
        timeSlots={TIME_SLOTS}
        // Extras
        boatExtras={boatExtras}
        selectedExtras={selectedExtras}
        selectedPack={selectedPack}
        showExtras={showExtras} setShowExtras={setShowExtras}
        extrasInPack={extrasInPack}
        totalExtrasPrice={totalExtrasPrice}
        handlePackSelect={handlePackSelect}
        handleExtraToggle={handleExtraToggle}
        // Discount code
        showCodeSection={showCodeSection} setShowCodeSection={setShowCodeSection}
        codeInput={codeInput} setCodeInput={setCodeInput}
        isValidatingCode={isValidatingCode}
        validatedCode={validatedCode}
        codeError={codeError}
        handleValidateCode={handleValidateCode}
        handleRemoveCode={handleRemoveCode}
        getCodeDiscount={getCodeDiscount}
        // Price & submit
        getBookingPrice={getBookingPrice}
        handleBookingSearch={handleBookingSearch}
        // Validation
        showFieldError={showFieldError}
        getFieldError={getFieldError}
        handleBlur={handleBlur}
        // i18n
        t={t}
        // Icon map
        iconMap={ICON_MAP}
        calculatePackSavings={calculatePackSavings}
      />
    );
  }

  return (
    <Card id="booking-form" ...>
```

**Step 3: Fix the handlePackSelect to handle empty string (no-pack deselect from wizard)**

In the wizard's Step4, when clicking "Sin pack", it calls `handlePackSelect("")`. Find the original handler:

```tsx
  const handlePackSelect = (packId: string) => {
    if (selectedPack === packId) {
```

Add a guard at the top:
```tsx
  const handlePackSelect = (packId: string) => {
    if (!packId) {
      setSelectedPack(null);
      setSelectedExtras([]);
      return;
    }
    if (selectedPack === packId) {
```

**Step 4: Run the TypeScript check**

```bash
npm run check
```

Fix any TypeScript errors that appear before committing.

**Step 5: Commit**

```bash
git add client/src/components/BookingFormWidget.tsx
git commit -m "feat: wire mobile wizard into BookingFormWidget - mobile users now see step-by-step flow"
```

---

## Task 8: Manual QA checklist

Open http://localhost:5000 in browser DevTools, set viewport to 375px (iPhone SE).

- [ ] Opening the booking modal shows the wizard (not the full form)
- [ ] Progress bar shows 4 steps, step 1 highlighted
- [ ] Step 1: Can select boat and date. "Siguiente" advances to step 2.
- [ ] Step 1: Cannot advance without selecting boat (shows error)
- [ ] Step 2: Can select duration, time, people. "Siguiente" advances to step 3.
- [ ] Step 2: "Atrás" returns to step 1 (preserving selections)
- [ ] Step 3: Can fill personal data. "Siguiente" advances to step 4.
- [ ] Step 3: Shows validation errors for empty/invalid fields
- [ ] Step 4: Summary shows all selections from previous steps
- [ ] Step 4: Extras panel expands/collapses
- [ ] Step 4: Discount code validates correctly
- [ ] Step 4: Price total updates when extras are added
- [ ] Step 4: "Reservar por WhatsApp" sends full booking message and closes modal
- [ ] On desktop (>768px viewport): full form still appears, wizard not shown

**If all checks pass:**

```bash
git add .
git commit -m "feat: booking wizard mobile - QA passed, complete mobile step-by-step booking flow"
```
