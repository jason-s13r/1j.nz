export const labels = {
  n: "National",
  l: "Labour",
  g: "Green",
  a: "Act",
  z: "NZ First",
  m: "Te Pāti Māori",
  o: "Opportunity",
};

// A single-letter party key, e.g. "n" for National.
export type Party = keyof typeof labels;

export const PARTIES = Object.keys(labels) as Party[];

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

// Where the stated rule-outs come from.
export const STATED_SOURCE =
  "https://thespinoff.co.nz/politics/25-08-2026/the-rule-in-rule-out-game-is-ruining-one-of-the-best-things-about-mmp";

// The parties in the current government. Update after each election.
export const INCUMBENT: Party[] = ["n", "a", "z"];

// Traditional left and right blocs, used to seat a hung parliament. Opportunity sits with the
// left as National has ruled it out.
export const BLOCS: { left: Party[]; right: Party[] } = {
  left: ["l", "g", "m", "o"],
  right: ["n", "a", "z"],
};

// Parties polling but without seats in the current parliament. Update after each election.
export const OUTSIDE_PARLIAMENT: Party[] = ["o"];

// Pairs never in government together (coalition or confidence and supply) under MMP, since 1996.
// Remove a pair once it has been in government together.
export const NO_HISTORY: Pair[] = [
  "nl", // National, Labour
  "ng", // National, Greens (2009 memorandum of understanding only)
  "la", // Labour, Act
  "ga", // Greens, Act
  "lm", // Labour, Te Pāti Māori
  "gm", // Greens, Te Pāti Māori
  "zm", // NZ First, Te Pāti Māori
  "no", // Opportunity has never been in parliament
  "lo",
  "go",
  "ao",
  "zo",
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
    "gz", // Greens exclude NZ First
    "lz", // Labour exclude NZ First
    "mz", // Te Pāti Māori exclude NZ First
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
const COALITIONS = PARTIES.reduce<Party[][]>((all, party) => [...all, [party], ...all.map((c) => [...c, party])], []);

export const parties = (pair: Pair) => pair.split("") as Party[];

const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

export const makeup = (house: House, exclusions: Pair[]): Makeup => {
  const total = sum(Object.values(house));
  const majority = Math.floor(total / 2) + 1;
  const wins = ({ seats }: Outcome) => seats >= majority;
  const excluded = ({ members }: Outcome) =>
    exclusions.some((pair) => parties(pair).every((p) => members.includes(p)));
  // Favour coalitions led by a large party, with few partners.
  const weight = ({ members, seats }: Outcome) => house[members[0]] / seats / members.length;

  const outcomes = COALITIONS.filter((members) => members.every((p) => house[p] > 0))
    .map((members) => ({
      members: members.toSorted((a, b) => house[b] - house[a]),
      seats: sum(members.map((p) => house[p])),
    }))
    .sort((a, b) => weight(b) - weight(a));
  const allowed = outcomes.filter((outcome) => !excluded(outcome));

  return {
    total,
    majority,
    plausible: allowed.filter(wins),
    short: allowed.filter((outcome) => !wins(outcome)).sort((a, b) => b.seats - a.seats),
    ruledOut: outcomes.filter((outcome) => wins(outcome) && excluded(outcome)),
  };
};
