import { useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_EXCLUSIONS,
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
import { polls, POLLS_SOURCE, type Poll } from "../polls";
import Horseshoe from "./Horseshoe";
import { partyColour, PartyNames } from "./party";
import "./CoalitionCalculator.scss";

const CUSTOM = "custom";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

// Coalitions shown before "View all": in each list of bars, and in the grid of horseshoes.
const LIST_LIMIT = 10;
const PLAUSIBLE_LIMIT = 8;

const hasPair = (pairs: Pair[], a: Party, b: Party) => pairs.some((pair) => pair.includes(a) && pair.includes(b));

const added = (party: Party) => !(party in labels);

// Why a pair of parties might not govern together.
const groupOf = (a: Party, b: Party) => {
  if (added(a) || added(b)) return "Added parties";
  if (hasPair([...EXCLUSIONS.stated, ...EXCLUSIONS.disputed], a, b)) return "Stated";
  if (OUTSIDE_PARLIAMENT.includes(a) || OUTSIDE_PARLIAMENT.includes(b)) return "Outside parliament";
  if (hasPair(NO_HISTORY, a, b)) return "No history";
  return "Worked together";
};

// Every pair of parties.
const pairsOf = (keys: Party[]) =>
  keys.flatMap((a, i) =>
    keys.slice(i + 1).map((b) => ({
      pair: a + b,
      group: groupOf(a, b),
      // Both in the current government.
      incumbent: INCUMBENT.includes(a) && INCUMBENT.includes(b),
      // Ruled out by default.
      excluded: hasPair(DEFAULT_EXCLUSIONS, a, b),
    })),
  );

const groupsOf = (keys: Party[]) =>
  [
    { label: "Stated", source: STATED_SOURCE },
    { label: "Worked together" },
    { label: "No history" },
    { label: "Outside parliament" },
    { label: "Added parties" },
  ]
    .map((group) => ({ ...group, pairs: pairsOf(keys).filter((p) => p.group === group.label) }))
    .filter(({ pairs }) => pairs.length);

const houseOf = ({ pollster, date, ...house }: Poll): House => house;

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
    <details className="exclusions">
      <summary>
        Ruled-out partnerships <span className="exclusion-count">{excluded.size} ruled out</span>
      </summary>
      <p className="hint">Parties that refuse to govern together.</p>
      <fieldset aria-label="Ruled-out partnerships">
        {groupsOf(Object.keys(names)).map(({ label, source, pairs }) => (
          <div key={label} className="exclusion-group">
            <div className="exclusion-heading">
              <h4>{label}</h4>
              {source && (
                <a className="exclusion-tag" href={source} title="The Spinoff">
                  Source
                </a>
              )}
            </div>
            <ul className="exclusion-list">
              {pairs.map(({ pair, incumbent }) => (
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
                </li>
              ))}
            </ul>
          </div>
        ))}
      </fieldset>
    </details>
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
      <span className="seat-input-label">{names[party]}</span>
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

// A coalition as a small horseshoe, with it on the governing side.
function CoalitionCard({ outcome, house, total }: { outcome: Outcome; house: House; total: number }) {
  const names = useContext(PartyNames);

  return (
    <>
      <div className="coalition-head">{coalitionLabel(outcome.members, names)}</div>
      <Horseshoe house={house} government={outcome.members} label={`${outcome.seats} / ${total}`} />
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
        <span className="seat-bar-majority" style={{ left: percent(majority / total) }} title={`Majority: ${majority}`} />
        <span className="seat-bar-majority-label" style={{ left: percent(majority / total) }}>
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
            <li key={outcome.members.join("")} className="coalition">
              {children(outcome)}
            </li>
          ))
        ) : (
          <li className="coalition">{empty}</li>
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
  const [source, setSource] = useState<string>("0");
  const [names, setNames] = useState<Record<Party, string>>(labels);
  const [house, setHouse] = useState<House>(() => houseOf(polls[0]));
  const [excluded, setExcluded] = useState(
    () => new Set(pairsOf(PARTIES).flatMap((p) => (p.excluded ? [p.pair] : []))),
  );

  const { total, majority, plausible, short, ruledOut } = useMemo(
    () => makeup(house, [...excluded]),
    [house, excluded],
  );

  const onSource = (value: string) => {
    setSource(value);
    if (value !== CUSTOM) {
      // Added parties keep their seats, as polls don't cover them.
      setHouse((h) => ({ ...h, ...houseOf(polls[Number(value)]) }));
    }
  };

  const onSeats = (party: Party, seats: number) => {
    setSource(CUSTOM);
    setHouse((h) => ({ ...h, [party]: seats }));
  };

  const addParty = () => {
    const party = LETTERS.find((letter) => !(letter in names))!;
    setNames((n) => ({ ...n, [party]: "New party" }));
    setHouse((h) => ({ ...h, [party]: 0 }));
  };

  const removeParty = (party: Party) => {
    setNames(({ [party]: _, ...n }) => n);
    setHouse(({ [party]: _, ...h }) => h);
    setExcluded((e) => new Set([...e].filter((pair) => !pair.includes(party))));
  };

  const row = (outcome: Outcome) => <CoalitionRow outcome={outcome} house={house} total={total} majority={majority} />;
  const none = <p className="empty">None</p>;

  return (
    <PartyNames value={names}>
      <div className="coalition-calculator">
        <section className="panel inputs">
          <label className="source">
            <span>Seats from</span>
            <select value={source} onChange={(e) => onSource(e.target.value)}>
              <option value={CUSTOM}>Custom</option>
              {polls.map(({ pollster, date }, i) => (
                <option key={i} value={i}>
                  {pollster} ({date})
                </option>
              ))}
            </select>
          </label>
          <p className="hint">
            Poll seat projections from <a href={POLLS_SOURCE}>Wikipedia</a>. Edit any party to use your own numbers, or
            add your own parties.
          </p>

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
          </div>
          {Object.keys(names).length < LETTERS.length && (
            <button type="button" className="link-button" onClick={addParty}>
              Add a party
            </button>
          )}
          <p className="house-total">
            {total} seats, {majority} for a majority
          </p>

          <Exclusions excluded={excluded} onChange={setExcluded} />
        </section>

        <section className="panel results">
          <ResultSection
            title="Plausible Coalitions"
            hint="Majority coalitions without a ruled-out partnership."
            outcomes={plausible}
            limit={PLAUSIBLE_LIMIT}
            className="coalition-grid"
            empty={
              <>
                <p className="hung">Hung parliament: no permitted coalition reaches {majority} seats.</p>
                <Horseshoe house={house} government={[]} />
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
