// Meta Pixel integration - respects consent mode
// Pixel ID is loaded from env/config via meta tag, not hardcoded

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

let pixelInitialized = false;

export function initMetaPixel(pixelId: string) {
  if (pixelInitialized || !pixelId) return;

  // Check consent before initializing
  const consent = localStorage.getItem("cookieConsent");
  if (consent !== "accepted") return;

  // Load Meta Pixel script
  const script = document.createElement("script");
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);

  // Wait for fbq to be available, then init
  const waitForFbq = setInterval(() => {
    if (typeof window.fbq === "function") {
      clearInterval(waitForFbq);
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
      pixelInitialized = true;
    }
  }, 100);

  // Timeout after 5 seconds
  setTimeout(() => clearInterval(waitForFbq), 5000);
}

// Standard events mapped to our business

export function trackMetaViewContent(boatId: string, boatName: string, price: number) {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "ViewContent", {
    content_name: boatName,
    content_ids: [boatId],
    content_type: "product",
    value: price,
    currency: "EUR",
  });
}

export function trackMetaInitiateCheckout(boatId: string, boatName: string, price: number) {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "InitiateCheckout", {
    content_name: boatName,
    content_ids: [boatId],
    content_type: "product",
    value: price,
    currency: "EUR",
    num_items: 1,
  });
}

export function trackMetaPurchase(bookingId: string, amount: number, boatId: string) {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "Purchase", {
    content_ids: [boatId],
    content_type: "product",
    value: amount,
    currency: "EUR",
    order_id: bookingId,
  });
}

export function trackMetaLead(source: string) {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "Lead", {
    content_name: source,
  });
}

export function trackMetaContact(method: string) {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "Contact", {
    content_name: method,
  });
}
