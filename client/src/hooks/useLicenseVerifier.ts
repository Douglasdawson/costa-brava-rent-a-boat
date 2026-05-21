import { useCallback, useMemo, useState } from "react";
import {
  verifyLicense,
  findLicense,
  type LicenseVerificationStatus,
  type SpanishLicenseLevel,
} from "@shared/nauticalLicenseRules";

export interface LicenseVerifierState {
  country: string;                              // ISO-2, "" if unset
  licenseCode: string;                          // curated catalogue code, "" if unset
  hasIcc: boolean | null;                       // null = not asked / not applicable
  status: LicenseVerificationStatus | null;
  spanishEquivalent: SpanishLicenseLevel | null;
  meetsFleetMinimum: boolean;
  /** User explicitly skipped — prevents auto-reopen behaviour. */
  dismissed: boolean;
}

export interface UseLicenseVerifierResult {
  state: LicenseVerifierState;
  isVerified: boolean;
  setCountry: (iso2: string) => void;
  setLicenseCode: (code: string) => void;
  setHasIcc: (v: boolean | null) => void;
  /** Computes status without committing to state. */
  preview: () => LicenseVerificationStatus | null;
  /** Commits the inputs into a verified result. */
  verify: () => LicenseVerificationStatus;
  /** Clears the verification but keeps the inputs (used by "Cambiar"). */
  resetStatus: () => void;
  dismiss: () => void;
  undismiss: () => void;
  /** Replaces the entire state (sessionStorage restore). */
  hydrate: (partial: Partial<LicenseVerifierState>) => void;
}

const EMPTY: LicenseVerifierState = {
  country: "",
  licenseCode: "",
  hasIcc: null,
  status: null,
  spanishEquivalent: null,
  meetsFleetMinimum: false,
  dismissed: false,
};

export function useLicenseVerifier(initial?: Partial<LicenseVerifierState>): UseLicenseVerifierResult {
  const [state, setState] = useState<LicenseVerifierState>({ ...EMPTY, ...initial });

  const setCountry = useCallback((iso2: string) => {
    setState((s) => {
      const upper = iso2.toUpperCase();
      // Reset license code if the previous selection is not offered for the
      // newly chosen country.
      const prev = s.licenseCode;
      const stillValid = !!prev && !!findLicense(upper, prev);
      return {
        ...s,
        country: upper,
        licenseCode: stillValid ? prev : "",
        status: null,
        spanishEquivalent: null,
        meetsFleetMinimum: false,
      };
    });
  }, []);

  const setLicenseCode = useCallback((code: string) => {
    setState((s) => ({ ...s, licenseCode: code, status: null, spanishEquivalent: null, meetsFleetMinimum: false }));
  }, []);

  const setHasIcc = useCallback((v: boolean | null) => {
    setState((s) => ({ ...s, hasIcc: v, status: null, spanishEquivalent: null, meetsFleetMinimum: false }));
  }, []);

  const preview = useCallback((): LicenseVerificationStatus | null => {
    if (!state.country || !state.licenseCode) return null;
    return verifyLicense({
      country: state.country,
      hasIcc: state.hasIcc,
      licenseCode: state.licenseCode,
    }).status;
  }, [state]);

  const verify = useCallback((): LicenseVerificationStatus => {
    const result = verifyLicense({
      country: state.country,
      hasIcc: state.hasIcc,
      licenseCode: state.licenseCode,
    });
    setState((s) => ({
      ...s,
      status: result.status,
      spanishEquivalent: result.spanishEquivalent,
      meetsFleetMinimum: result.meetsFleetMinimum,
    }));
    return result.status;
  }, [state]);

  const resetStatus = useCallback(() => {
    setState((s) => ({ ...s, status: null, spanishEquivalent: null, meetsFleetMinimum: false }));
  }, []);

  const dismiss = useCallback(() => {
    setState((s) => ({ ...s, dismissed: true }));
  }, []);

  const undismiss = useCallback(() => {
    setState((s) => ({ ...s, dismissed: false }));
  }, []);

  const hydrate = useCallback((partial: Partial<LicenseVerifierState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const isVerified = useMemo(() => state.status !== null, [state.status]);

  return {
    state,
    isVerified,
    setCountry,
    setLicenseCode,
    setHasIcc,
    preview,
    verify,
    resetStatus,
    dismiss,
    undismiss,
    hydrate,
  };
}
