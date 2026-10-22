import type { KnownParty, Party } from "./combinations";
import data from "./elections.json";

export interface Election {
  year: number;
  date: string;
  // Seats won by the parties the calculator knows, the Māori Party counting as Te Pāti Māori.
  seats: Record<KnownParty, number>;
  // Seats won by parties since gone, each with its own letter so it keeps its colour.
  others: { party: Party; name: string; seats: number }[];
  // The Wikipedia article the seats are from.
  source: string;
}

// Seats won at each general election under MMP, newest first.
export const elections = data as Election[];
