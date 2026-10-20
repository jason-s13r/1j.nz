const CONFIG = {
  useTraditionalExclusions: true,
  useStatedExclusions: true,
  useDisputedExclusions: false,
  exclusions: {
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
    disputed: [
      "no", // National exclude Opportunities
    ],
  },
};
const config = CONFIG;

const labels = { n: "National", l: "Labour", g: "Green", a: "Act", z: "NZ First", m: "Te Pāti Māori", o: "Opportunity" };

const polls = [
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

const ALL = ["l","n","a","g","z","o","m","ln","la","lg","lz","na","ng","nz","lo","no","lm","nm","ag","az","gz","ao","go","zo","am","gm","zm","om","lna","lng","lnz","lno","lnm","lag","laz","lgz","nag","naz","ngz","lao","lgo","lzo","nao","ngo","nzo","lam","lgm","lzm","nam","ngm","nzm","lom","nom","agz","ago","azo","gzo","agm","azm","gzm","aom","gom","zom","lnag","lnaz","lngz","lnao","lngo","lnzo","lnam","lngm","lnzm","lnom","lagz","nagz","lago","lazo","lgzo","nago","nazo","ngzo","lagm","lazm","lgzm","nagm","nazm","ngzm","laom","lgom","lzom","naom","ngom","nzom","agzo","agzm","agom","azom","gzom","lnagz","lnago","lnazo","lngzo","lnagm","lnazm","lngzm","lnaom","lngom","lnzom","lagzo","nagzo","lagzm","nagzm","lagom","lazom","lgzom","nagom","nazom","ngzom","agzom","lnagzo","lnagzm","lnagom","lnazom","lngzom","lagzom","nagzom","lnagzom"];

const ruleTest = new Set([
  ...(config.useTraditionalExclusions ? config.exclusions.traditional : []),
  ...(config.useStatedExclusions ? config.exclusions.stated : []),
  ...(config.useDisputedExclusions ? config.exclusions.disputed : [])
])
  .values()
  .reduce(
    (match, rule) => {
      const pattern = new RegExp(`[${rule}].*[${rule}]`);
      const current = new Set(ALL.filter((coalition) => pattern.test(coalition)));
      return {
        accepted: match.accepted.difference(current),
        excluded: match.excluded.union(current),
      };
    },
    { accepted: new Set(ALL), excluded: new Set() },
  );

const ACCEPTED = ruleTest.accepted;
const REJECTED = ruleTest.excluded;

const coalitionWeight = (coalition, map, values) => {
  const max = Math.max(...coalition.split("").map((p) => map[p]));
  return max / values[coalition] / coalition.length;
};

const makeup = (n, l, g, a, z, m, o) => {
  const total = n + l + g + a + z + m + o;
  const map = { n, l, g, a, z, m, o };

  const zero = Object.entries(map).reduce((x, [k, v]) => v === 0 ? x + k : x, '');
  const zeroPattern = new RegExp(`[${zero}]`);

  const permutations = [...ACCEPTED, ...REJECTED].filter((coalition) => !zeroPattern.test(coalition));
  const permutationValues = permutations.reduce((v, coalition) => {
    return { ...v, [coalition]: coalition.split("").reduce((s, k) => s + map[k], 0) };
  }, {});
  const permutationWeights = permutations.reduce((v, coalition) => {
    return { ...v, [coalition]: coalitionWeight(coalition, map, permutationValues) };
  }, {});

  permutations.sort((a, b) => permutationWeights[b] - permutationWeights[a]);

  const { plausible, failed, rejected } = permutations.reduce(
    (list, coalition) => {
      const seats = permutationValues[coalition];
      const weight = permutationWeights[coalition];
      const win = seats > total / 2;
      const rejected = REJECTED.has(coalition);
      const outcome = { coalition, seats, total, weight, win, rejected };
      
      if (REJECTED.has(coalition)) {
        return { ...list, rejected: [...list.rejected, outcome] };
      }
      
      if (!win) {
        return { ...list, failed: [...list.failed, outcome] };
      }
        
      return { ...list, plausible: [...list.plausible, outcome] };
    },
    { plausible: [], failed: [], rejected: [] },
  );

  return {
    house: map,
    seats: total,
    pick: plausible[0],
    plausible,
    failed,
    rejected,
  };
};

const formatCoalition = (coalition) =>
  coalition
    .split("")
    .map((k) => labels[k])
    .join(" + ");

const formatScenario = ({ coalition, seats, total }) => {
  return `\t(${seats}/${total}) ${formatCoalition(coalition)}`;
};

const formatHouse = (house) => Object.entries(house).map(([k, v]) => `${labels[k]}: ${v}`);

const formatResult = ({ pollster, date, house, seats, pick, plausible, failed, rejected }) => {
  return [
    `${pollster} (${date})`,
    pick ? `Pick:\n${formatScenario(pick)}` : "HUNG PARLIAMENT",
    `Required Seats: ${Math.floor(seats / 2) + 1} of ${seats}`,
    `House:\n\t${formatHouse(house).join("\t")}`,
    `Plausible:\n${plausible.map(formatScenario).join("\n")}`,
    `Failed:\n${[...failed].sort((a, b) => b.seats - a.seats).filter(({seats, total}) => seats / total >= 2/5).map(formatScenario).join("\n")}`,
    `Ruled-Out:\n${rejected.filter(({seats, total, win}) => win && seats / total < 3/5).map(formatScenario).join("\n")}`,
  ].join("\n");
};

const results = polls.map(({ pollster, date, n, l, g, a, z, m, o }) => ({
  pollster,
  date,
  ...makeup(n, l, g, a, z, m, o),
}));

console.log(results.map(formatResult).join("\n\n"));
