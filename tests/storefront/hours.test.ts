import { describe, expect, it } from "vitest";
import {
  formatClock,
  localClock,
  openStatus,
  parseClock,
  weeklySchedule,
} from "@/storefront/hours";
import { laniMokuLocations } from "@/storefront/fixtures/lani-moku";

const springfield = laniMokuLocations[0]!;
const eugene = laniMokuLocations[1]!;

describe("location hours", () => {
  it("parses and formats local clock times", () => {
    expect(parseClock("00:00")).toBe(0);
    expect(parseClock("21:30")).toBe(1290);
    expect(() => parseClock("24:00")).toThrow(RangeError);
    expect(() => parseClock("9:00")).toThrow(RangeError);
    expect(formatClock("00:05")).toBe("12:05 AM");
    expect(formatClock("11:30")).toBe("11:30 AM");
    expect(formatClock("12:00")).toBe("12:00 PM");
    expect(formatClock("23:00")).toBe("11:00 PM");
  });

  it("resolves the weekday and time in the location time zone, not UTC", () => {
    // 2026-10-06T03:30Z is Monday 20:30 in Oregon (PDT).
    expect(
      localClock(new Date("2026-10-06T03:30:00Z"), "America/Los_Angeles"),
    ).toEqual({ day: 1, minutes: 20 * 60 + 30 });
    // Standard time after the November transition (PST, UTC-8).
    expect(
      localClock(new Date("2026-11-10T19:00:00Z"), "America/Los_Angeles"),
    ).toEqual({ day: 2, minutes: 11 * 60 });
  });

  it("describes open, before-opening, after-closing and closed days", () => {
    const mondayEvening = new Date("2026-10-06T03:30:00Z");
    expect(openStatus(springfield, mondayEvening)).toMatchObject({
      open: true,
      label: "Open now · until 9:00 PM",
    });
    expect(openStatus(eugene, mondayEvening)).toMatchObject({
      open: false,
      label: "Closed today",
    });

    const tuesdayMorning = new Date("2026-10-06T17:00:00Z"); // 10:00 PDT
    expect(openStatus(eugene, tuesdayMorning).label).toBe(
      "Closed now · opens at 11:30 AM",
    );

    const closingMinute = new Date("2026-10-07T04:00:00Z"); // Tue 21:00 PDT
    expect(openStatus(springfield, closingMinute)).toMatchObject({
      open: false,
      label: "Closed for today",
    });
  });

  it("lists a Monday-first weekly schedule", () => {
    const schedule = weeklySchedule(eugene);
    expect(schedule.map((row) => row.day)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(schedule[0]?.hours).toBe("Closed");
    expect(schedule[4]?.hours).toBe("11:30 AM – 11:00 PM");
  });
});
