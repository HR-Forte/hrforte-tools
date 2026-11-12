import {
  BLOCKED_WINDOWS,
  BlockedWindow,
  HEATMAP_BINS,
  HeatmapMetric,
  VN_OFFSET_HOURS,
} from '@/modules/deploy-window/deploy-window.const';

export type Tz = 'vn' | 'utc';

export const SLOTS_PER_WEEK = 168;
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Heatmap rows start on Monday; weekday numbers stay 0 = Sunday. */
export const ROW_ORDER = [1, 2, 3, 4, 5, 6, 0];

const mod = (n: number, m: number) => ((n % m) + m) % m;
const pad = (n: number) => String(n).padStart(2, '0');

export const tzOffset = (tz: Tz) => (tz === 'vn' ? VN_OFFSET_HOURS : 0);
export const tzLabel = (tz: Tz) => (tz === 'vn' ? 'VN time (UTC+7)' : 'UTC');

/** UTC slot (weekday * 24 + hour) shown at row `weekday`, column `hour` in the chosen timezone. */
export const toUtcSlot = (weekday: number, hour: number, tz: Tz) =>
  mod(weekday * 24 + hour - tzOffset(tz), SLOTS_PER_WEEK);

/** Local weekday/hour of a UTC slot in the chosen timezone. */
export const toLocalSlot = (utcSlot: number, tz: Tz) => {
  const local = mod(utcSlot + tzOffset(tz), SLOTS_PER_WEEK);
  return { weekday: Math.floor(local / 24), hour: local % 24 };
};

/** "Mon 01:00–03:00", with the end day only when the window crosses midnight. */
export const slotRangeLabel = (utcSlot: number, hours: number, tz: Tz) => {
  const start = toLocalSlot(utcSlot, tz);
  const end = toLocalSlot(utcSlot + hours, tz);
  const endDay = end.weekday !== start.weekday && end.hour !== 0 ? `${DAY_SHORT[end.weekday]} ` : '';
  return `${DAY_SHORT[start.weekday]} ${pad(start.hour)}:00–${endDay}${pad(end.hour)}:00`;
};

/** UTC slots covered by a recommended window. */
export const windowSlots = (weekday: number, startHour: number, durationHours: number) =>
  Array.from({ length: durationHours }, (_, k) => mod(weekday * 24 + startHour + k, SLOTS_PER_WEEK));

/** "HH:MM" of a minute-of-day (UTC) shown in the chosen timezone. */
export const minuteLabel = (minute: number, tz: Tz) => {
  const m = mod(minute + tzOffset(tz) * 60, 24 * 60);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

// Week-minute ranges of every blocked window; a window past Saturday midnight is repeated at the start of the week.
const blockedRanges = BLOCKED_WINDOWS.flatMap(window => {
  const week = 7 * 24 * 60;
  return (window.weekday === undefined ? [0, 1, 2, 3, 4, 5, 6] : [window.weekday]).flatMap(day => {
    const start = day * 1440 + window.startMinute;
    const end = day * 1440 + window.endMinute;
    const ranges = [{ start, end, window }];
    if (end > week) ranges.push({ start: start - week, end: end - week, window });
    return ranges;
  });
});

/** Blocked windows overlapping the clock hour of a UTC slot. */
export const blockedFor = (utcSlot: number): BlockedWindow[] => {
  const from = utcSlot * 60;
  const to = from + 60;
  return [...new Set(blockedRanges.filter(r => r.start < to && r.end > from).map(r => r.window))];
};

/** Colour step (0–5) of a value for the metric. */
export const binFor = (metric: HeatmapMetric, value: number) =>
  HEATMAP_BINS[metric].upTo.findIndex(limit => value <= limit);

/** "HH:MM–HH:MM" of a blocked window in the chosen timezone. */
export const minuteLabelRange = (window: BlockedWindow, tz: Tz) =>
  `${minuteLabel(window.startMinute, tz)}–${minuteLabel(window.endMinute, tz)}`;
