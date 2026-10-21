import type { KnownParty } from "./combinations";

export interface Election {
  year: number;
  date: string;
  // Seats won by the parties the calculator knows, the Māori Party counting as Te Pāti Māori.
  seats: Record<KnownParty, number>;
  // Seats won by parties since gone, by name.
  others: Record<string, number>;
  // The Wikipedia article the seats are from.
  source: string;
}

// Seats won at each general election under MMP, newest first.
export const elections: Election[] = [
  {
    year: 2023,
    date: "14 Oct 2023",
    seats: { n: 48, l: 34, g: 15, a: 11, f: 8, m: 6, o: 0 },
    others: {},
    source: "https://en.wikipedia.org/wiki/Results_of_the_2023_New_Zealand_general_election",
  },
  {
    year: 2020,
    date: "17 Oct 2020",
    seats: { n: 33, l: 65, g: 10, a: 10, f: 0, m: 2, o: 0 },
    others: {},
    source: "https://en.wikipedia.org/wiki/Results_of_the_2020_New_Zealand_general_election",
  },
  {
    year: 2017,
    date: "23 Sep 2017",
    seats: { n: 56, l: 46, g: 8, a: 1, f: 9, m: 0, o: 0 },
    others: {},
    source: "https://en.wikipedia.org/wiki/Results_of_the_2017_New_Zealand_general_election",
  },
  {
    year: 2014,
    date: "20 Sep 2014",
    seats: { n: 60, l: 32, g: 14, a: 1, f: 11, m: 2, o: 0 },
    others: { "United Future": 1 },
    source: "https://en.wikipedia.org/wiki/2014_New_Zealand_general_election",
  },
  {
    year: 2011,
    date: "26 Nov 2011",
    seats: { n: 59, l: 34, g: 14, a: 1, f: 8, m: 3, o: 0 },
    others: { "Mana": 1, "United Future": 1 },
    source: "https://en.wikipedia.org/wiki/2011_New_Zealand_general_election",
  },
  {
    year: 2008,
    date: "8 Nov 2008",
    seats: { n: 58, l: 43, g: 9, a: 5, f: 0, m: 5, o: 0 },
    others: { "Progressive": 1, "United Future": 1 },
    source: "https://en.wikipedia.org/wiki/2008_New_Zealand_general_election",
  },
  {
    year: 2005,
    date: "17 Sep 2005",
    seats: { n: 48, l: 50, g: 6, a: 2, f: 7, m: 4, o: 0 },
    others: { "United Future": 3, "Progressive": 1 },
    source: "https://en.wikipedia.org/wiki/2005_New_Zealand_general_election",
  },
  {
    year: 2002,
    date: "27 Jul 2002",
    seats: { n: 27, l: 52, g: 9, a: 9, f: 13, m: 0, o: 0 },
    others: { "United Future": 8, "Progressive": 2 },
    source: "https://en.wikipedia.org/wiki/2002_New_Zealand_general_election",
  },
  {
    year: 1999,
    date: "27 Nov 1999",
    seats: { n: 39, l: 49, g: 7, a: 9, f: 5, m: 0, o: 0 },
    others: { "Alliance": 10, "United NZ": 1 },
    source: "https://en.wikipedia.org/wiki/1999_New_Zealand_general_election",
  },
  {
    year: 1996,
    date: "12 Oct 1996",
    seats: { n: 44, l: 37, g: 0, a: 8, f: 17, m: 0, o: 0 },
    others: { "Alliance": 13, "United NZ": 1 },
    source: "https://en.wikipedia.org/wiki/1996_New_Zealand_general_election",
  },
];
