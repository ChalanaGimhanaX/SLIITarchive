import { API_BASE_URL } from "@/src/api/config";
import { trackDocumentDownload } from "@/src/lib/analytics";

export function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatBytes(value: number | null | undefined) {
  if (!value) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function resolveFileUrl(filePath: string) {
  if (!filePath) {
    return "";
  }

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  if (/^\/\//.test(filePath)) {
    return `https:${filePath}`;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(filePath)) {
    return `https://${filePath.replace(/^\/+/, "")}`;
  }

  const apiOrigin = new URL(API_BASE_URL).origin;
  return `${apiOrigin}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
}

export async function handleFileDownload(url: string, filename: string, documentId?: number) {
  void trackDocumentDownload({
    documentId,
    title: filename,
    url,
  });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response was not ok");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename.includes(".") ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("CORS or fetch failed, falling back to new tab:", err);
    window.open(url, "_blank");
  }
}
