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
  { station: "North of Nairobi", primaryCounty: "Nairobi", secondaryCounties: ["Kiambu"] },
  { station: "South of Nairobi", primaryCounty: "Nairobi", secondaryCounties: ["Kajiado", "Machakos"] },
  { station: "East of Nairobi", primaryCounty: "Nairobi", secondaryCounties: ["Machakos"] },
  { station: "West of Nairobi", primaryCounty: "Nairobi", secondaryCounties: ["Kiambu"] },
  { station: "Thika", primaryCounty: "Kiambu", secondaryCounties: ["Murang'a"] },
  { station: "Nyeri", primaryCounty: "Nyeri", secondaryCounties: ["Nyandarua", "Kirinyaga", "Laikipia"] },
  { station: "Kerugoya", primaryCounty: "Kirinyaga", secondaryCounties: ["Embu"] },
  { station: "Murang'a", primaryCounty: "Murang'a", secondaryCounties: ["Nyeri"] },
  { station: "Mombasa", primaryCounty: "Mombasa", secondaryCounties: ["Kwale", "Kilifi"] },
  { station: "Malindi", primaryCounty: "Kilifi", secondaryCounties: ["Tana River", "Lamu"] },
  { station: "Voi", primaryCounty: "Taita Taveta", secondaryCounties: ["Kwale", "Makueni"] },
  { station: "Machakos", primaryCounty: "Machakos", secondaryCounties: ["Makueni", "Kitui"] },
  { station: "Kitui", primaryCounty: "Kitui", secondaryCounties: ["Makueni"] },
  { station: "Embu", primaryCounty: "Embu", secondaryCounties: ["Tharaka Nithi", "Kirinyaga"] },
  { station: "Meru", primaryCounty: "Meru", secondaryCounties: ["Isiolo", "Tharaka Nithi", "Marsabit"] },
  { station: "Isiolo", primaryCounty: "Isiolo", secondaryCounties: ["Samburu", "Marsabit"] },
  { station: "Garissa", primaryCounty: "Garissa", secondaryCounties: ["Wajir", "Tana River"] },
  { station: "Wajir", primaryCounty: "Wajir", secondaryCounties: ["Mandera"] },
  { station: "Mandera", primaryCounty: "Mandera", secondaryCounties: ["Wajir"] },
  { station: "Nakuru", primaryCounty: "Nakuru", secondaryCounties: ["Baringo", "Nyandarua"] },
  { station: "Naivasha", primaryCounty: "Nakuru", secondaryCounties: ["Nyandarua", "Narok"] },
  { station: "Nyahururu", primaryCounty: "Laikipia", secondaryCounties: ["Nyandarua"] },
  { station: "Narok", primaryCounty: "Narok", secondaryCounties: ["Bomet"] },
  { station: "Kericho", primaryCounty: "Kericho", secondaryCounties: ["Bomet"] },
  { station: "Eldoret", primaryCounty: "Uasin Gishu", secondaryCounties: ["Elgeyo Marakwet", "Nandi"] },
  { station: "Kitale", primaryCounty: "Trans Nzoia", secondaryCounties: ["West Pokot", "Bungoma"] },
  { station: "Lodwar", primaryCounty: "Turkana", secondaryCounties: ["West Pokot"] },
  { station: "Kajiado/Kitengela", primaryCounty: "Kajiado", secondaryCounties: ["Nairobi", "Machakos"] },
  { station: "Kisumu", primaryCounty: "Kisumu", secondaryCounties: ["Siaya", "Vihiga"] },
  { station: "Kakamega", primaryCounty: "Kakamega", secondaryCounties: ["Vihiga"] },
  { station: "Bungoma", primaryCounty: "Bungoma", secondaryCounties: ["Busia"] },
  { station: "Busia (OSBP)", primaryCounty: "Busia", secondaryCounties: ["Bungoma"] },
  { station: "Malaba (OSBP)", primaryCounty: "Busia", secondaryCounties: ["Bungoma"] },
  { station: "Kisii", primaryCounty: "Kisii", secondaryCounties: ["Nyamira"] },
  { station: "Homa Bay", primaryCounty: "Homa Bay", secondaryCounties: ["Migori"] },
  { station: "Migori", primaryCounty: "Migori", secondaryCounties: ["Narok"] },
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
 * Resolve the matching KRA Station given a County name
 */
export function getKraStationForCounty(county: string): string {
  const norm = normalizeCountyName(county);
  if (!norm) return "North of Nairobi";

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
  return "North of Nairobi";
}

/**
 * Resolve primary & secondary counties for a given KRA Station
 */
export function getCountiesForStation(station: string): { primary: string; secondary: string[] } {
  if (!station) return { primary: "Nairobi", secondary: ["Kiambu"] };
  const normStation = station.toLowerCase().replace(/\btso\b/gi, "").replace(/[^a-z0-9]/g, "");

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
 * Format raw KRA station strings cleanly without TSO (e.g. "KITALE" -> "Kitale", "Kitale TSO" -> "Kitale")
 */
export function formatKraStation(station: string): string {
  if (!station) return "";
  let cleanStation = station
    .trim()
    .replace(/\bTSO\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const norm = cleanStation.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = KRA_STATION_MATRIX.find(
    (entry) =>
      entry.station.toLowerCase().replace(/[^a-z0-9]/g, "") === norm ||
      entry.station.toLowerCase().includes(cleanStation.toLowerCase()) ||
      cleanStation.toLowerCase().includes(entry.station.toLowerCase())
  );
  if (match) return match.station;

  if (/^[A-Z0-9\s()/-]+$/.test(cleanStation)) {
    return cleanStation
      .split(/\s+/)
      .map((w) => (w.startsWith("(") ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(" ");
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

