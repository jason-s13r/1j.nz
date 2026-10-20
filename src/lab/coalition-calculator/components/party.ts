import type { Party } from "../combinations";

export const partyColour = (party: Party) => `var(--party-${party})`;
