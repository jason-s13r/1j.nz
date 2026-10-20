import type { House } from "./combinations";

export interface Poll extends House {
  pollster: string;
  date: string;
}

// Seat projections from the opinion polling article.
export const POLLS_SOURCE = "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_New_Zealand_general_election";

export const polls: Poll[] = [
  { pollster: "1News–Verian", date: "15–19 Oct 2026", n: 38, l: 32, g: 19, a: 13, z: 9, m: 4, o: 8 },
  { pollster: "The Post/Freshwater Strategy", date: "9–19 Oct 2026", n: 34, l: 35, g: 17, a: 11, z: 14, m: 4, o: 7 },
  { pollster: "1News–Verian", date: "8–12 Oct 2026", n: 34, l: 34, g: 18, a: 12, z: 12, m: 4, o: 10 },
  { pollster: "Anacta", date: "6–10 Oct 2026", n: 34, l: 36, g: 18, a: 11, z: 12, m: 4, o: 7 },
  { pollster: "Taxpayers' Union–Curia", date: "1–5 Oct 2026", n: 37, l: 36, g: 17, a: 12, z: 16, m: 4, o: 0 },
  { pollster: "1News–Verian", date: "1–5 Oct 2026", n: 35, l: 34, g: 19, a: 11, z: 12, m: 4, o: 8 },
  { pollster: "RNZ–Reid Research", date: "24 Sep – 1 Oct 2026", n: 32, l: 37, g: 18, a: 11, z: 13, m: 4, o: 7 },
  { pollster: "1News–Verian", date: "23–27 Sep 2026", n: 34, l: 34, g: 20, a: 13, z: 11, m: 4, o: 7 },
  { pollster: "Roy Morgan", date: "31 Aug – 27 Sep 2026", n: 38, l: 28, g: 19, a: 13, z: 12, m: 4, o: 8 },
  { pollster: "The Post/Freshwater Strategy", date: "4–11 Sep 2026", n: 33, l: 34, g: 17, a: 11, z: 16, m: 4, o: 7 },
  { pollster: "Anacta", date: "4–10 Sep 2026", n: 36, l: 37, g: 15, a: 10, z: 12, m: 4, o: 8 },
  { pollster: "Taxpayers' Union–Curia", date: "1–3 Sep 2026", n: 39, l: 34, g: 19, a: 14, z: 11, m: 4, o: 0 },
  { pollster: "Roy Morgan", date: "27 Jul – 23 Aug 2026", n: 37, l: 29, g: 19, a: 13, z: 9, m: 4, o: 11 },
  { pollster: "RNZ–Reid Research", date: "14–21 Aug 2026", n: 35, l: 39, g: 12, a: 9, z: 15, m: 4, o: 6 },
  { pollster: "1News–Verian", date: "8–11 Aug 2026", n: 36, l: 37, g: 15, a: 11, z: 10, m: 4, o: 10 },
  { pollster: "Talbot Mills", date: "1–11 Aug 2026", n: 35, l: 41, g: 10, a: 8, z: 16, m: 4, o: 6 },
  { pollster: "Taxpayers' Union–Curia", date: "1–4 Aug 2026", n: 40, l: 36, g: 13, a: 9, z: 12, m: 4, o: 8 },
  { pollster: "Roy Morgan", date: "29 Jun – 26 Jul 2026", n: 40, l: 31, g: 17, a: 10, z: 10, m: 4, o: 10 },
  { pollster: "Talbot Mills", date: "10–19 Jul 2026", n: 39, l: 42, g: 11, a: 9, z: 15, m: 4, o: 0 },
  { pollster: "RNZ–Reid Research", date: "2–9 Jul 2026", n: 36, l: 43, g: 13, a: 10, z: 15, m: 4, o: 0 },
  { pollster: "Taxpayers' Union–Curia", date: "1–5 Jul 2026", n: 39, l: 41, g: 13, a: 9, z: 14, m: 4, o: 0 },
  { pollster: "Roy Morgan", date: "25 May – 21 Jun 2026", n: 37, l: 31, g: 16, a: 11, z: 13, m: 4, o: 8 },
];
