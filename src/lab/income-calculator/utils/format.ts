import { Configuration } from "../domain/calculate";

export const formatCurrency = (n: number) =>
  n.toLocaleString("en-NZ", { style: "currency", currency: "NZD" });

export const formatNumber = (n: number) =>
  Number(n.toFixed(2)).toLocaleString("en-NZ", { maximumFractionDigits: 2 });

export const frequencies: Configuration["frequency"][] = [
  "hourly",
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
  "annual",
];

export const frequencyLabels: Record<Configuration["frequency"], string> = {
  hourly: "Hour",
  daily: "Day",
  weekly: "Week",
  fortnightly: "Fortnight",
  monthly: "Month",
  annual: "Year",
};
