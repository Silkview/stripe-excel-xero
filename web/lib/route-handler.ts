import { NextResponse } from 'next/server';
import { ApiAuthError } from './api-auth';
import { jsonError, jsonSuccess } from './api-response';
import { corsOptions, withCors } from './cors';
import {
  BillingRequiredError,
  DowngradeRequiredError,
  getBillingUrl,
} from './billing/access';
import { XeroServiceError } from './services/xero';
import { StripeServiceError } from './services/stripe-data';
import { XeroAuthRequiredError } from './xeroAuth';

export function handleOptions(request: Request) {
  return corsOptions(request);
}

export function handleRouteError(request: Request, err: unknown) {
  if (err instanceof ApiAuthError) {
    return withCors(request, jsonError(err.code, err.message, err.status));
  }
  if (err instanceof BillingRequiredError) {
    return withCors(
      request,
      jsonError(err.code, err.message, 402, {
        billingUrl: getBillingUrl(),
      })
    );
  }
  if (err instanceof DowngradeRequiredError) {
    return withCors(
      request,
      jsonError(err.code, err.message, 403, {
        billingUrl: getBillingUrl(),
      })
    );
  }
  if (err instanceof XeroAuthRequiredError) {
    return withCors(
      request,
      jsonError('XERO_AUTH_REQUIRED', err.message, 401)
    );
  }
  if (err instanceof XeroServiceError) {
    const status =
      err.code === 'XERO_AUTH_REQUIRED'
        ? 401
        : err.code === 'RATE_LIMITED'
          ? 429
          : err.code === 'TIMEOUT'
            ? 504
            : err.code === 'VALIDATION_ERROR'
              ? 400
              : 502;
    return withCors(
      request,
      jsonError(err.code, err.message, status, {
        retry_after: err.retryAfter,
        details: err.details,
        rowIssues: err.rowIssues,
      })
    );
  }
  if (err instanceof StripeServiceError) {
    const status =
      err.code === 'STRIPE_AUTH_REQUIRED'
        ? 401
        : err.code === 'RATE_LIMITED'
          ? 429
          : err.code === 'TIMEOUT'
            ? 504
            : 502;
    return withCors(
      request,
      jsonError(err.code, err.message, status, { retry_after: err.retryAfter })
    );
  }
  if (err instanceof Error && err.message) {
    console.error(err);
    return withCors(
      request,
      jsonError('PROVISION_ERROR', err.message, 500)
    );
  }
  console.error(err);
  return withCors(
    request,
    jsonError('SERVER_ERROR', 'An unexpected error occurred.', 500)
  );
}

export function ok<T>(request: Request, data: T, status = 200) {
  return withCors(request, jsonSuccess(data, status));
}
