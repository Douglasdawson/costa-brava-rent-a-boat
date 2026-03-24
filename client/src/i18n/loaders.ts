export const langLoaders: Record<string, () => Promise<Record<string, any>>> = {
  ca: () => import('./ca').then(m => m.ca),
  en: () => import('./en').then(m => m.en),
  fr: () => import('./fr').then(m => m.fr),
  de: () => import('./de').then(m => m.de),
  nl: () => import('./nl').then(m => m.nl),
  it: () => import('./it').then(m => m.it),
  ru: () => import('./ru').then(m => m.ru),
};
