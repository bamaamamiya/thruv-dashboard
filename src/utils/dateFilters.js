import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks, // <-- pastikan ini ada
} from "date-fns";
import { isValid } from "date-fns";

export const FILTER_OPTIONS = [
  {
    key: "allTime",
    label: "All Time",
    getRange: () => [new Date(0), new Date()],
  },
  {
    key: "today",
    label: "Today",
    getRange: () => [startOfDay(new Date()), endOfDay(new Date())],
  },
  {
    key: "yesterday",
    label: "Yesterday",
    getRange: () => [
      startOfDay(subDays(new Date(), 1)),
      endOfDay(subDays(new Date(), 1)),
    ],
  },
  {
    key: "week",
    label: "This Week",
    getRange: () => [
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      endOfWeek(new Date(), { weekStartsOn: 1 }),
    ],
  },
  {
    key: "lastWeek",
    label: "Last Week",
    getRange: () => {
      console.log("Running lastWeek getRange");
      const lastWeekDate = subWeeks(new Date(), 1);
      console.log("lastWeekDate:", lastWeekDate);
      return [
        startOfWeek(lastWeekDate, { weekStartsOn: 1 }),
        endOfWeek(lastWeekDate, { weekStartsOn: 1 }),
      ];
    },
  },
  {
    key: "month",
    label: "This Month",
    getRange: () => [startOfMonth(new Date()), endOfMonth(new Date())],
  },
  {
    key: "lastMonth",
    label: "Last Month",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
    },
  },
  {
    key: "custom",
    label: "Custom",
    getRange: () => null, // placeholder
  },
];

export const getDateRange = (selectedFilter, customRange) => {
  const filter = FILTER_OPTIONS.find((f) => f.key === selectedFilter);

  if (!filter) return [null, null];

  if (filter.key === "custom") {
    if (
      Array.isArray(customRange) &&
      customRange.length === 2 &&
      isValid(customRange[0]) &&
      isValid(customRange[1])
    ) {
      return customRange;
    } else {
      console.warn("Custom range is not valid.");
      return [null, null];
    }
  }

  return filter.getRange();
};
