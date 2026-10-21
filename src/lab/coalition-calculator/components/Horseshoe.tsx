import { useContext } from "react";
import { BLOCS, majorityOf, seatsOf, type House, type Party } from "../combinations";
import { partyColour, PartyNames } from "./party";
import "./Horseshoe.scss";

// Positions are in units of one seat spacing.
const SEAT_RADIUS = 0.36;
const SPEAKER_RING = 0.1;
// Distance of each seat along a leg from its foot, in benches of two, two, two, two, one and one,
// as in the House.
const LEG = [0.5, 1.3, 2.45, 3.25, 4.4, 5.2, 6.35, 7.15, 8.3, 9.45];
// Radius of the innermost row, setting the width of the floor between the legs.
const INNER = 3.5;
// Where the curve starts, just past the end of the legs.
const CURVE_START = LEG.at(-1)! + 0.25;
// Seats round the curve in each of the front three rows, as in the House. Rows behind take as
// many as fit.
const CURVE_SEATS = [4, 6, 9];
// Seats nearest the midpoint in the fourth and fifth rows, as in the House.
const BACK_SEATS = 6;
// The opposition's single seat in the sixth row, counted from the midpoint, as in the House.
const SIXTH_ROW_SEAT = 4;
// Extra space between the two halves of the horseshoe, at its midpoint.
const GAP = 1;

// Distance round a row from the end of the leg to the gap.
const curveLength = (radius: number) => (Math.PI / 2) * radius - GAP / 2;
// Where the front row's seats round the curve start and end, as a distance round it.
const FRONT_FIRST = curveLength(INNER) / CURVE_SEATS[0] / 2;
const FRONT_LAST = curveLength(INNER) - FRONT_FIRST;

interface Seat {
  x: number;
  y: number;
  // Behind the front three rows.
  back: boolean;
  // How far round the curve from the end of the leg (negative along the leg), scaled to the front
  // row, so a seat is directly behind those in front with the same. Each row's first and last seats
  // round the curve line up with the front row's.
  column: number;
  // Distance from the centre.
  radius: number;
  // The Speaker's chair, at the foot between the legs.
  speaker?: boolean;
}

// One row of one half (side -1 for the left, 1 for the right), from the midpoint round the curve
// and down the leg to its foot.
const rowSeats = (row: number, side: number) => {
  const radius = INNER + row;
  const back = row >= CURVE_SEATS.length;
  const length = curveLength(radius);
  const n = CURVE_SEATS[row] ?? Math.floor(length);
  const curve = Array.from({ length: n }, (_, j) => {
    const along = length - ((j + 0.5) * length) / n;
    const angle = along / radius;
    const column = FRONT_LAST - (j / (n - 1)) * (FRONT_LAST - FRONT_FIRST);
    return { radius, column, back, dx: side * radius * Math.cos(angle), y: CURVE_START + radius * Math.sin(angle) };
  });
  const leg = LEG.toReversed().map((y) => ({ radius, column: y - CURVE_START, back, dx: side * radius, y }));
  return [...curve, ...leg];
};

// Alternate seats from each side, then whatever's left of the longer side.
const alternate = <T,>(a: T[], b: T[]) => [
  ...a.flatMap((seat, i) => (i < b.length ? [seat, b[i]] : [seat])),
  ...b.slice(a.length),
];

// From the foot round to the midpoint, front to back across the rows.
const fromTheFoot = (a: { column: number; radius: number }, b: { column: number; radius: number }) =>
  a.column - b.column || a.radius - b.radius;

// One half of the horseshoe, as an offset from the centre line (dx) and a distance from the foot
// of the leg (y), split into the order its seats are taken. On the opposition side, the fifth
// row's seat by the midpoint is the Serjeant-at-Arms', and the sixth row has a single seat a few
// along from the midpoint, as in the House.
const halfSeats = (opposition: boolean, total: number) => {
  const row = (n: number) => rowSeats(n, opposition ? -1 : 1);
  const [fourth, fifth, sixth] = [3, 4, 5].map(row);
  // Rows behind the House's seats fill from the midpoint round to the foot, one row at a time.
  const behind = [
    ...fourth.slice(BACK_SEATS),
    ...fifth.slice(BACK_SEATS),
    ...sixth.filter((_, i) => !opposition || i !== SIXTH_ROW_SEAT),
  ];
  for (let n = 6; behind.length < total; n++) {
    behind.push(...row(n));
  }
  return {
    // The front three rows, so a small house sits together by the Speaker.
    front: [0, 1, 2].flatMap(row).sort(fromTheFoot),
    // The fourth row then the fifth, each from the midpoint outward.
    back: [...fourth.slice(0, BACK_SEATS), ...fifth.slice(opposition ? 1 : 0, BACK_SEATS)],
    // The sixth row's seat, then the Serjeant-at-Arms'.
    last: opposition ? [sixth[SIXTH_ROW_SEAT], fifth[0]] : [],
    behind,
  };
};

// The horseshoe as two halves opening downwards, each ordered from its foot to the midpoint, and
// the House's seats left empty. The government side, with the Speaker's chair, takes as many of its
// House seats as it has members, and the other side the rest. Each side's seats empty in reverse:
// the opposition's Serjeant-at-Arms' and sixth-row seats, then the back rows from the outside in,
// then the front rows from the midpoint outward, after any overflow from the other side there.
// Beyond the House, the rows behind, alternating sides.
const horseshoeSeats = (total: number, government: number) => {
  const left = halfSeats(true, total);
  const right = halfSeats(false, total);
  const speaker = { radius: 0, column: -Infinity, back: false, dx: 0, y: LEG[0], speaker: true };
  const leftHouse = [...left.front, ...left.back, ...left.last];
  const rightHouse = [speaker, ...right.front, ...right.back];
  const inHouse = Math.min(total, leftHouse.length + rightHouse.length);
  const onRight = Math.min(rightHouse.length, Math.max(government, inHouse - leftHouse.length));
  const onLeft = inHouse - onRight;

  const emptySeats = <T,>(front: T[], behind: T[], count: number, overflow: number) => {
    const empty = front.length + behind.length - count;
    const rest = Math.max(0, empty - behind.length);
    return [...behind.toReversed().slice(0, empty), ...front.toReversed().slice(overflow, overflow + rest)];
  };
  const empty = [
    ...emptySeats(left.front, [...left.back, ...left.last], onLeft, Math.max(0, government - onRight)),
    ...emptySeats([speaker, ...right.front], right.back, onRight, Math.max(0, total - government - onLeft)),
  ];
  const isEmpty = new Set(empty);
  const taken = [
    ...[...leftHouse, ...rightHouse].filter((seat) => !isEmpty.has(seat)),
    ...alternate(left.behind, right.behind).slice(0, total - inHouse),
  ];

  const all = [...taken, ...empty];
  const cx = Math.max(...all.map(({ dx }) => Math.abs(dx))) + 0.5;
  const height = Math.max(...all.map(({ y }) => y)) + 0.5;

  // Flip y so the feet of the legs are at the bottom.
  const place = ({ dx, y, ...seat }: (typeof all)[number]): Seat => ({ ...seat, x: cx + dx, y: height - y });
  const half = (leftSide: boolean) =>
    taken
      .filter(({ dx }) => dx < 0 === leftSide)
      .sort(fromTheFoot)
      .map(place);
  return { left: half(true), right: half(false), empty: empty.map(place), width: 2 * cx, height };
};

// Seats in the back rows nearest the midpoint first, then the front rows nearest the midpoint.
const fromTheBack = (seats: Seat[]) =>
  [...seats.keys()].sort(
    (a, b) =>
      Number(seats[b].back) - Number(seats[a].back) ||
      seats[b].column - seats[a].column ||
      seats[b].radius - seats[a].radius,
  );

// Seat any overflow from the other side at the back, then fill the rest with this half's own side
// from the foot, front to back across the rows, so each party sits in a block behind its stretch of
// the front row. Any party left without a front-row seat takes the nearest one, moving to the front
// of the line behind it or swapping its nearest seat for it, and a party left without one in turn
// does the same.
const fillHalf = (seats: Seat[], own: Party[], overflow: Party[]) => {
  const placed: (Party | undefined)[] = new Array(seats.length);
  fromTheBack(seats)
    .slice(0, overflow.length)
    .forEach((index, i) => (placed[index] = overflow[i]));
  let next = 0;
  const parties = seats.map((_, index) => placed[index] ?? own[next++]);
  const ownParties = new Set(own);

  const inFront = (index: number) => seats[index].radius === INNER;
  const seatsOf = (party: Party) => [...seats.keys()].filter((index) => parties[index] === party);
  const fronts = (party: Party) => seatsOf(party).filter(inFront).length;
  const distance = (a: number, b: number) => Math.abs(seats[a].column - seats[b].column);
  // Parties that have taken a front-row seat keep it.
  const settled = new Set<Party>();
  const lacking = [...ownParties].filter((party) => !fronts(party));
  for (let party = lacking.shift(); party !== undefined; party = lacking.shift()) {
    settled.add(party);
    const mine = seatsOf(party);
    const near = (index: number) => Math.min(...mine.map((m) => distance(index, m)));
    const [taken] = [...seats.keys()]
      .filter((index) => inFront(index) && ownParties.has(parties[index]) && !settled.has(parties[index]))
      .sort((a, b) => near(a) - near(b) || fronts(parties[b]) - fronts(parties[a]));
    if (taken === undefined) continue;
    const owner = parties[taken];
    // Move to the front of the line of seats behind it, or swap for its nearest seat if it has none there.
    const line = [...seats.keys()]
      .filter((index) => seats[index].column === seats[taken].column)
      .sort((a, b) => seats[a].radius - seats[b].radius);
    if (line.some((index) => parties[index] === party)) {
      const moved = line.map((index) => parties[index]).sort((a, b) => Number(b === party) - Number(a === party));
      line.forEach((index, i) => (parties[index] = moved[i]));
    } else {
      const [given] = mine.toSorted((a, b) => distance(a, taken) - distance(b, taken) || seats[b].radius - seats[a].radius);
      [parties[taken], parties[given]] = [parties[given], parties[taken]];
    }
    if (!fronts(owner)) lacking.push(owner);
  }

  return seats.map((seat, index) => ({ ...seat, party: parties[index] }));
};

function PartyKey({ parties, house, opposition }: { parties: Party[]; house: House; opposition: boolean }) {
  const names = useContext(PartyNames);
  return (
    <ul>
      {parties.map((party) => (
        <li key={party}>
          <span className={opposition ? "swatch opposition" : "swatch"} style={{ background: partyColour(party) }} />
          {names[party]} {house[party]}
        </li>
      ))}
    </ul>
  );
}

// The house as a horseshoe, with the government on the right leg. Without a government, the
// traditional bloc holding the largest party takes the right leg.
export default function Horseshoe({
  house,
  government,
  label,
}: {
  house: House;
  government: Party[];
  // Text in the middle of the floor, between the legs.
  label?: string;
}) {
  const names = useContext(PartyNames);
  // Largest first.
  const seated = Object.keys(house)
    .filter((party) => house[party] > 0)
    .sort((a, b) => house[b] - house[a]);
  if (!seated.length) {
    return null;
  }

  const [leftLabel, rightLabel, rightMembers] = government.length
    ? ["Opposition", "Government", government]
    : BLOCS.left.includes(seated[0])
      ? ["Right bloc", "Left bloc", BLOCS.left]
      : ["Left bloc", "Right bloc", BLOCS.right];
  const left = { label: leftLabel, parties: seated.filter((p) => !rightMembers.includes(p)) };
  const right = { label: rightLabel, parties: seated.filter((p) => rightMembers.includes(p)) };

  const sum = (parties: Party[]) => seatsOf(house, parties);
  const total = sum(seated);
  // Faded behind the government; a hung parliament has no government, so nothing fades.
  const inOpposition = (party: Party) => government.length > 0 && !government.includes(party);
  const { left: leftSeats, right: rightSeats, empty, width, height } = horseshoeSeats(total, sum(right.parties));

  // Each side fills its own half from the foot, largest party first, so the largest parties sit
  // nearest the Speaker. A side with more than half the house carries on across the aisle, at the
  // back of the other side.
  const expand = (parties: Party[]) => parties.flatMap((party) => Array<Party>(house[party]).fill(party));
  const leftOrder = expand(left.parties);
  const rightOrder = expand(right.parties);
  const placed = [
    ...fillHalf(leftSeats, leftOrder.slice(0, leftSeats.length), rightOrder.slice(rightSeats.length)),
    ...fillHalf(rightSeats, rightOrder.slice(0, rightSeats.length), leftOrder.slice(leftSeats.length)),
  ];
  const groups = seated.map((party) => ({ party, seats: placed.filter((seat) => seat.party === party) }));

  const majority = majorityOf(total);
  const floorY = Math.max(1, height - (CURVE_START + INNER) / 2);

  return (
    <figure className="horseshoe">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${left.label} ${sum(left.parties)} seats, ${right.label} ${sum(right.parties)} seats, ${majority} needed to govern`}
      >
        <g className="empty-seats">
          {empty.map(({ x, y }, i) => (
            <circle key={i} cx={x} cy={y} r={SEAT_RADIUS} />
          ))}
        </g>
        {groups.map(({ party, seats }) => (
          <g
            key={party}
            className={inOpposition(party) ? "opposition" : undefined}
            style={{ fill: partyColour(party) }}
          >
            <title>{`${names[party]}: ${house[party]}`}</title>
            {seats.map(({ x, y, speaker }, i) =>
              speaker ? (
                // A ring, the same size as a seat.
                <circle
                  key={i}
                  className="speaker"
                  cx={x}
                  cy={y}
                  r={SEAT_RADIUS - SPEAKER_RING / 2}
                  style={{ stroke: partyColour(party), strokeWidth: SPEAKER_RING }}
                />
              ) : (
                <circle key={i} cx={x} cy={y} r={SEAT_RADIUS} />
              ),
            )}
          </g>
        ))}
        {label && (
          <text
            x={width / 2}
            y={floorY - 0.8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={1.2}
            fill="currentColor"
          >
            {label}
          </text>
        )}
        <text
          className="majority-label"
          x={width / 2}
          y={label ? floorY + 0.8 : floorY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={0.8}
        >
          {majority} to govern
        </text>
      </svg>
      <figcaption>
        {[left, right].map(({ label, parties }) => (
          <div key={label}>
            {label} {sum(parties)}
            <PartyKey parties={parties} house={house} opposition={parties.some(inOpposition)} />
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
