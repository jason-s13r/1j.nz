import { createContext } from "react";
import { labels, type Party } from "../combinations";

export const partyColour = (party: Party) => `var(--party-${party})`;

// Every party's name, including any added by the user.
export const PartyNames = createContext<Record<Party, string>>(labels);
