import "server-only";

export async function lookupGeo(ip: string | null | undefined) {
  if (!ip) return null;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.")) {
    return { city: null, country: "Private", region: null };
  }
  try {
    const geo = await import("geoip-lite");
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
