import { meanHouse, type House, type KnownParty } from "./combinations";
import data from "./polls.json";

export interface Poll extends Record<KnownParty, number> {
  pollster: string;
  publisher?: string;
  date: string;
}

// Seat projections from the opinion polling article's forecasts, newest first, since the 2023 election.
export const POLLS_SOURCE =
  "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_New_Zealand_general_election#Forecasts";

export const polls: Poll[] = data;

// How many of the latest polls the rolling average covers.
const AVERAGE_OF = 10;

// How many of the latest months get their own average.
const MONTHS = 6;

export interface Average {
  label: string;
  // How many polls it averages.
  count: number;
  seats: Record<KnownParty, number>;
}

export const houseOf = ({ pollster, publisher, date, ...house }: Poll): House => house;

const average = (label: string, some: Poll[]): Average => ({
  label,
  count: some.length,
  seats: meanHouse(some.map(houseOf)) as Record<KnownParty, number>,
});

// The month a poll ended, e.g. "Oct 2026" for "24 Sep – 1 Oct 2026".
const endMonth = ({ date }: Poll) => date.slice(-"Mmm YYYY".length);
const endYear = ({ date }: Poll) => date.slice(-"YYYY".length);
const pollsterYear = ({ date, pollster }: Poll) => date.slice(-"YYYY".length) + ' ' + pollster;

const isCurrentYear = (poll: Poll) => +endYear(poll) === new Date().getFullYear()

// The rolling average first, then each of the latest months' polls, newest first.
export const averages: Average[] = [
  average("Rolling average", polls.slice(0, AVERAGE_OF)),
  ...Object.entries(Object.groupBy(polls, endMonth))
    .slice(0, MONTHS)
    .map(([month, some]) => average(month, some!)),
  ...Object.entries(Object.groupBy(polls.filter(isCurrentYear), pollsterYear))
    .map(([label, some]) => average(label, some!))
    .sort((a, b) => a.label.localeCompare(b.label)),
  ...Object.entries(Object.groupBy(polls, endYear))
    .map(([year, some]) => average(year, some!))
    .sort((a, b) => b.label.localeCompare(a.label)),
];
