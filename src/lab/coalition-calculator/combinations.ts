export const labels = {
  n: "National",
  l: "Labour",
  g: "Green",
  a: "Act",
  f: "NZ First",
  m: "Te Pāti Māori",
  o: "Opportunity",
  t: "Te Tai Tokerau",
};

// A single-letter party key, e.g. "n" for National. Parties added by the user take unused letters.
export type Party = string;

// The key of a party with poll data.
export type KnownParty = keyof typeof labels;

export const PARTIES = Object.keys(labels) as KnownParty[];

// Seats per party.
export type House = Record<Party, number>;

// A pair of party keys that won't govern together, e.g. "nl" for National + Labour.
export type Pair = string;

export interface Outcome {
  // Largest party first.
  members: Party[];
  seats: number;
}

export interface Makeup {
  total: number;
  majority: number;
  // Majorities without a ruled-out pair, most likely first.
  plausible: Outcome[];
  // Coalitions without a ruled-out pair or a majority, largest first.
  short: Outcome[];
  // Majorities that include a ruled-out pair, most likely first.
  ruledOut: Outcome[];
}

// The coming election, which the stated rule-outs are for. Update after each election.
export const ELECTION = 2026;

// Where the stated rule-outs come from.
export const STATED_SOURCE =
  "https://thespinoff.co.nz/politics/25-08-2026/the-rule-in-rule-out-game-is-ruining-one-of-the-best-things-about-mmp";

// The parties in the current government. Update after each election.
export const INCUMBENT: Party[] = ["n", "a", "f"];

export const BLOCS: { left: Party[]; right: Party[]; other: Party[] } = {
  left: ["l", "g", "m", "t"],
  right: ["n", "a", "f"],
  other: ["o"],
};

// Parties polling but without seats in the current parliament. Update after each election.
export const OUTSIDE_PARLIAMENT: Party[] = ["o", "t"];

// Pairs never in government together (coalition or confidence and supply) under MMP, since 1996.
// Remove a pair once it has been in government together.
export const NO_HISTORY: Pair[] = [
  "nl", // National, Labour
  "ng", // National, Greens (2009 memorandum of understanding only)
  "la", // Labour, Act
  "ga", // Greens, Act
  "lm", // Labour, Te Pāti Māori
  "gm", // Greens, Te Pāti Māori
  "fm", // NZ First, Te Pāti Māori
  "no", // Opportunity has never been in parliament
  "lo",
  "go",
  "ao",
  "fo",
  "mo",
];

export const EXCLUSIONS = {
  traditional: [
    "nl", // National exclude Labour
    "ng", // National exclude Greens
    "la", // Labour exclude Act
    "ga", // Greens exclude Act
  ],
  stated: [
    "gf", // Greens exclude NZ First
    "lf", // Labour exclude NZ First
    "mf", // Te Pāti Māori exclude NZ First
    "mn", // Te Pāti Māori exclude National
    "ma", // Te Pāti Māori exclude Act
  ],
  // Stated, but not expected to hold, so off by default.
  disputed: [
    "no", // National exclude Opportunities
  ],
};

export const DEFAULT_EXCLUSIONS: Pair[] = [...EXCLUSIONS.traditional, ...EXCLUSIONS.stated];

// Every combination of one or more parties.
const coalitions = (parties: Party[]) =>
  parties.reduce<Party[][]>((all, party) => [...all, [party], ...all.map((c) => [...c, party])], []);

export const parties = (pair: Pair) => pair.split("");

// Seats held by the given parties.
export const seatsOf = (house: House, members: Party[]) => members.reduce((s, p) => s + house[p], 0);

// Each party's mean seats across the houses. Rounded by largest remainder, so the house is their mean size.
export const meanHouse = (houses: House[]): House => {
  const all = [...new Set(houses.flatMap((house) => Object.keys(house)))];
  const means = all.map((party) => houses.reduce((s, house) => s + (house[party] ?? 0), 0) / houses.length);
  const seats = means.map(Math.floor);
  const short = Math.round(means.reduce((s, m) => s + m, 0)) - seats.reduce((s, n) => s + n, 0);
  means
    .map((m, i) => ({ i, remainder: m - seats[i] }))
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, short)
    .forEach(({ i }) => seats[i]++);
  return Object.fromEntries(all.map((party, i) => [party, seats[i]]));
};

// Seats needed to govern.
export const majorityOf = (total: number) => Math.floor(total / 2) + 1;

// Parties with seats, largest first.
export const seatedParties = (house: House) =>
  Object.keys(house)
    .filter((party) => house[party] > 0)
    .sort((a, b) => house[b] - house[a]);

export const makeup = (house: House, exclusions: Pair[]): Makeup => {
  const total = seatsOf(house, Object.keys(house));
  const majority = majorityOf(total);
  const ruledOutPairs = exclusions.map(parties);
  const excluded = ({ members }: Outcome) => ruledOutPairs.some((pair) => pair.every((p) => members.includes(p)));
  // Favour coalitions led by a large party, with few partners.
  const weight = ({ members, seats }: Outcome) => house[members[0]] / seats / members.length;

  // Combinations keep their parties' order, so each coalition's members are largest first.
  const outcomes = coalitions(seatedParties(house))
    .map((members) => ({ members, seats: seatsOf(house, members) }))
    .sort((a, b) => weight(b) - weight(a));
  const {
    plausible = [],
    short = [],
    ruledOut = [],
  } = Object.groupBy(outcomes, (outcome) => {
    const wins = outcome.seats >= majority;
    if (!excluded(outcome)) return wins ? "plausible" : "short";
    return wins ? "ruledOut" : "neither";
  });

  return { total, majority, plausible, short: short.sort((a, b) => b.seats - a.seats), ruledOut };
};
