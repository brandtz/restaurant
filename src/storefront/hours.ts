import type {
  DayOfWeek,
  OpeningPeriod,
  StorefrontLocationView,
} from "./view-models";

const weekdayIndex: Readonly<Record<string, DayOfWeek>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function currentTime(): Date {
  return new Date();
}

export function parseClock(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new RangeError(`Invalid local clock time: ${value}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClock(value: string): string {
  const minutes = parseClock(value);
  const hours24 = Math.floor(minutes / 60);
  const suffix = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

export function localClock(
  date: Date,
  timeZone: string,
): { day: DayOfWeek; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  const day = weekdayIndex[part("weekday")];
  if (day === undefined) {
    throw new RangeError("Unable to resolve local weekday.");
  }
  return {
    day,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

export type OpenStatus = Readonly<{
  open: boolean;
  today: OpeningPeriod | null;
  label: string;
}>;

export function openStatus(
  location: Pick<StorefrontLocationView, "openingHours" | "timeZone">,
  now: Date,
): OpenStatus {
  const clock = localClock(now, location.timeZone);
  const today =
    location.openingHours.find((period) => period.day === clock.day) ?? null;
  if (!today) {
    return { open: false, today, label: "Closed today" };
  }
  const opens = parseClock(today.opens);
  const closes = parseClock(today.closes);
  if (clock.minutes >= opens && clock.minutes < closes) {
    return {
      open: true,
      today,
      label: `Open now · until ${formatClock(today.closes)}`,
    };
  }
  if (clock.minutes < opens) {
    return {
      open: false,
      today,
      label: `Closed now · opens at ${formatClock(today.opens)}`,
    };
  }
  return { open: false, today, label: "Closed for today" };
}

/** Monday-first weekly schedule for display. */
export function weeklySchedule(
  location: Pick<StorefrontLocationView, "openingHours">,
): { day: string; hours: string }[] {
  return ([1, 2, 3, 4, 5, 6, 0] as const).map((day) => {
    const period = location.openingHours.find(
      (candidate) => candidate.day === day,
    );
    return {
      day: dayNames[day],
      hours: period
        ? `${formatClock(period.opens)} – ${formatClock(period.closes)}`
        : "Closed",
    };
  });
}
