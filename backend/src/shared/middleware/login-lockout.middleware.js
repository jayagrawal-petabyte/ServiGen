'use strict';

/**
 * Account Lockout and Brute-Force Protection Middleware for /api/auth/login.
 *
 * Tracks failed authentication attempts by identifier (email/username) and client IP.
 * After 5 failed attempts within 15 minutes, the account identifier and IP are locked
 * out for 15 minutes with HTTP 429 Too Many Requests.
 * Successful authentication resets the failed attempt counter.
 */
const createLoginLockout = ({
  maxAttempts = 5,
  lockoutWindowMs = 15 * 60 * 1000,
  lockoutDurationMs = 15 * 60 * 1000,
} = {}) => {
  const store = new Map();

  const getRecord = (key, now) => {
    let rec = store.get(key);
    if (!rec) return null;

    // Check if lockout expired
    if (rec.lockedUntil && now > rec.lockedUntil) {
      store.delete(key);
      return null;
    }

    // Check if sliding attempt window expired
    if (!rec.lockedUntil && now - rec.firstAttemptAt > lockoutWindowMs) {
      store.delete(key);
      return null;
    }

    return rec;
  };

  const recordFailure = (key, now) => {
    let rec = getRecord(key, now);
    if (!rec) {
      rec = { attempts: 1, firstAttemptAt: now, lockedUntil: null };
      store.set(key, rec);
    } else {
      rec.attempts += 1;
    }

    if (rec.attempts >= maxAttempts) {
      rec.lockedUntil = now + lockoutDurationMs;
      console.warn(`[SECURITY] Account lockout triggered for "${key}" until ${new Date(rec.lockedUntil).toISOString()}`);
    }
  };

  const resetRecord = (key) => {
    store.delete(key);
  };

  const middleware = (req, res, next) => {
    const now = Date.now();
    const body = req.body || {};
    const rawId = body.email || body.username || body.identifier;
    const identifier = typeof rawId === 'string' && rawId.trim() ? rawId.trim().toLowerCase() : null;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    const idKey = identifier ? `id:${identifier}` : null;
    const ipKey = `ip:${ip}`;

    // Check if either identifier or IP is locked out
    const idRec = idKey ? getRecord(idKey, now) : null;
    const ipRec = getRecord(ipKey, now);
    const lockedRec = (idRec?.lockedUntil && idRec.lockedUntil > now) ? idRec
      : (ipRec?.lockedUntil && ipRec.lockedUntil > now) ? ipRec : null;

    if (lockedRec) {
      const remainingMinutes = Math.max(1, Math.ceil((lockedRec.lockedUntil - now) / 60000));
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Account temporarily locked for ${remainingMinutes} minute(s).`,
      });
    }

    // Intercept response completion to track success / failure
    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      const statusCode = res.statusCode;
      if (statusCode === 200) {
        if (idKey) resetRecord(idKey);
        resetRecord(ipKey);
      } else if (statusCode === 401 || (statusCode === 400 && payload?.message?.toLowerCase().includes('password'))) {
        if (idKey) recordFailure(idKey, Date.now());
        recordFailure(ipKey, Date.now());
      }
      return originalJson(payload);
    };

    next();
  };

  middleware.reset = () => {
    store.clear();
  };

  middleware.getStoreSize = () => store.size;

  return middleware;
};

const defaultLoginLockout = createLoginLockout();

module.exports = {
  createLoginLockout,
  loginLockout: defaultLoginLockout,
};

