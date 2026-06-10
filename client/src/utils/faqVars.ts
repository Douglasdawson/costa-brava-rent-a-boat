// Moved to shared/faqVars.ts so server/seoInjector.ts can build the full SSR
// FAQPage JSON-LD with identical interpolation. This shim keeps the original
// import path working for all client consumers.
export * from "@shared/faqVars";
