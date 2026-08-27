import * as Sentry from '@sentry/astro';

const dsn = process.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Tracing
    tracesSampleRate: 1.0,
  });
}
