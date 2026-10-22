import { useContext } from "react";
import { BLOCS, majorityOf, seatedParties, seatsOf, type House, type Party } from "../combinations";
import { partyColour, PartyNames } from "./party";
import "./Chamber.scss";

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
// Extra space between the two halves of the chamber, at its midpoint.
const GAP = 1;
// Seats in the line at the midpoint, front to back: the front three rows, then the fourth and fifth.
const MIDPOINT_LINE = 5;

// Distance round a row from the end of the leg to the gap.
const curveLength = (radius: number) => (Math.PI / 2) * radius - GAP / 2;
// Where the front row's seats round the curve start and end, as a distance round it.
const FRONT_FIRST = curveLength(INNER) / CURVE_SEATS[0] / 2;
const FRONT_LAST = curveLength(INNER) - FRONT_FIRST;

interface Seat {
  x: number;
  y: number;
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
  const length = curveLength(radius);
  const n = CURVE_SEATS[row] ?? Math.floor(length);
  const curve = Array.from({ length: n }, (_, j) => {
    const along = length - ((j + 0.5) * length) / n;
    const angle = along / radius;
    const column = FRONT_LAST - (j / (n - 1)) * (FRONT_LAST - FRONT_FIRST);
    return { radius, column, dx: side * radius * Math.cos(angle), y: CURVE_START + radius * Math.sin(angle) };
  });
  const leg = LEG.toReversed().map((y) => ({ radius, column: y - CURVE_START, dx: side * radius, y }));
  return [...curve, ...leg];
};

// Alternate seats from each side, then whatever's left of the longer side.
const alternate = <T,>(a: T[], b: T[]) => [
  ...a.flatMap((seat, i) => (i < b.length ? [seat, b[i]] : [seat])),
  ...b.slice(a.length),
];

// From the foot round to the midpoint, front to back across the rows.
type Position = Pick<Seat, "column" | "radius">;
const fromTheFoot = (a: Position, b: Position) => a.column - b.column || a.radius - b.radius;

// One half of the chamber, as an offset from the centre line (dx) and a distance from the foot
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

// The chamber as two halves opening downwards, each ordered from its foot to the midpoint, and
// the House's seats left empty. The government side, with the Speaker's chair, takes as many of its
// House seats as it has members, and the other side the rest. Each side's seats empty in reverse:
// the opposition's Serjeant-at-Arms' and sixth-row seats, then the back rows from the outside in,
// then the front rows from the midpoint outward, after any overflow from the other side there.
// Beyond the House, the rows behind, alternating sides. Without a Speaker, as in a hung parliament
// with no majority to elect one, the chair stands empty.
const chamberSeats = (total: number, government: number, elected: boolean) => {
  const left = halfSeats(true, total);
  const right = halfSeats(false, total);
  const chair = { radius: 0, column: -Infinity, dx: 0, y: LEG[0], speaker: true };
  const speaker = elected ? [chair] : [];
  const leftHouse = [...left.front, ...left.back, ...left.last];
  const rightHouse = [...speaker, ...right.front, ...right.back];
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
    ...emptySeats([...speaker, ...right.front], right.back, onRight, Math.max(0, total - government - onLeft)),
    ...(elected ? [] : [chair]),
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

// Seats in the line nearest the midpoint first, front to back, then the next line out.
const fromTheAisle = (seats: Seat[]) => seats.toSorted((a, b) => b.column - a.column || a.radius - b.radius);

// Seat one side as slices of pizza: each party's slice runs back from its stretch of the front row,
// squeezed against its neighbours' to hold its MPs.
//
// The side's seats run as one strip from the foot round to the midpoint of its half, then on across
// the aisle through the other half's lines nearest it, front to back. The front row is shared out
// as filling the strip in that order would, so a party anchors on its own side's front row if it
// has seats there, and across the aisle only when it has none; except that every party gets a
// front-row seat, from the nearest party with one to spare.
//
// The rest of the strip goes party by party from the foot. Each slice meets the next midway between
// their front-row seats, and leans that edge as little as it can to take the seats it needs,
// bending the back rows more than those just behind the front.
const fillSide = (half: Seat[], across: Seat[], members: Party[]) => {
  // Across the aisle, columns carry on from the midpoint as if the other half were a mirror image.
  const beyond = 2 * curveLength(INNER) + GAP;
  const seats = [...half, ...across.map((seat) => ({ ...seat, column: beyond - seat.column }))];
  const parties: Party[] = new Array(seats.length);
  const inFront = (index: number) => seats[index].radius === INNER;
  const fronts = [...seats.keys()].filter(inFront);
  const sides = [...new Set(members)];
  const counts = sides.map((party) => members.filter((member) => member === party).length);

  const shares = sides.map((party) => fronts.filter((index) => members[index] === party).length);
  for (const [p, share] of shares.entries()) {
    if (share) continue;
    const [lender] = [...shares.keys()]
      .filter((q) => shares[q] > 1)
      .sort((a, b) => Math.abs(a - p) - Math.abs(b - p) || shares[b] - shares[a]);
    if (lender === undefined) break;
    shares[lender]--;
    shares[p]++;
  }
  let front = 0;
  const crusts = sides.map((party, p) => {
    const mine = fronts.slice(front, (front += shares[p]));
    for (const index of mine) parties[index] = party;
    counts[p] -= mine.length;
    return mine.map((index) => seats[index].column);
  });

  // The Speaker's chair, first from the foot, is the first party's.
  let rest = [...seats.keys()].filter((index) => parties[index] === undefined);
  if (seats[rest[0]]?.speaker) {
    parties[rest.shift()!] = sides[0];
    counts[0]--;
  }
  sides.forEach((party, p) => {
    const next = crusts.slice(p + 1).find((crust) => crust.length);
    const edge = next ? (Math.max(...crusts[p], -Infinity) + next[0]) / 2 : Infinity;
    // Along the legs, where the rows line up, the slices don't lean.
    const lean = ({ column, radius }: Seat) => (column - edge) / (column > 0 ? Math.sqrt(radius - INNER) : 1);
    const order = rest.toSorted((a, b) => lean(seats[a]) - lean(seats[b]) || seats[a].radius - seats[b].radius);
    for (const index of order.slice(0, counts[p])) parties[index] = party;
    rest = order.slice(counts[p]);
  });

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

// The house seated in a horseshoe-shaped chamber, with the government on the right leg. Without a
// government, the traditional bloc holding the largest party takes the right leg.
export default function Chamber({
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
  const seated = seatedParties(house);
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
  const { left: leftSeats, right: rightSeats, empty, width, height } = chamberSeats(
    total,
    sum(right.parties),
    government.length > 0,
  );

  // Each side fills its own half from the foot, largest party first, so the largest parties sit
  // nearest the Speaker. A side with more than half the house carries on across the aisle, through
  // the other side's lines nearest it. Its smallest party big enough to hold the line at the
  // midpoint and every seat across the aisle goes last, so it straddles the aisle in one block and
  // the smaller parties keep their own slices at home. With no party big enough, the smallest
  // parties cross the aisle whole and the one before them straddles it.
  const expand = (parties: Party[]) => parties.flatMap((party) => Array<Party>(house[party]).fill(party));
  const extra = ({ seats, parties }: { seats: Seat[]; parties: Party[] }) => sum(parties) - seats.length;
  // The side with more members than its half has seats first, if either.
  const [big, small] = [
    { seats: leftSeats, parties: left.parties },
    { seats: rightSeats, parties: right.parties },
  ].sort((a, b) => extra(b) - extra(a));
  const over = extra(big);
  const straddling = over > 0 ? big.parties.slice(1).findLast((party) => house[party] >= over + MIDPOINT_LINE) : undefined;
  const order = straddling ? [...big.parties.filter((party) => party !== straddling), straddling] : big.parties;
  const across = fromTheAisle(small.seats).slice(0, over);
  const placed = [
    ...fillSide(big.seats, across, expand(order)),
    ...fillSide(small.seats.filter((seat) => !across.includes(seat)), [], expand(small.parties)),
  ];
  const groups = seated.map((party) => ({ party, seats: placed.filter((seat) => seat.party === party) }));

  const majority = majorityOf(total);
  const floorY = Math.max(1, height - (CURVE_START + INNER) / 2);

  return (
    <figure className="chamber">
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
