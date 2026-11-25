import { useState } from "react";
import { CalendarIcon, CheckCircle, ChevronDown, Minus, Plus, Users } from "lucide-react";
import type { Locale } from "date-fns";
import { ca } from "date-fns/locale/ca";
import { de } from "date-fns/locale/de";
import { enGB } from "date-fns/locale/en-GB";
import { es } from "date-fns/locale/es";
import { fr } from "date-fns/locale/fr";
import { it } from "date-fns/locale/it";
import { nl } from "date-fns/locale/nl";
import { ru } from "date-fns/locale/ru";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { getLocaleForLanguage } from "@/utils/intl-helpers";
import type { Translations } from "@/lib/translations";

interface StepWhenWhoProps {
  selectedDate: string;
  onDateSelectFromUser: (date: string) => void;
  getLocalISODate: () => string;
  nextSaturdayISO?: string | null;
  numberOfPeople: string;
  setNumberOfPeople: (value: string) => void;
  showFieldError: (field: string) => boolean;
  getFieldError: (field: string) => string | undefined;
  handleBlur: (field: string) => void;
  language: string;
  t: Translations;
}

// DayPicker would otherwise render month and weekday names in English.
const DAY_PICKER_LOCALES: Record<string, Locale> = { es, en: enGB, ca, fr, de, nl, it, ru };

const PEOPLE_CAP = 12; // fleet maximum; narrowed to the boat's capacity in the next step

const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const SUGGESTION_CHIP =
  "mt-2 inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none";

/**
 * Step 1 (desktop and mobile share it). Phones get a date pill that opens the calendar, so the step is about
 * 340px tall and fits any screen without scrolling; desktop shows the month inline next to the group size.
 */
export default function StepWhenWho({
  selectedDate,
  onDateSelectFromUser,
  getLocalISODate,
  nextSaturdayISO,
  numberOfPeople,
  setNumberOfPeople,
  showFieldError,
  getFieldError,
  handleBlur,
  language,
  t,
}: StepWhenWhoProps) {
  const isMobile = useIsMobile();
  const [pickerOpen, setPickerOpen] = useState(false);
  const locale = getLocaleForLanguage(language);
  const people = parseInt(numberOfPeople || "1");

  // "sábado, 28 de noviembre": only the first letter is capitalised (CSS `capitalize` would turn "de" into "De").
  const longDate = (iso: string) => {
    const text = new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
  };

  const setPeople = (next: number) => {
    setNumberOfPeople(String(next));
    handleBlur("people");
  };

  // `fluid` stretches the month to its container (the phone popover matches the width of the date pill);
  // otherwise the grid keeps fixed 44px cells next to the group size on desktop.
  const renderCalendar = (fluid: boolean) => (
    <Calendar
      mode="single"
      locale={DAY_PICKER_LOCALES[language] ?? es}
      weekStartsOn={1}
      selected={selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined}
      defaultMonth={selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined}
      onSelect={date => {
        if (date) onDateSelectFromUser(toISO(date));
        handleBlur("date");
        setPickerOpen(false);
      }}
      disabled={date => date < new Date(`${getLocalISODate()}T00:00:00`)}
      classNames={{
        head_row: "flex w-full",
        head_cell: cn(
          "rounded-md text-[0.8rem] font-normal text-muted-foreground",
          fluid ? "flex-1" : "w-10 sm:w-11"
        ),
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          fluid ? "flex h-11 flex-1 items-center justify-center" : "h-10 w-10 sm:h-11 sm:w-11"
        ),
        day: cn(
          "rounded-full p-0 font-normal transition-colors hover:bg-muted aria-selected:opacity-100",
          fluid ? "size-11" : "h-10 w-10 sm:h-11 sm:w-11"
        ),
        row: "mt-1 flex w-full",
        day_selected:
          "bg-cta text-primary-foreground hover:bg-cta hover:text-primary-foreground focus:bg-cta focus:text-primary-foreground dark:text-background",
        day_today: "font-semibold text-foreground ring-1 ring-inset ring-border",
      }}
    />
  );

  const dateError = showFieldError("date") && (
    <p id="error-date" className="mt-1.5 text-xs text-destructive">
      {getFieldError("date")}
    </p>
  );

  const peopleField = (
    <div id="field-people">
      <p className="text-sm font-medium text-muted-foreground">{t.wizard.numberOfPeople}</p>
      <div
        className={`mt-2 flex items-center justify-between rounded-full bg-muted/60 p-1.5 ${
          showFieldError("people") ? "ring-2 ring-destructive" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => people > 1 && setPeople(people - 1)}
          disabled={people <= 1}
          aria-label={t.a11y.decreasePeople}
          className="flex size-12 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-card disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>
        <p
          className="flex items-center gap-2 font-heading text-3xl font-semibold leading-none text-foreground tabular-nums"
          aria-live="polite"
        >
          <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          {people}
        </p>
        <button
          type="button"
          onClick={() => people < PEOPLE_CAP && setPeople(people + 1)}
          disabled={people >= PEOPLE_CAP}
          aria-label={t.a11y.increasePeople}
          className="flex size-12 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-card disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {showFieldError("people") && (
        <p id="error-people" className="mt-1.5 text-xs text-destructive">
          {getFieldError("people")}
        </p>
      )}
    </div>
  );

  const suggestion =
    !selectedDate && nextSaturdayISO ? (
      <button
        type="button"
        onClick={() => onDateSelectFromUser(nextSaturdayISO)}
        className={SUGGESTION_CHIP}
      >
        {longDate(nextSaturdayISO)}
      </button>
    ) : null;

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {t.bookingWizard?.steps?.whenWho || "Cuándo y cuántos sois"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-balance">
          {t.bookingWizard?.hints?.pricesNextStep ||
            "En el siguiente paso verás precios reales para tu fecha."}
        </p>
      </div>

      {isMobile ? (
        <div className="space-y-5">
          <div id="field-date">
            <p className="text-sm font-medium text-muted-foreground">{t.wizard.date}</p>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onBlur={() => handleBlur("date")}
                  aria-describedby={showFieldError("date") ? "error-date" : undefined}
                  className={`mt-2 flex h-14 w-full items-center gap-3 rounded-full bg-muted/60 px-5 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none ${
                    showFieldError("date") ? "ring-2 ring-destructive" : ""
                  }`}
                >
                  <CalendarIcon
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span
                    className={`min-w-0 flex-1 truncate font-heading text-lg font-semibold ${
                      selectedDate ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {selectedDate ? longDate(selectedDate) : t.wizard.selectDate}
                  </span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] max-w-none rounded-3xl p-1"
                align="center"
              >
                {renderCalendar(true)}
              </PopoverContent>
            </Popover>
            {suggestion}
            {dateError}
          </div>
          {peopleField}
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
          <div id="field-date" className="w-fit rounded-3xl border border-border bg-card">
            {renderCalendar(false)}
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t.wizard.date}</p>
              {selectedDate ? (
                <p className="mt-1 font-heading text-xl font-semibold leading-tight text-foreground">
                  {longDate(selectedDate)}
                </p>
              ) : (
                <p className="mt-1 text-base text-muted-foreground">{t.wizard.selectDate}</p>
              )}
              {suggestion}
              {dateError}
            </div>
            {peopleField}
          </div>
        </div>
      )}

      {/* Reassurance, quiet: it was a green banner stacked above the title and competed with it. */}
      <div className="space-y-1.5 text-center text-xs text-muted-foreground [@media(max-height:620px)]:hidden">
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="inline-flex items-start gap-1 leading-4">
            <CheckCircle className="mt-px h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
            {t.bookingTrust?.insuranceIncluded || "Seguro incluido"}
          </span>
          <span className="inline-flex items-start gap-1 leading-4">
            <CheckCircle className="mt-px h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
            {t.bookingTrust?.replyTime || "Respondemos en <2h por WhatsApp"}
          </span>
        </p>
        <p>
          {t.bookingWizard?.hints?.noOnlinePayment ||
            "Sin pago online: te confirmamos por WhatsApp"}
        </p>
      </div>
    </div>
  );
}
