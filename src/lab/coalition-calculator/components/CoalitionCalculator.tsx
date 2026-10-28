import { useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_EXCLUSIONS,
  ELECTION,
  EXCLUSIONS,
  INCUMBENT,
  labels,
  makeup,
  NO_HISTORY,
  OUTSIDE_PARLIAMENT,
  PARTIES,
  parties,
  STATED_SOURCE,
  type House,
  type Outcome,
  type Pair,
  type Party,
} from "../combinations";
import { elections, type Election } from "../elections";
import { averages, houseOf, polls, POLLS_SOURCE } from "../polls";
import Chamber from "./Chamber";
import { partyColour, PartyNames } from "./party";
import "./CoalitionCalculator.scss";

// Where the seats came from: a poll average, a poll or an election, by index, or null once edited by hand.
type Source = { kind: "average" | "poll" | "election"; index: number } | null;

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

// Coalitions shown before "View all": in each list of bars, and in the grid of chambers.
const LIST_LIMIT = 10;
const PLAUSIBLE_LIMIT = 8;

const hasPair = (pairs: Pair[], a: Party, b: Party) => pairs.some((pair) => pair.includes(a) && pair.includes(b));

const added = (party: Party) => !(party in labels);

const STATED = `Ruled out for ${ELECTION}`;

// Why a pair of parties might not govern together.
const groupOf = (a: Party, b: Party) => {
  if (added(a) || added(b)) return "Added parties";
  if (hasPair([...EXCLUSIONS.stated, ...EXCLUSIONS.disputed], a, b)) return STATED;
  if (OUTSIDE_PARLIAMENT.includes(a) || OUTSIDE_PARLIAMENT.includes(b)) return "Outside parliament";
  if (hasPair(NO_HISTORY, a, b)) return "Never governed together";
  return "Governed together";
};

// Every pair of parties.
const pairsOf = (keys: Party[]) =>
  keys.flatMap((a, i) =>
    keys.slice(i + 1).map((b) => ({
      pair: a + b,
      group: groupOf(a, b),
      // Both in the current government.
      incumbent: INCUMBENT.includes(a) && INCUMBENT.includes(b),
      // Ruled out, but not expected to hold.
      unlikelyToHold: hasPair(EXCLUSIONS.disputed, a, b),
    })),
  );

// The default rule-outs, in the same letter order as the pairs listed.
const defaultExcluded = () =>
  new Set(
    pairsOf(PARTIES)
      .map(({ pair }) => pair)
      .filter(([a, b]) => hasPair(DEFAULT_EXCLUSIONS, a, b)),
  );

const GROUPS: { label: ReturnType<typeof groupOf>; source?: string }[] = [
  { label: STATED, source: STATED_SOURCE },
  { label: "Governed together" },
  { label: "Never governed together" },
  { label: "Outside parliament" },
  { label: "Added parties" },
];

const groupsOf = (keys: Party[]) => {
  const pairs = pairsOf(keys);
  return GROUPS.map((group) => ({ ...group, pairs: pairs.filter((p) => p.group === group.label) })).filter(
    ({ pairs }) => pairs.length,
  );
};

const percent = (fraction: number) => `${(fraction * 100).toFixed(2)}%`;

const coalitionLabel = (members: Party[], names: Record<Party, string>) => members.map((p) => names[p]).join(" + ");

function Exclusions({ excluded, onChange }: { excluded: Set<Pair>; onChange: (excluded: Set<Pair>) => void }) {
  const names = useContext(PartyNames);

  const toggle = (pair: Pair, checked: boolean) => {
    const next = new Set(excluded);
    if (checked) next.add(pair);
    else next.delete(pair);
    onChange(next);
  };

  return (
    <fieldset className="exclusions" aria-label="Ruled-out partnerships">
      <h3>
        Ruled-out partnerships <span className="exclusion-count">{excluded.size} ruled out</span>
      </h3>
      <p className="hint">Parties that refuse to govern together.</p>
      {groupsOf(Object.keys(names)).map(({ label, source, pairs }) => (
        // Only the stated rule-outs start open; the rest are there to explore.
        <details key={label} className="exclusion-group" open={label === STATED}>
          <summary>
            <h4>{label}</h4>{" "}
            <span className="exclusion-count">
              {pairs.filter(({ pair }) => excluded.has(pair)).length} of {pairs.length} ruled out
            </span>
            {source && (
              <a className="exclusion-tag" href={source} title="The Spinoff">
                Source
              </a>
            )}
          </summary>
          <ul className="exclusion-list">
            {pairs.map(({ pair, incumbent, unlikelyToHold }) => (
              <li key={pair}>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={excluded.has(pair)}
                    onChange={(e) => toggle(pair, e.target.checked)}
                  />
                  <span>{coalitionLabel(parties(pair), names)}</span>
                </label>
                {incumbent && (
                  <span className="exclusion-tag" title="Both in the current government">
                    Incumbent
                  </span>
                )}
                {unlikelyToHold && (
                  <span className="exclusion-tag" title="Ruled out repeatedly in the media, but not expected to hold, so not ticked by default">
                    Unlikely to hold
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </fieldset>
  );
}

function SeatField({ value, onChange, label }: { value: number; onChange: (value: number) => void; label?: string }) {
  // While focused, show what was typed (including an empty field) rather than
  // the parsed value, so clearing the field doesn't snap back to 0.
  const [text, setText] = useState<string | null>(null);

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      aria-label={label}
      value={text ?? value}
      onChange={(e) => {
        setText(e.target.value);
        const v = parseInt(e.target.value, 10);
        onChange(Number.isNaN(v) ? 0 : Math.max(0, v));
      }}
      onBlur={() => setText(null)}
    />
  );
}

function SeatInput({ party, value, onChange }: { party: Party; value: number; onChange: (value: number) => void }) {
  const names = useContext(PartyNames);

  return (
    <label className="seat-input">
      <span className="swatch" style={{ background: partyColour(party) }} />
      <span>{names[party]}</span>
      <SeatField value={value} onChange={onChange} />
    </label>
  );
}

// An added party, with its name editable.
function AddedSeatInput({
  party,
  value,
  onChange,
  onRename,
  onRemove,
}: {
  party: Party;
  value: number;
  onChange: (value: number) => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const name = useContext(PartyNames)[party];

  return (
    <div className="seat-input">
      <span className="swatch" style={{ background: partyColour(party) }} />
      <input type="text" aria-label="Party name" value={name} onChange={(e) => onRename(e.target.value)} />
      <SeatField value={value} onChange={onChange} label={`${name} seats`} />
      <button type="button" className="remove-party" aria-label={`Remove ${name}`} title="Remove" onClick={onRemove}>
        ×
      </button>
    </div>
  );
}

// A coalition in a small chamber, with it on the governing side.
function CoalitionCard({ outcome, house, total }: { outcome: Outcome; house: House; total: number }) {
  const names = useContext(PartyNames);

  return (
    <>
      <div className="coalition-head">{coalitionLabel(outcome.members, names)}</div>
      <Chamber house={house} government={outcome.members} label={`${outcome.seats} / ${total}`} />
    </>
  );
}

// A coalition as a bar of its parties' seats, against the majority line.
function CoalitionRow({
  outcome: { members, seats },
  house,
  total,
  majority,
}: {
  outcome: Outcome;
  house: House;
  total: number;
  majority: number;
}) {
  const names = useContext(PartyNames);
  const majorityAt = percent(majority / total);

  return (
    <>
      <div className="coalition-head">
        <span>{coalitionLabel(members, names)}</span>
        <span className="coalition-seats">
          {seats} / {total}
        </span>
      </div>
      <div className="seat-bar">
        <div className="seat-bar-fill" style={{ width: percent(seats / total) }}>
          {members.map((p) => (
            <span
              key={p}
              className="seat-bar-segment"
              style={{ flexGrow: house[p], background: partyColour(p) }}
              title={`${names[p]}: ${house[p]}`}
            />
          ))}
        </div>
        <span className="seat-bar-majority" style={{ left: majorityAt }} title={`Majority: ${majority}`} />
        <span className="seat-bar-majority-label" style={{ left: majorityAt }}>
          Needs {majority} seats to govern
        </span>
      </div>
    </>
  );
}

// A titled list of coalitions, showing the first few until "View all".
function ResultSection({
  title,
  hint,
  outcomes,
  limit,
  className,
  empty,
  children,
}: {
  title: string;
  hint: string;
  outcomes: Outcome[];
  limit: number;
  className: string;
  // Shown in place of the coalitions when there are none.
  empty: ReactNode;
  children: (outcome: Outcome) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? outcomes : outcomes.slice(0, limit);

  return (
    <section className="result-section">
      <h3>{title}</h3>
      <p className="hint">{hint}</p>
      <ul className={className}>
        {outcomes.length ? (
          shown.map((outcome) => (
            <li key={outcome.members.join("")}>
              {children(outcome)}
            </li>
          ))
        ) : (
          <li>{empty}</li>
        )}
      </ul>
      {outcomes.length > limit && (
        <button type="button" className="link-button" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show fewer" : `View all (${outcomes.length})`}
        </button>
      )}
    </section>
  );
}

export default function CoalitionCalculator() {
  const [source, setSource] = useState<Source>({ kind: "average", index: 0 });
  const [names, setNames] = useState<Record<Party, string>>(labels);
  const [house, setHouse] = useState<House>(() => averages[0].seats);
  const [excluded, setExcluded] = useState(defaultExcluded);

  const { total, majority, plausible, short, ruledOut } = useMemo(
    () => makeup(house, [...excluded]),
    [house, excluded],
  );

  // A poll or election starts afresh, without any added parties or their rule-outs. Parties an
  // election had that have since gone come in as added parties.
  const load = (next: Source, seats: House, others: Election["others"] = []) => {
    setSource(next);
    setNames({ ...labels, ...Object.fromEntries(others.map(({ party, name }) => [party, name])) });
    setHouse({ ...seats, ...Object.fromEntries(others.map(({ party, seats }) => [party, seats])) });
    setExcluded((e) => new Set([...e].filter((pair) => parties(pair).every((party) => party in labels))));
  };

  const onAverage = (index: number) => load({ kind: "average", index }, averages[index].seats);

  const onPoll = (index: number) => load({ kind: "poll", index }, houseOf(polls[index]));

  const onElection = (index: number) => load({ kind: "election", index }, elections[index].seats, elections[index].others);

  const onSeats = (party: Party, seats: number) => {
    setSource(null);
    setHouse((h) => ({ ...h, [party]: seats }));
  };

  const addParty = () => {
    const party = LETTERS.find((letter) => !(letter in names))!;
    setNames((n) => ({ ...n, [party]: "New party" }));
    setHouse((h) => ({ ...h, [party]: 0 }));
  };

  const removeParty = (party: Party) => {
    // Its seats no longer match the poll or election.
    if (house[party]) setSource(null);
    setNames(({ [party]: _, ...n }) => n);
    setHouse(({ [party]: _, ...h }) => h);
    setExcluded((e) => new Set([...e].filter((pair) => !pair.includes(party))));
  };

  const row = (outcome: Outcome) => <CoalitionRow outcome={outcome} house={house} total={total} majority={majority} />;
  const none = <p className="empty">None</p>;

  return (
    <PartyNames value={names}>
      <div className="coalition-calculator">
        <section className="inputs">
          <div className="house-inputs">
            <h3>Party seat allocations</h3>
            <div className="source">
              <label>
                <span>Poll average</span>
                <select
                  value={source?.kind === "average" ? source.index : ""}
                  onChange={(e) => onAverage(Number(e.target.value))}
                >
                  <option value="" disabled>
                    Choose an average
                  </option>
                  {averages.map(({ label, count }, i) => (
                    <option key={label} value={i}>
                      {label} ({count} {count === 1 ? "poll" : "polls"})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Poll</span>
                <select
                  value={source?.kind === "poll" ? source.index : ""}
                  onChange={(e) => onPoll(Number(e.target.value))}
                >
                  <option value="" disabled>
                    Choose a poll
                  </option>
                  {polls.map(({ publisher, pollster, date }, i) => (
                    <option key={i} value={i}>
                      {publisher} ({date})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Election result</span>
                <select
                  value={source?.kind === "election" ? source.index : ""}
                  onChange={(e) => onElection(Number(e.target.value))}
                >
                  <option value="" disabled>
                    Choose an election
                  </option>
                  {elections.map(({ year, date }, i) => (
                    <option key={year} value={i}>
                      {year} ({date})
                    </option>
                  ))}
                </select>
              </label>
              <p className="hint">
                Poll seat projections and election results from{" "}
                <a href={source?.kind === "election" ? elections[source.index].source : POLLS_SOURCE}>Wikipedia</a>.
                Edit any party to use your own numbers, or add your own parties.
              </p>
            </div>

            <div className="seat-inputs">
              {PARTIES.map((party) => (
                <SeatInput key={party} party={party} value={house[party]} onChange={(seats) => onSeats(party, seats)} />
              ))}
              {Object.keys(names)
                .filter(added)
                .map((party) => (
                  <AddedSeatInput
                    key={party}
                    party={party}
                    value={house[party]}
                    onChange={(seats) => onSeats(party, seats)}
                    onRename={(name) => setNames((n) => ({ ...n, [party]: name }))}
                    onRemove={() => removeParty(party)}
                  />
                ))}
              {Object.keys(names).length < LETTERS.length && (
                <div className="seat-input">
                  <button type="button" className="add-party" title="Add a party" onClick={addParty}>
                    + Add
                  </button>
                </div>
              )}
              <p className="seat-input house-total">
                <span>
                  {total} seats, {majority} for a majority
                </span>
              </p>
            </div>
          </div>

          <Exclusions excluded={excluded} onChange={setExcluded} />
        </section>

        <section className="results">
          <ResultSection
            title="Plausible Coalitions"
            hint="Majority coalitions without a ruled-out partnership."
            outcomes={plausible}
            limit={PLAUSIBLE_LIMIT}
            className="coalition-grid"
            empty={
              <>
                <p className="hung">Hung parliament: no permitted coalition reaches {majority} seats.</p>
                <Chamber house={house} government={[]} label="Hung" />
              </>
            }
          >
            {(outcome) => <CoalitionCard outcome={outcome} house={house} total={total} />}
          </ResultSection>
          <div className="side-by-side">
            <ResultSection
              title="Short of a majority"
              hint="Coalitions without a ruled-out partnership or a majority."
              outcomes={short}
              limit={LIST_LIMIT}
              className="coalition-list"
              empty={none}
            >
              {row}
            </ResultSection>
            <ResultSection
              title="Ruled out"
              hint="Majorities that include a ruled-out partnership."
              outcomes={ruledOut}
              limit={LIST_LIMIT}
              className="coalition-list"
              empty={none}
            >
              {row}
            </ResultSection>
          </div>
        </section>
      </div>
    </PartyNames>
  );
}
