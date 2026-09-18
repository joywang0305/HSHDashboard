export type HkWeather = {
  temperatureC: number;
  humidity: number | null;
  condition: string;
  icon: WeatherIconKind;
  updatedAt: string;
};

export type WeatherIconKind =
  | "sun"
  | "sun-cloud"
  | "cloud"
  | "rain"
  | "storm"
  | "wind"
  | "fog"
  | "hot"
  | "cold";

const HKO_URL =
  "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en";

type HkoReading = {
  place?: string;
  value?: number;
  unit?: string;
};

type HkoCurrent = {
  icon?: number[];
  updateTime?: string;
  temperature?: { data?: HkoReading[] };
  humidity?: { data?: HkoReading[] };
};

function readingAt(
  items: HkoReading[] | undefined,
  places: string[],
): number | null {
  if (!items?.length) return null;
  for (const place of places) {
    const match = items.find((item) => item.place === place);
    if (typeof match?.value === "number") return match.value;
  }
  return typeof items[0]?.value === "number" ? items[0].value : null;
}

export function conditionFromHkoIcon(code: number): {
  condition: string;
  icon: WeatherIconKind;
} {
  if (code === 50 || code === 70) return { condition: "Sunny", icon: "sun" };
  if (code === 51 || code === 77) {
    return { condition: "Sunny periods", icon: "sun-cloud" };
  }
  if (code === 52) return { condition: "Sunny intervals", icon: "sun-cloud" };
  if (code === 53 || code === 54) {
    return { condition: "Sunny showers", icon: "rain" };
  }
  if (code === 60 || code === 76) return { condition: "Cloudy", icon: "cloud" };
  if (code === 61) return { condition: "Overcast", icon: "cloud" };
  if (code === 62) return { condition: "Light rain", icon: "rain" };
  if (code === 63) return { condition: "Rain", icon: "rain" };
  if (code === 64) return { condition: "Heavy rain", icon: "rain" };
  if (code === 65) return { condition: "Thunderstorms", icon: "storm" };
  if (code === 80) return { condition: "Windy", icon: "wind" };
  if (code === 83 || code === 84 || code === 85) {
    return { condition: "Mist", icon: "fog" };
  }
  if (code === 90) return { condition: "Hot", icon: "hot" };
  if (code === 91) return { condition: "Warm", icon: "sun" };
  if (code === 92) return { condition: "Cool", icon: "cloud" };
  if (code === 93) return { condition: "Cold", icon: "cold" };
  return { condition: "Hong Kong", icon: "cloud" };
}

export async function fetchHkWeather(): Promise<HkWeather> {
  const response = await fetch(HKO_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Hong Kong Observatory returned ${response.status}.`);
  }
  const payload = (await response.json()) as HkoCurrent;
  const temperatureC = readingAt(payload.temperature?.data, [
    "Hong Kong Observatory",
    "Hong Kong Park",
    "King's Park",
  ]);
  if (temperatureC == null) {
    throw new Error("Hong Kong Observatory did not return a temperature.");
  }
  const humidity = readingAt(payload.humidity?.data, [
    "Hong Kong Observatory",
  ]);
  const iconCode = payload.icon?.[0] ?? 60;
  const { condition, icon } = conditionFromHkoIcon(iconCode);
  return {
    temperatureC,
    humidity,
    condition,
    icon,
    updatedAt: payload.updateTime ?? new Date().toISOString(),
  };
}
