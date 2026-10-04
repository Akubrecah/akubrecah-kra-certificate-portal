/**
 * KRA Stations & Counties Map Matrix
 * Official mapping between KRA Tax Service Offices (TSO) and Kenya Counties
 */

export interface KraStationMapping {
  station: string;
  primaryCounty: string;
  secondaryCounties: string[];
}

export const KRA_STATION_MATRIX: KraStationMapping[] = [
  { station: "North of Nairobi TSO", primaryCounty: "Nairobi", secondaryCounties: ["Kiambu"] },
  { station: "South of Nairobi TSO", primaryCounty: "Nairobi", secondaryCounties: ["Kajiado", "Machakos"] },
  { station: "East of Nairobi TSO", primaryCounty: "Nairobi", secondaryCounties: ["Machakos"] },
  { station: "West of Nairobi TSO", primaryCounty: "Nairobi", secondaryCounties: ["Kiambu"] },
  { station: "Thika TSO", primaryCounty: "Kiambu", secondaryCounties: ["Murang'a"] },
  { station: "Nyeri TSO", primaryCounty: "Nyeri", secondaryCounties: ["Nyandarua", "Kirinyaga", "Laikipia"] },
  { station: "Kerugoya TSO", primaryCounty: "Kirinyaga", secondaryCounties: ["Embu"] },
  { station: "Murang'a TSO", primaryCounty: "Murang'a", secondaryCounties: ["Nyeri"] },
  { station: "Mombasa TSO", primaryCounty: "Mombasa", secondaryCounties: ["Kwale", "Kilifi"] },
  { station: "Malindi TSO", primaryCounty: "Kilifi", secondaryCounties: ["Tana River", "Lamu"] },
  { station: "Voi TSO", primaryCounty: "Taita Taveta", secondaryCounties: ["Kwale", "Makueni"] },
  { station: "Machakos TSO", primaryCounty: "Machakos", secondaryCounties: ["Makueni", "Kitui"] },
  { station: "Kitui TSO", primaryCounty: "Kitui", secondaryCounties: ["Makueni"] },
  { station: "Embu TSO", primaryCounty: "Embu", secondaryCounties: ["Tharaka Nithi", "Kirinyaga"] },
  { station: "Meru TSO", primaryCounty: "Meru", secondaryCounties: ["Isiolo", "Tharaka Nithi", "Marsabit"] },
  { station: "Isiolo TSO", primaryCounty: "Isiolo", secondaryCounties: ["Samburu", "Marsabit"] },
  { station: "Garissa TSO", primaryCounty: "Garissa", secondaryCounties: ["Wajir", "Tana River"] },
  { station: "Wajir TSO", primaryCounty: "Wajir", secondaryCounties: ["Mandera"] },
  { station: "Mandera TSO", primaryCounty: "Mandera", secondaryCounties: ["Wajir"] },
  { station: "Nakuru TSO", primaryCounty: "Nakuru", secondaryCounties: ["Baringo", "Nyandarua"] },
  { station: "Naivasha TSO", primaryCounty: "Nakuru", secondaryCounties: ["Nyandarua", "Narok"] },
  { station: "Nyahururu TSO", primaryCounty: "Laikipia", secondaryCounties: ["Nyandarua"] },
  { station: "Narok TSO", primaryCounty: "Narok", secondaryCounties: ["Bomet"] },
  { station: "Kericho TSO", primaryCounty: "Kericho", secondaryCounties: ["Bomet"] },
  { station: "Eldoret TSO", primaryCounty: "Uasin Gishu", secondaryCounties: ["Elgeyo Marakwet", "Nandi"] },
  { station: "Kitale TSO", primaryCounty: "Trans Nzoia", secondaryCounties: ["West Pokot", "Bungoma"] },
  { station: "Lodwar TSO", primaryCounty: "Turkana", secondaryCounties: ["West Pokot"] },
  { station: "Kajiado/Kitengela TSO", primaryCounty: "Kajiado", secondaryCounties: ["Nairobi", "Machakos"] },
  { station: "Kisumu TSO", primaryCounty: "Kisumu", secondaryCounties: ["Siaya", "Vihiga"] },
  { station: "Kakamega TSO", primaryCounty: "Kakamega", secondaryCounties: ["Vihiga"] },
  { station: "Bungoma TSO", primaryCounty: "Bungoma", secondaryCounties: ["Busia"] },
  { station: "Busia TSO (OSBP)", primaryCounty: "Busia", secondaryCounties: ["Bungoma"] },
  { station: "Malaba TSO (OSBP)", primaryCounty: "Busia", secondaryCounties: ["Bungoma"] },
  { station: "Kisii TSO", primaryCounty: "Kisii", secondaryCounties: ["Nyamira"] },
  { station: "Homa Bay TSO", primaryCounty: "Homa Bay", secondaryCounties: ["Migori"] },
  { station: "Migori TSO", primaryCounty: "Migori", secondaryCounties: ["Narok"] },
];

/**
 * Normalizes county name string for matching
 */
export function normalizeCountyName(county: string): string {
  if (!county) return "";
  return county
    .toLowerCase()
    .replace(/\bcounty\b/gi, "")
    .replace(/[^a-z0-9]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve the matching KRA Station (TSO) given a County name
 */
export function getKraStationForCounty(county: string): string {
  const norm = normalizeCountyName(county);
  if (!norm) return "North of Nairobi TSO";

  // 1. Check direct primary county match
  const primaryMatch = KRA_STATION_MATRIX.find(
    (entry) => normalizeCountyName(entry.primaryCounty) === norm
  );
  if (primaryMatch) {
    return primaryMatch.station;
  }

  // 2. Check partial primary match
  const partialPrimary = KRA_STATION_MATRIX.find(
    (entry) =>
      norm.includes(normalizeCountyName(entry.primaryCounty)) ||
      normalizeCountyName(entry.primaryCounty).includes(norm)
  );
  if (partialPrimary) {
    return partialPrimary.station;
  }

  // 3. Check secondary / neighboring counties match
  const secondaryMatch = KRA_STATION_MATRIX.find((entry) =>
    entry.secondaryCounties.some(
      (sec) =>
        normalizeCountyName(sec) === norm ||
        norm.includes(normalizeCountyName(sec)) ||
        normalizeCountyName(sec).includes(norm)
    )
  );
  if (secondaryMatch) {
    return secondaryMatch.station;
  }

  // Default fallback
  return "North of Nairobi TSO";
}

/**
 * Resolve primary & secondary counties for a given KRA Station
 */
export function getCountiesForStation(station: string): { primary: string; secondary: string[] } {
  if (!station) return { primary: "Nairobi", secondary: ["Kiambu"] };
  const normStation = station.toLowerCase().replace(/[^a-z0-9]/g, "");

  const match = KRA_STATION_MATRIX.find(
    (entry) => entry.station.toLowerCase().replace(/[^a-z0-9]/g, "") === normStation ||
               entry.station.toLowerCase().includes(station.toLowerCase()) ||
               station.toLowerCase().includes(entry.station.toLowerCase())
  );

  if (match) {
    return {
      primary: match.primaryCounty,
      secondary: match.secondaryCounties,
    };
  }

  return { primary: "Nairobi", secondary: ["Kiambu"] };
}

/**
 * Format raw KRA station strings (e.g. "KITALE" -> "Kitale TSO")
 */
export function formatKraStation(station: string): string {
  if (!station) return "";
  const cleanStation = station.trim();
  const norm = cleanStation.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = KRA_STATION_MATRIX.find(
    (entry) =>
      entry.station.toLowerCase().replace(/[^a-z0-9]/g, "") === norm ||
      entry.station.toLowerCase().includes(cleanStation.toLowerCase()) ||
      cleanStation.toLowerCase().includes(entry.station.toLowerCase().replace(/\s*tso\b/gi, ""))
  );
  if (match) return match.station;
  if (/^[A-Z0-9\s]+$/.test(cleanStation)) {
    const titleCased = cleanStation
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return titleCased.endsWith("TSO") ? titleCased : `${titleCased} TSO`;
  }
  return cleanStation;
}

/**
 * Ensures tax area correctly reflects the taxpayer's county/town,
 * guarding against cross-county mismatches (e.g. Endebbes in West Pokot).
 */
export function sanitizeTaxArea(taxArea?: string, county?: string, town?: string): string {
  const normArea = (taxArea || "").trim();
  const normCounty = (county || "").toUpperCase().trim();

  if (normArea.toLowerCase().includes("endeb")) {
    if (!normCounty.includes("TRANS NZOIA")) {
      return town || (normCounty.includes("POKOT") ? "Kapenguria" : (normCounty ? `${county} Central` : "Central"));
    }
  }

  if ((normCounty === "WEST POKOT" || normCounty.includes("POKOT")) && (!normArea || normArea.toLowerCase().includes("endeb"))) {
    return town || "Kapenguria";
  }

  return normArea || (normCounty ? `${county} Central` : "");
}

