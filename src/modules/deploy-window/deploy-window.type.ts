// Shapes of GET /v1/server-management/deploy-window/{analysis,readiness} (est-roster, server-management module).
// weekday: 0 = Sunday … 6 = Saturday. Every time is UTC.

export type UsageSlot = { requests: number; writes: number; users: number };

export type RankedWindow = UsageSlot & { weekday: number; startHour: number; durationHours: number };

export type SourceStatus = { name: string; status: 'ok' | 'missing' | 'error' };

export type DeployWindowAnalysis = {
  timezone: 'UTC';
  days: number;
  sources: SourceStatus[];
  /** heatmap[weekday][hour]: the max over the weeks of each metric. */
  heatmap: UsageSlot[][];
  recommendations: RankedWindow[];
  busiestDates: { date: string; writes: number; requests: number }[];
};

export type Verdict = 'GO' | 'CAUTION' | 'NO_GO';

export type DeployWindowReadiness = {
  verdict: Verdict;
  reasons: string[];
  metrics: {
    db: { longestTransactionSeconds: number; lockWaiters: number } | 'unavailable';
    queues: { name: string; active: number; delayedDueSoon: number }[];
    recentWrites: number;
    historicalMaxWrites: number;
    sources: SourceStatus[];
  };
};

export type DeployWindowParams = { durationHours?: number };
