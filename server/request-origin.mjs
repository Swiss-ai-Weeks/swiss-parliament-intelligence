// Only local development may use equivalent loopback hostnames.
export function allowedRequestOrigin(origin, env = {}) {
  if (!origin) return true; // Non-browser API clients; authentication still applies.
  const configured = env.PUBLIC_ORIGIN || 'http://localhost:5173';
  if (origin === configured) return true;
  if (env.NODE_ENV === 'production') return false;
  try {
    const expected = new URL(configured), actual = new URL(origin);
    const loopback = host => ['localhost', '127.0.0.1', '[::1]'].includes(host);
    return origin === actual.origin && loopback(expected.hostname) && loopback(actual.hostname)
      && actual.protocol === expected.protocol && actual.port === expected.port;
  } catch { return false; }
}
