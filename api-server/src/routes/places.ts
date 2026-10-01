import { Router, type IRouter } from "express";
import {
  GeocodeDestinationResponse,
  GeocodeDestinationQueryParams,
  SearchTouristPlacesQueryParams,
  SearchTouristPlacesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type GeocodingResult = {
  lat: string;
  lon: string;
};

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const sourceHeaders = {
  "User-Agent": "TravelNow/0.1 (tourism discovery prototype)",
};

function toCategory(tags: Record<string, string>): string {
  const value = tags.tourism ?? tags.historic;
  if (!value) return "Lugar turístico";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toAddress(tags: Record<string, string>): string | null {
  const address = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
  ]
    .filter(Boolean)
    .join(" ");

  return address || null;
}

router.get("/places/search", async (req, res): Promise<void> => {
  const parsed = SearchTouristPlacesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { destination, limit = 8 } = parsed.data;

  try {
    const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
    geocodeUrl.searchParams.set("q", destination);
    geocodeUrl.searchParams.set("format", "jsonv2");
    geocodeUrl.searchParams.set("limit", "1");

    const geocodeResponse = await fetch(geocodeUrl, {
      headers: sourceHeaders,
      signal: AbortSignal.timeout(10000),
    });

    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding request failed with ${geocodeResponse.status}`);
    }

    const geocoded = (await geocodeResponse.json()) as GeocodingResult[];
    const destinationPoint = geocoded[0];

    if (!destinationPoint) {
      res.json([]);
      return;
    }

    const overpassQuery = `
      [out:json][timeout:15];
      (
        nwr(around:12000,${destinationPoint.lat},${destinationPoint.lon})["tourism"];
        nwr(around:12000,${destinationPoint.lat},${destinationPoint.lon})["historic"];
      );
      out center tags;
    `;
    let overpassData: OverpassResponse | null = null;
    for (const endpoint of [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ]) {
      try {
        const overpassResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            ...sourceHeaders,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ data: overpassQuery }).toString(),
          signal: AbortSignal.timeout(20000),
        });

        if (overpassResponse.ok) {
          overpassData = (await overpassResponse.json()) as OverpassResponse;
          break;
        }

        req.log.warn({ endpoint, status: overpassResponse.status }, "Tourist places provider returned an error");
      } catch (error) {
        req.log.warn({ endpoint, error }, "Tourist places provider was unavailable");
      }
    }

    if (!overpassData) {
      throw new Error("All tourist places providers were unavailable");
    }

    const places = (overpassData.elements ?? [])
      .map((element) => {
        const tags = element.tags ?? {};
        const latitude = element.lat ?? element.center?.lat;
        const longitude = element.lon ?? element.center?.lon;
        const name = tags.name;

        if (!name || latitude == null || longitude == null) {
          return null;
        }

        return {
          id: `osm-${element.type}-${element.id}`,
          name,
          category: toCategory(tags),
          latitude,
          longitude,
          address: toAddress(tags),
          source: "OpenStreetMap",
        };
      })
      .filter((place): place is NonNullable<typeof place> => place !== null)
      .slice(0, limit);

    res.json(SearchTouristPlacesResponse.parse(places));
  } catch (error) {
    req.log.error({ error, destination }, "Unable to load tourist places");
    res.status(502).json({
      error: "No pudimos cargar lugares turísticos en este momento.",
    });
  }
});

router.get("/places/geocode", async (req, res): Promise<void> => {
  const parsed = GeocodeDestinationQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { destination } = parsed.data;

  try {
    const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
    geocodeUrl.searchParams.set("q", destination);
    geocodeUrl.searchParams.set("format", "jsonv2");
    geocodeUrl.searchParams.set("limit", "1");

    const response = await fetch(geocodeUrl, {
      headers: sourceHeaders,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Geocoding request failed with ${response.status}`);
    }

    const results = (await response.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;
    const result = results[0];
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);

    if (!result?.display_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      res.status(404).json({ error: "No encontramos ese destino." });
      return;
    }

    res.json(
      GeocodeDestinationResponse.parse({
        displayName: result.display_name,
        latitude,
        longitude,
        source: "OpenStreetMap Nominatim",
      }),
    );
  } catch (error) {
    req.log.error({ error, destination }, "Unable to geocode destination");
    res.status(502).json({
      error: "No pudimos buscar ese destino en este momento.",
    });
  }
});

export default router;