export type HshQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  updatedAt: string;
};

const YAHOO_SYMBOL = "0045.HK";
const YAHOO_URL = `https://query1.finance.yahoo.com/v8/finance/chart/${YAHOO_SYMBOL}?range=1d&interval=1d`;

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        symbol?: string;
        shortName?: string;
        longName?: string;
        regularMarketPrice?: number;
        regularMarketChangePercent?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketTime?: number;
      };
    }>;
    error?: { description?: string } | null;
  };
};

export async function fetchHshQuote(): Promise<HshQuote> {
  const response = await fetch(YAHOO_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; HSHDashboard/1.0)",
    },
  });
  if (!response.ok) {
    throw new Error(`Quote service returned ${response.status}.`);
  }
  const payload = (await response.json()) as YahooChart;
  if (payload.chart?.error?.description) {
    throw new Error(payload.chart.error.description);
  }
  const meta = payload.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  if (typeof price !== "number") {
    throw new Error("Quote service did not return a price for 00045.");
  }
  const previous =
    typeof meta.previousClose === "number"
      ? meta.previousClose
      : typeof meta.chartPreviousClose === "number"
        ? meta.chartPreviousClose
        : null;
  const change = previous != null ? price - previous : 0;
  const changePercent =
    typeof meta.regularMarketChangePercent === "number"
      ? meta.regularMarketChangePercent
      : previous
        ? (change / previous) * 100
        : 0;
  const updatedAt =
    typeof meta.regularMarketTime === "number"
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString();
  return {
    symbol: "00045",
    name: meta.longName ?? meta.shortName ?? "The Hongkong and Shanghai Hotels",
    price,
    change,
    changePercent,
    currency: meta.currency ?? "HKD",
    updatedAt,
  };
}
