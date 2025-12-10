import "server-only";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

type GeoLiteModule = {
  lookup: (ip: string) =>
    | { city?: string | null; country?: string | null; region?: string | null }
    | null;
};

let geoLiteChecked = false;
let geoLiteAvailable = false;
const require = createRequire(import.meta.url);

async function loadGeoLite(): Promise<GeoLiteModule | null> {
  if (geoLiteChecked && !geoLiteAvailable) return null;
  try {
    if (!geoLiteChecked) {
      let pkgPath: string | null = null;
      try {
        pkgPath = require.resolve("geoip-lite/package.json");
      } catch {
        geoLiteChecked = true;
        geoLiteAvailable = false;
        return null;
      }
      const dataFile = path.join(path.dirname(pkgPath), "data/geoip-country.dat");
      geoLiteAvailable = existsSync(dataFile);
      geoLiteChecked = true;
      if (!geoLiteAvailable) return null;
    }
    // @ts-ignore - geoip-lite is CommonJS
    const mod = await import("geoip-lite");
    const geo: GeoLiteModule = (mod.default ?? mod) as GeoLiteModule;
    return geo;
  } catch {
    geoLiteAvailable = false;
    return null;
  }
}

export async function lookupGeo(ip: string | null | undefined) {
  if (!ip) return null;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.")) {
    return { city: null, country: "Private", region: null };
  }
  const geo = await loadGeoLite();
  if (!geo) return null;
  let result: ReturnType<typeof geo.lookup> = null;
  try {
    result = geo.lookup(ip);
  } catch {
    geoLiteAvailable = false;
    return null;
  }
  if (!result) return null;
  return {
    city: result.city ?? null,
    country: result.country ?? null,
    region: result.region ?? null,
  };
}
