import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date);
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDateTime(
  date: Date | string,
  locale = "en-US",
  timeZone = "UTC",
  options?: Intl.DateTimeFormatOptions
) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
    ...options,
  }).format(d);
}

export function describeUserAgent(ua: string | null | undefined) {
  if (!ua) return "Unknown device";
  const lower = ua.toLowerCase();
  const isMobile = /mobile|iphone|android/.test(lower);
  const isMac = /macintosh|mac os/.test(lower);
  const isWindows = /windows/.test(lower);
  const isLinux = /linux/.test(lower);
  const browser = /chrome/.test(lower)
    ? "Chrome"
    : /safari/.test(lower)
    ? "Safari"
    : /firefox/.test(lower)
    ? "Firefox"
    : "Browser";
  const os = isMac ? "macOS" : isWindows ? "Windows" : isLinux ? "Linux" : "Unknown OS";
  return `${isMobile ? "Mobile" : "Desktop"} · ${browser} · ${os}`;
}

export function describeLocation(ip: string | null | undefined) {
  if (!ip) return "Unknown location";
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.")) {
    return "Private network";
  }
  return `IP ${ip}`;
}

export async function lookupGeo(ip: string | null | undefined) {
  if (!ip) return null;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.")) {
    return { city: null, country: "Private", region: null };
  }
  try {
    const geo = await import("@maxmind/geoip-lite");
    const result = geo.lookup(ip);
    if (!result) return null;
    return {
      city: result.city ?? null,
      country: result.country ?? null,
      region: result.region ?? null,
    };
  } catch (err) {
    console.error("GeoIP lookup failed", err);
    return null;
  }
}
