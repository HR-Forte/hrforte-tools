export const VN_OFFSET_HOURS = 7;

/**
 * Times (UTC) that collide with scheduled work. Copied from est-roster
 * `src/modules/server-management/deploy-window.constants.ts` to draw the hatching only:
 * the API already drops these hours from `recommendations`. Keep in sync when that file changes.
 * `endMinute` may exceed 1440 to wrap past midnight; no `weekday` means every day (0 = Sunday).
 */
export type BlockedWindow = { label: string; weekday?: number; startMinute: number; endMinute: number };

const at = (hour: number, minute = 0) => hour * 60 + minute;

export const BLOCKED_WINDOWS: BlockedWindow[] = [
  { label: 'App cron', startMinute: at(23, 30), endMinute: 24 * 60 + at(0, 10) },
  { label: 'App cron', startMinute: at(0, 30), endMinute: at(0, 45) },
  { label: 'App cron', startMinute: at(1), endMinute: at(1, 45) },
  { label: 'App cron', startMinute: at(2), endMinute: at(4) },
  { label: 'App cron', startMinute: at(9), endMinute: at(9, 15) },
  { label: 'App cron', startMinute: at(12), endMinute: at(12, 15) },
  { label: 'RDS backup', startMinute: at(17), endMinute: at(18) },
  { label: 'RDS maintenance', weekday: 6, startMinute: at(19), endMinute: at(20) },
];

export type HeatmapMetric = 'writes' | 'requests' | 'users';

/** Upper bound of each of the 6 colour steps; step 0 is the quiet class. */
export const HEATMAP_BINS: Record<HeatmapMetric, { upTo: number[]; labels: string[]; name: string }> = {
  writes: {
    upTo: [0, 25, 100, 300, 1000, Infinity],
    labels: ['0', '1–25', '–100', '–300', '–1k', '>1k'],
    name: 'Writes',
  },
  requests: {
    upTo: [50, 500, 2000, 5000, 10000, Infinity],
    labels: ['≤50', '–500', '–2k', '–5k', '–10k', '>10k'],
    name: 'Requests',
  },
  users: { upTo: [1, 4, 8, 14, 19, Infinity], labels: ['1', '2–4', '5–8', '9–14', '15–19', '≥20'], name: 'Users' },
};

/** Tailwind classes per colour step, light then dark. */
export const HEATMAP_STEP_CLASS = [
  'bg-slate-200 dark:bg-slate-800',
  'bg-blue-200 dark:bg-blue-950',
  'bg-blue-400 dark:bg-blue-800',
  'bg-blue-500 dark:bg-blue-600',
  'bg-blue-700 dark:bg-blue-400',
  'bg-blue-900 dark:bg-blue-200',
];
