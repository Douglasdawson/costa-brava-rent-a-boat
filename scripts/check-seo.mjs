#!/usr/bin/env node

/**
 * SEO Validation Script
 * 
 * Verifies SEO implementation for Costa Brava Rent a Boat:
 * - Canonical URLs point to costabravarentaboat.app
 * - Hreflang tags include 8 languages + x-default
 * - JSON-LD schemas present (BreadcrumbList, Product, FAQPage, etc.)
 * - Meta descriptions under 160 characters
 * - HTTPS enforcement on canonical domain
 * 
 * Usage: node scripts/check-seo.mjs [url]
 * Example: node scripts/check-seo.mjs https://costabravarentaboat.app
 */

import { JSDOM } from 'jsdom';
import https from 'https';
import http from 'http';

const CANONICAL_DOMAIN = 'costabravarentaboat.app';
const REQUIRED_LANGUAGES = ['es', 'en', 'ca', 'fr', 'de', 'nl', 'it', 'ru'];
const MAX_META_DESC_LENGTH = 160;

// Pages to check
const PAGES_TO_CHECK = [
  '/',
  '/es',
  '/en',
  '/fleet',
  '/contact',
  '/blog',
  '/destinations'
];

/**
 * Fetch HTML from URL
 */
async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, { 
      headers: { 'User-Agent': 'SEO-Validator/1.0' },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ html: data, statusCode: res.statusCode }));
    }).on('error', reject);
  });
}

/**
 * Check canonical URL
 */
function checkCanonical(dom, url) {
  const canonical = dom.window.document.querySelector('link[rel="canonical"]');
  const errors = [];
  
  if (!canonical) {
    errors.push('❌ Missing canonical tag');
  } else {
    const href = canonical.getAttribute('href');
    if (!href) {
      errors.push('❌ Canonical tag has no href');
    } else if (!href.includes(CANONICAL_DOMAIN)) {
      errors.push(`❌ Canonical doesn't point to ${CANONICAL_DOMAIN}: ${href}`);
    } else if (!href.startsWith('https://')) {
      errors.push(`❌ Canonical is not HTTPS: ${href}`);
    } else {
      console.log(`  ✅ Canonical: ${href}`);
    }
  }
  
  return errors;
}

/**
 * Check hreflang tags
 */
function checkHreflang(dom) {
  const hreflangs = Array.from(dom.window.document.querySelectorAll('link[rel="alternate"][hreflang]'));
  const errors = [];
  
  if (hreflangs.length === 0) {
    errors.push('❌ No hreflang tags found');
    return errors;
  }
  
  const foundLanguages = new Set();
  let hasXDefault = false;
  
  hreflangs.forEach(link => {
    const lang = link.getAttribute('hreflang');
    const href = link.getAttribute('href');
    
    if (lang === 'x-default') {
      hasXDefault = true;
    } else {
      foundLanguages.add(lang);
    }
    
    if (!href.includes(CANONICAL_DOMAIN)) {
      errors.push(`❌ Hreflang ${lang} doesn't point to ${CANONICAL_DOMAIN}: ${href}`);
    }
  });
  
  if (!hasXDefault) {
    errors.push('❌ Missing x-default hreflang');
  } else {
    console.log('  ✅ Has x-default hreflang');
  }
  
  const missingLangs = REQUIRED_LANGUAGES.filter(lang => !foundLanguages.has(lang));
  if (missingLangs.length > 0) {
    errors.push(`❌ Missing hreflang for: ${missingLangs.join(', ')}`);
  } else {
    console.log(`  ✅ Has all ${REQUIRED_LANGUAGES.length} required languages`);
  }
  
  return errors;
}

/**
 * Check JSON-LD schemas
 */
function checkJsonLd(dom) {
  const scripts = Array.from(dom.window.document.querySelectorAll('script[type="application/ld+json"]'));
  const errors = [];
  
  if (scripts.length === 0) {
    errors.push('⚠️  No JSON-LD schemas found (may be page-specific)');
    return errors;
  }
  
  console.log(`  ✅ Found ${scripts.length} JSON-LD schema(s)`);
  
  scripts.forEach((script, idx) => {
    try {
      const data = JSON.parse(script.textContent);
      const type = data['@type'];
      console.log(`    - Schema ${idx + 1}: ${type || 'Unknown'}`);
    } catch (e) {
      errors.push(`❌ Invalid JSON-LD in schema ${idx + 1}: ${e.message}`);
    }
  });
  
  return errors;
}

/**
 * Check meta description
 */
function checkMetaDescription(dom) {
  const metaDesc = dom.window.document.querySelector('meta[name="description"]');
  const errors = [];
  
  if (!metaDesc) {
    errors.push('❌ Missing meta description');
  } else {
    const content = metaDesc.getAttribute('content');
    if (!content) {
      errors.push('❌ Meta description is empty');
    } else {
      const length = content.length;
      if (length > MAX_META_DESC_LENGTH) {
        errors.push(`⚠️  Meta description too long (${length} > ${MAX_META_DESC_LENGTH}): "${content.substring(0, 50)}..."`);
      } else {
        console.log(`  ✅ Meta description (${length} chars): "${content.substring(0, 60)}..."`);
      }
    }
  }
  
  return errors;
}

/**
 * Check a single page
 */
async function checkPage(baseUrl, path) {
  const url = baseUrl + path;
  console.log(`\n📄 Checking: ${url}`);
  
  try {
    const { html, statusCode } = await fetchHtml(url);
    
    if (statusCode !== 200) {
      console.log(`  ❌ HTTP ${statusCode}`);
      return { errors: [`HTTP ${statusCode}`], warnings: [] };
    }
    
    const dom = new JSDOM(html);
    
    const errors = [
      ...checkCanonical(dom, url),
      ...checkHreflang(dom),
      ...checkJsonLd(dom),
      ...checkMetaDescription(dom)
    ];
    
    const warnings = errors.filter(e => e.startsWith('⚠️'));
    const criticalErrors = errors.filter(e => e.startsWith('❌'));
    
    return { errors: criticalErrors, warnings };
    
  } catch (err) {
    console.log(`  ❌ Failed to fetch: ${err.message}`);
    return { errors: [err.message], warnings: [] };
  }
}

/**
 * Main validation
 */
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:5000';
  
  console.log(`\n🔍 SEO Validation for Costa Brava Rent a Boat`);
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`🎯 Canonical Domain: ${CANONICAL_DOMAIN}`);
  console.log(`🌍 Required Languages: ${REQUIRED_LANGUAGES.join(', ')}`);
  
  const results = [];
  
  for (const path of PAGES_TO_CHECK) {
    const result = await checkPage(baseUrl, path);
    results.push({ path, ...result });
  }
  
  // Summary
  console.log(`\n\n📊 Validation Summary`);
  console.log(`${'='.repeat(60)}`);
  
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  
  results.forEach(({ path, errors, warnings }) => {
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`✅ ${path} - All checks passed`);
    } else {
      if (errors.length > 0) {
        console.log(`❌ ${path} - ${errors.length} error(s)`);
        errors.forEach(e => console.log(`   ${e}`));
      }
      if (warnings.length > 0) {
        console.log(`⚠️  ${path} - ${warnings.length} warning(s)`);
        warnings.forEach(w => console.log(`   ${w}`));
      }
    }
  });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);
  
  if (totalErrors > 0) {
    console.log('\n❌ SEO validation failed');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  SEO validation passed with warnings');
    process.exit(0);
  } else {
    console.log('\n✅ SEO validation passed');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
