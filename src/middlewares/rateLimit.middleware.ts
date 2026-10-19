import { RequestHandler } from 'express';

// A bounded process-local limit. Multi-instance deployments should enforce the
// same ceilings at their shared gateway as well.
export const rateLimit = (limit: number, windowMs = 60_000): RequestHandler => {
  const buckets = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 10_000) for (const [key, item] of buckets) if (item.reset <= now) buckets.delete(key);
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const item = buckets.get(key);
    const bucket = !item || item.reset <= now ? { count: 0, reset: now + windowMs } : item;
    bucket.count++; buckets.set(key, bucket);
    if (bucket.count > limit) {
      res.setHeader('Retry-After', Math.ceil((bucket.reset - now) / 1000));
      res.status(429).json({ success: false, message: 'Too many requests. Please try again shortly.' });
      return;
    }
    next();
  };
};
