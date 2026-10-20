import { BLOCS, labels, PARTIES, type House, type Party } from "../combinations";
import { partyColour } from "./party";
import "./Horseshoe.scss";

// Positions are in units of one seat spacing.
const SEAT_RADIUS = 0.36;
// Each leg is a fixed block of benches; the curve at the back takes as many rows as it needs.
const LEG_ROWS = 3;
const LEG_COLUMNS = 9;
// Radius of the innermost row, setting the width of the floor between the legs.
const INNER = 3.5;
// Seats in each half of the curve's rows that carry on from the leg benches, front to back.
const CURVE_ROWS = [5, 7, 10];
// Seats in each half of every row behind those, sitting at the back by the midpoint.
const BACK_ROW_SEATS = 6;
// Extra space between the two halves of the horseshoe, at its midpoint.
const GAP = 1;
// Extra space for the aisle between each leg and the curve.
const AISLE = 1;

interface Seat {
  x: number;
  y: number;
  // In the curve, behind the rows that carry on from the leg benches.
  back: boolean;
  // Angle round the curve from the end of the leg (-1 on the leg), and distance from the centre.
  swept: number;
  radius: number;
}

// One half of the horseshoe, as an offset from the centre line (dx) and a distance from the
// foot of the leg (y), ordered from the foot round to the midpoint.
const halfSeats = (count: number) => {
  const leg = Array.from({ length: Math.min(count, LEG_ROWS * LEG_COLUMNS) }, (_, i) => {
    const radius = INNER + (i % LEG_ROWS);
    return { dx: -radius, y: Math.floor(i / LEG_ROWS) + 0.5, back: false, swept: -1, radius };
  });

  // Fill the curve row by row outwards, then order its seats in wedges from the leg to the gap.
  const curve: { radius: number; swept: number; back: boolean }[] = [];
  for (let row = 0, remaining = count - leg.length; remaining > 0; row++) {
    const radius = INNER + row;
    // Distance round the row from the end of the leg to the gap.
    const length = (Math.PI / 2) * radius - GAP / 2;
    const back = row >= CURVE_ROWS.length;
    const n = Math.min(remaining, CURVE_ROWS[row] ?? BACK_ROW_SEATS);
    for (let j = 0; j < n; j++) {
      // Front rows spread round the whole curve; back rows sit one seat apart from the gap.
      const along = back ? length - (j + 0.5) : ((j + 0.5) * length) / n;
      curve.push({ radius, swept: along / radius, back });
    }
    remaining -= n;
  }
  curve.sort((a, b) => a.swept - b.swept || a.radius - b.radius);

  return [
    ...leg,
    ...curve.map((seat) => ({
      ...seat,
      dx: -seat.radius * Math.cos(seat.swept),
      y: LEG_COLUMNS + AISLE + seat.radius * Math.sin(seat.swept),
    })),
  ];
};

// The horseshoe as two halves opening downwards, each ordered from its foot to the midpoint.
const horseshoeSeats = (total: number) => {
  const left = halfSeats(Math.ceil(total / 2));
  const right = halfSeats(Math.floor(total / 2));

  const all = [...left, ...right];
  const cx = Math.max(...all.map(({ dx }) => -dx)) + 0.5;
  const height = Math.max(...all.map(({ y }) => y)) + 0.5;

  // Flip y so the feet of the legs are at the bottom.
  return {
    left: left.map(({ dx, y, ...seat }): Seat => ({ ...seat, x: cx + dx, y: height - y })),
    right: right.map(({ dx, y, ...seat }): Seat => ({ ...seat, x: cx - dx, y: height - y })),
    width: 2 * cx,
    height,
  };
};

// Seats in the back rows nearest the midpoint first, then the front rows nearest the midpoint.
const fromTheBack = (seats: Seat[]) =>
  [...seats.keys()].sort(
    (a, b) =>
      Number(seats[b].back) - Number(seats[a].back) ||
      seats[b].swept - seats[a].swept ||
      seats[b].radius - seats[a].radius,
  );

// Seat any overflow from the other side at the back, then fill the rest with this half's own
// side from the foot.
const fillHalf = (seats: Seat[], own: Party[], overflow: Party[]) => {
  const parties: (Party | undefined)[] = new Array(seats.length);
  fromTheBack(seats)
    .slice(0, overflow.length)
    .forEach((index, i) => (parties[index] = overflow[i]));
  let next = 0;
  return seats.map((seat, index) => ({ ...seat, party: parties[index] ?? own[next++] }));
};

function PartyKey({ parties, house, opposition }: { parties: Party[]; house: House; opposition: boolean }) {
  return (
    <ul>
      {parties.map((party) => (
        <li key={party}>
          <span className={opposition ? "swatch opposition" : "swatch"} style={{ background: partyColour(party) }} />
          {labels[party]} {house[party]}
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
  // Largest first.
  const seated = PARTIES.filter((party) => house[party] > 0).sort((a, b) => house[b] - house[a]);
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

  const sum = (parties: Party[]) => parties.reduce((s, p) => s + house[p], 0);
  // Faded behind the government; a hung parliament has no government, so nothing fades.
  const inOpposition = (party: Party) => government.length > 0 && !government.includes(party);
  const { left: leftSeats, right: rightSeats, width, height } = horseshoeSeats(sum(seated));

  // Each side fills its own half from the foot, largest party first, so the largest parties sit
  // nearest the Speaker. A side with more than half the house carries on behind the other side.
  const expand = (parties: Party[]) => parties.flatMap((party) => Array<Party>(house[party]).fill(party));
  const leftOrder = expand(left.parties);
  const rightOrder = expand(right.parties);
  const placed = [
    ...fillHalf(leftSeats, leftOrder.slice(0, leftSeats.length), rightOrder.slice(rightSeats.length)),
    ...fillHalf(rightSeats, rightOrder.slice(0, rightSeats.length), leftOrder.slice(leftSeats.length)),
  ];
  const groups = seated.map((party) => ({ party, seats: placed.filter((seat) => seat.party === party) }));

  // A majority is the right half plus one.
  const majority = rightSeats.length + 1;
  const floorY = Math.max(1, height - (LEG_COLUMNS + AISLE + INNER) / 2);

  return (
    <figure className="horseshoe">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${left.label} ${sum(left.parties)} seats, ${right.label} ${sum(right.parties)} seats, ${majority} needed to govern`}
      >
        {groups.map(({ party, seats }) => (
          <g key={party} className={inOpposition(party) ? "opposition" : undefined} style={{ fill: partyColour(party) }}>
            <title>{`${labels[party]}: ${house[party]}`}</title>
            {seats.map(({ x, y }, i) => (
              <circle key={i} cx={x} cy={y} r={SEAT_RADIUS} />
            ))}
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
