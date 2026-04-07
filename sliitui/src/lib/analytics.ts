import { apiRequest } from "@/src/api/client";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const VISITOR_STORAGE_KEY = "sliit-archive-visitor-id";

let googleAnalyticsInitialized = false;

function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  window.localStorage.setItem(VISITOR_STORAGE_KEY, nextId);
  return nextId;
}

function sendGoogleEvent(eventName: string, params: Record<string, unknown>) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params);
}

export function initializeAnalytics() {
  if (!GA_MEASUREMENT_ID || googleAnalyticsInitialized || typeof document === "undefined") {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
  googleAnalyticsInitialized = true;
}

async function postAnalyticsEvent(body: {
  event_type: "page_view" | "download";
  path?: string;
  document_id?: number;
  referrer?: string;
}) {
  try {
    await apiRequest("analytics/events/", {
      method: "POST",
      body: {
        ...body,
        visitor_id: getVisitorId(),
      },
    });
  } catch {
    // Analytics should never interrupt the primary UX flow.
  }
}

export function trackPageView(path: string) {
  const cleanPath = path || "/";
  void postAnalyticsEvent({
    event_type: "page_view",
    path: cleanPath,
    referrer: document.referrer || "",
  });

  sendGoogleEvent("page_view", {
    page_path: cleanPath,
    page_location: window.location.href,
    page_referrer: document.referrer || "",
  });
}

export function trackDocumentDownload({
  documentId,
  title,
  url,
}: {
  documentId?: number;
  title: string;
  url: string;
}) {
  if (documentId) {
    void postAnalyticsEvent({
      event_type: "download",
      path: window.location.pathname,
      document_id: documentId,
      referrer: document.referrer || "",
    });
  }

  sendGoogleEvent("file_download", {
    file_name: title,
    file_extension: "pdf",
    link_url: url,
    document_id: documentId,
  });
}
