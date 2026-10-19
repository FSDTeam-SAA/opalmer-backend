import AppError from '../errors/AppError';

export const analysisRange = (value: string, now = new Date()) => {
  const aliases: Record<string, string> = { day: 'daily', daily: 'daily', week: 'weekly', weekly: 'weekly', month: 'monthly', monthly: 'monthly' };
  const filter = aliases[value];
  if (!filter) throw new AppError(400, 'Choose day, week or month');
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  if (filter === 'weekly') start.setUTCDate(start.getUTCDate() - 6);
  if (filter === 'monthly') start.setUTCDate(1);
  const end = new Date(now);
  const buckets: { key: string; label: string }[] = [];
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    buckets.push({
      key: date.toISOString().slice(0, 10),
      label: filter === 'daily' ? 'Today' : filter === 'weekly'
        ? date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
        : String(date.getUTCDate()),
    });
  }
  return { filter, start, end, buckets };
};

// Call with completed, reviewed/released results scoped to the class and enrollment.
export const summarizePerformance = (results: { studentId: unknown; percentage?: unknown }[]) => {
  const metrics = new Map<string, { percentage: number; resultCount: number; totalPercentage: number }>();
  for (const result of results) {
    const value = result.percentage;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) continue;
    const id = String(result.studentId);
    const previous = metrics.get(id);
    const resultCount = (previous?.resultCount ?? 0) + 1;
    const totalPercentage = (previous?.totalPercentage ?? 0) + value;
    metrics.set(id, { percentage: Math.round(totalPercentage / resultCount), resultCount, totalPercentage });
  }
  return metrics;
};
