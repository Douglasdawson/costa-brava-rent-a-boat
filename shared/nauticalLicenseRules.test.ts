import { describe, it, expect } from "vitest";
import {
  verifyLicense,
  getLicensesForCountry,
  findLicense,
  isEeeCountry,
  isIccIssuingCountry,
  getDefaultCountryForLanguage,
  EEE_COUNTRIES,
  ICC_ISSUING_COUNTRIES,
  COUNTRY_LICENSES,
  GENERIC_LICENSES,
  FLEET_MIN_LICENSE,
} from "./nauticalLicenseRules";

describe("isEeeCountry", () => {
  it("returns true for Spain", () => {
    expect(isEeeCountry("ES")).toBe(true);
  });
  it("returns true for Norway (EEA non-EU)", () => {
    expect(isEeeCountry("NO")).toBe(true);
  });
  it("returns false for the UK (post-Brexit, not EEA)", () => {
    expect(isEeeCountry("GB")).toBe(false);
  });
  it("returns false for the USA", () => {
    expect(isEeeCountry("US")).toBe(false);
  });
});

describe("isIccIssuingCountry", () => {
  it("returns true for the UK", () => {
    expect(isIccIssuingCountry("GB")).toBe(true);
  });
  it("returns true for Switzerland", () => {
    expect(isIccIssuingCountry("CH")).toBe(true);
  });
  it("returns false for an EEA country", () => {
    expect(isIccIssuingCountry("DE")).toBe(false);
  });
  it("returns false for the USA", () => {
    expect(isIccIssuingCountry("US")).toBe(false);
  });
});

describe("getLicensesForCountry", () => {
  it("France returns Permis Côtier and Permis Hauturier", () => {
    const list = getLicensesForCountry("FR");
    expect(list.map((l) => l.code)).toEqual(["permis_cotier", "permis_hauturier"]);
    expect(list[0].spanishEquivalent).toBe("pnb");
    expect(list[1].spanishEquivalent).toBe("per");
  });

  it("Germany returns the 5 Sportbootführerschein levels", () => {
    const list = getLicensesForCountry("DE");
    expect(list.map((l) => l.code)).toEqual(["sbf_binnen", "sbf_see", "sks", "sss", "shs"]);
    expect(list[0].spanishEquivalent).toBe(null); // SBF Binnen — inland only
    expect(list[4].spanishEquivalent).toBe("capitan_yate"); // SHS
  });

  it("UK includes ICC explicitly", () => {
    const list = getLicensesForCountry("GB");
    const icc = list.find((l) => l.code === "icc");
    expect(icc).toBeDefined();
    expect(icc?.spanishEquivalent).toBe("per");
  });

  it("USA (non-curated) falls back to GENERIC_LICENSES", () => {
    expect(getLicensesForCountry("US")).toBe(GENERIC_LICENSES);
  });

  it("lowercase iso code is normalised", () => {
    expect(getLicensesForCountry("fr").map((l) => l.code)).toEqual(["permis_cotier", "permis_hauturier"]);
  });
});

describe("findLicense", () => {
  it("finds Permis Côtier by FR/permis_cotier", () => {
    const lic = findLicense("FR", "permis_cotier");
    expect(lic?.label).toBe("Permis Côtier");
  });

  it("returns undefined for non-existent code in curated country", () => {
    expect(findLicense("FR", "made_up_code")).toBeUndefined();
  });

  it("finds generic ICC for non-curated country", () => {
    expect(findLicense("US", "icc")?.spanishEquivalent).toBe("per");
  });

  it("returns undefined for empty license code", () => {
    expect(findLicense("FR", "")).toBeUndefined();
  });
});

describe("verifyLicense — EEE branch", () => {
  it("Spain + PNB → valid, equivalent pnb, meets fleet min", () => {
    expect(verifyLicense({ country: "ES", licenseCode: "pnb", hasIcc: null }))
      .toEqual({ status: "valid", reasonKey: "eee_equivalent_sufficient", spanishEquivalent: "pnb", meetsFleetMinimum: true });
  });

  it("France + Permis Côtier → valid, equivalent pnb", () => {
    const r = verifyLicense({ country: "FR", licenseCode: "permis_cotier", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("pnb");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("France + Permis Hauturier → valid, equivalent per", () => {
    const r = verifyLicense({ country: "FR", licenseCode: "permis_hauturier", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("per");
  });

  it("Italy + Patente entro 12 miglia → valid, pnb", () => {
    expect(verifyLicense({ country: "IT", licenseCode: "patente_12m", hasIcc: null }).spanishEquivalent)
      .toBe("pnb");
  });

  it("Germany + SBF See → valid, pnb", () => {
    expect(verifyLicense({ country: "DE", licenseCode: "sbf_see", hasIcc: null }).status)
      .toBe("valid");
  });

  it("Germany + SHS → valid, capitan_yate", () => {
    expect(verifyLicense({ country: "DE", licenseCode: "shs", hasIcc: null }).spanishEquivalent)
      .toBe("capitan_yate");
  });

  it("EEE country + unknown code → not_recognized", () => {
    expect(verifyLicense({ country: "FR", licenseCode: "made_up", hasIcc: null }).status)
      .toBe("not_recognized");
  });

  it("Spain + LN → valid (LN meets fleet minimum per business policy)", () => {
    const r = verifyLicense({ country: "ES", licenseCode: "ln", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("navegacion");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("Germany + SSS → valid, patron_yate", () => {
    const r = verifyLicense({ country: "DE", licenseCode: "sss", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("patron_yate");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("Germany + SBF Binnen → inland_only (valid inland, no sea authorisation)", () => {
    const r = verifyLicense({ country: "DE", licenseCode: "sbf_binnen", hasIcc: null });
    expect(r.status).toBe("inland_only");
    expect(r.reasonKey).toBe("inland_only_license");
    expect(r.spanishEquivalent).toBe(null);
    expect(r.meetsFleetMinimum).toBe(false);
  });

  it("Netherlands + Klein Vaarbewijs I → inland_only", () => {
    const r = verifyLicense({ country: "NL", licenseCode: "klein_vaarbewijs_1", hasIcc: null });
    expect(r.status).toBe("inland_only");
    expect(r.reasonKey).toBe("inland_only_license");
    expect(r.spanishEquivalent).toBe(null);
  });

  it("Belgium + Yachtnavigator Brevet → valid, capitan_yate", () => {
    const r = verifyLicense({ country: "BE", licenseCode: "yachtnavigator_brevet", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("capitan_yate");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("Poland + Sternik motorowodny → valid, pnb, meets fleet min", () => {
    const r = verifyLicense({ country: "PL", licenseCode: "sternik_motorowodny", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("pnb");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("Poland + Morski sternik motorowodny → valid, per", () => {
    const r = verifyLicense({ country: "PL", licenseCode: "morski_sternik_motorowodny", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("per");
  });

  it("Poland + Kapitan motorowodny → valid, patron_yate", () => {
    expect(verifyLicense({ country: "PL", licenseCode: "kapitan_motorowodny", hasIcc: null }).spanishEquivalent)
      .toBe("patron_yate");
  });

  it("EEE uncurated country + Otra → probably_valid (EEE reciprocity, manual check), not rejected", () => {
    const r = verifyLicense({ country: "EE", licenseCode: "other", hasIcc: null });
    expect(r.status).toBe("probably_valid");
    expect(r.reasonKey).toBe("eee_other_manual_check");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("EEE uncurated country + ICC → valid, per", () => {
    const r = verifyLicense({ country: "EE", licenseCode: "icc", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("per");
  });

  it("EEE country + truly unknown code (not 'other') → still not_recognized", () => {
    expect(verifyLicense({ country: "FR", licenseCode: "made_up", hasIcc: null }).status)
      .toBe("not_recognized");
  });

  it("Austria + FB1 → valid, pnb; FB2 → per; FB3 → patron_yate", () => {
    expect(verifyLicense({ country: "AT", licenseCode: "fb1", hasIcc: null }).spanishEquivalent).toBe("pnb");
    expect(verifyLicense({ country: "AT", licenseCode: "fb2", hasIcc: null }).spanishEquivalent).toBe("per");
    const r = verifyLicense({ country: "AT", licenseCode: "fb3", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("patron_yate");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("Croatia + Voditelj brodice A → valid, pnb; B → per", () => {
    expect(verifyLicense({ country: "HR", licenseCode: "voditelj_brodice_a", hasIcc: null }).spanishEquivalent).toBe("pnb");
    const r = verifyLicense({ country: "HR", licenseCode: "voditelj_brodice_b", hasIcc: null });
    expect(r.status).toBe("valid");
    expect(r.spanishEquivalent).toBe("per");
    expect(r.meetsFleetMinimum).toBe(true);
  });
});

describe("verifyLicense — non-EEE branch", () => {
  it("UK + ICC → probably_valid, equivalent per", () => {
    const r = verifyLicense({ country: "GB", licenseCode: "icc", hasIcc: true });
    expect(r.status).toBe("probably_valid");
    expect(r.spanishEquivalent).toBe("per");
    expect(r.meetsFleetMinimum).toBe(true);
  });

  it("UK + ICC code without hasIcc flag still counts as ICC", () => {
    expect(verifyLicense({ country: "GB", licenseCode: "icc", hasIcc: null }).status)
      .toBe("probably_valid");
  });

  it("UK + RYA Yachtmaster + ICC=true → probably_valid, capitan_yate", () => {
    const r = verifyLicense({ country: "GB", licenseCode: "rya_yachtmaster", hasIcc: true });
    expect(r.status).toBe("probably_valid");
    expect(r.spanishEquivalent).toBe("capitan_yate");
  });

  it("UK + RYA Powerboat 2 + ICC=No → needs_icc (ICC issuing country)", () => {
    const r = verifyLicense({ country: "GB", licenseCode: "rya_powerboat_2", hasIcc: false });
    expect(r.status).toBe("needs_icc");
    expect(r.spanishEquivalent).toBe("pnb");
  });

  it("USA + ICC chip → probably_valid, equivalent per", () => {
    const r = verifyLicense({ country: "US", licenseCode: "icc", hasIcc: null });
    expect(r.status).toBe("probably_valid");
    expect(r.spanishEquivalent).toBe("per");
  });

  it("USA + other + ICC=true → probably_valid (declared), per fallback", () => {
    const r = verifyLicense({ country: "US", licenseCode: "other", hasIcc: true });
    expect(r.status).toBe("probably_valid");
    expect(r.spanishEquivalent).toBe("per");
  });

  it("USA + other + ICC=false → not_recognized", () => {
    expect(verifyLicense({ country: "US", licenseCode: "other", hasIcc: false }).status)
      .toBe("not_recognized");
  });

  it("Australia (ICC-issuing, non-curated) + other + ICC=false → needs_icc", () => {
    const r = verifyLicense({ country: "AU", licenseCode: "other", hasIcc: false });
    expect(r.status).toBe("needs_icc");
  });

  it("Switzerland (ICC-issuing) + other + ICC=false → needs_icc", () => {
    expect(verifyLicense({ country: "CH", licenseCode: "other", hasIcc: false }).status)
      .toBe("needs_icc");
  });
});

describe("verifyLicense — missing input", () => {
  it("empty country → unknown", () => {
    expect(verifyLicense({ country: "", licenseCode: "pnb", hasIcc: null }).status)
      .toBe("unknown");
  });
});

describe("getDefaultCountryForLanguage", () => {
  it("es → ES", () => expect(getDefaultCountryForLanguage("es")).toBe("ES"));
  it("ca → ES (catalan community lives in Spain)", () =>
    expect(getDefaultCountryForLanguage("ca")).toBe("ES"));
  it("en → GB (top tourism origin, curated catalogue)", () =>
    expect(getDefaultCountryForLanguage("en")).toBe("GB"));
  it("fr → FR", () => expect(getDefaultCountryForLanguage("fr")).toBe("FR"));
  it("de → DE", () => expect(getDefaultCountryForLanguage("de")).toBe("DE"));
  it("nl → NL", () => expect(getDefaultCountryForLanguage("nl")).toBe("NL"));
  it("it → IT", () => expect(getDefaultCountryForLanguage("it")).toBe("IT"));
  it("ru → RU", () => expect(getDefaultCountryForLanguage("ru")).toBe("RU"));
  it("unknown language → empty string", () =>
    expect(getDefaultCountryForLanguage("jp")).toBe(""));
  it("uppercase input is normalised", () =>
    expect(getDefaultCountryForLanguage("EN")).toBe("GB"));
  it("empty input → empty string", () =>
    expect(getDefaultCountryForLanguage("")).toBe(""));
});

describe("FLEET_MIN_LICENSE invariant", () => {
  it("is navegacion (LN suffices per business policy — RD 875/2014 art. 11.1)", () => {
    expect(FLEET_MIN_LICENSE).toBe("navegacion");
  });
});

describe("country list invariants", () => {
  it("EEE and ICC-issuing lists are disjoint", () => {
    const eee = new Set(EEE_COUNTRIES as readonly string[]);
    for (const c of ICC_ISSUING_COUNTRIES) {
      expect(eee.has(c)).toBe(false);
    }
  });

  it("Every COUNTRY_LICENSES key is a 2-letter uppercase ISO code", () => {
    for (const k of Object.keys(COUNTRY_LICENSES)) {
      expect(k).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("All curated licenses have non-empty codes and labels", () => {
    for (const [, list] of Object.entries(COUNTRY_LICENSES)) {
      for (const lic of list) {
        expect(lic.code.length).toBeGreaterThan(0);
        expect(lic.label.length).toBeGreaterThan(0);
      }
    }
  });
});
