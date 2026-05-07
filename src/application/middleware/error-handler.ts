/**
 * HTTP error mapping for the App Router.
 *
 * Adapters in `app/api/...` translate `DomainError` instances into
 * NextResponse JSON. Centralised here so every route surfaces the same
 * codes/messages and the use-case layer remains framework-free.
 *
 * Caller may pass a `messages` map to override the Arabic copy per route
 * (e.g., a NotFoundError on a chat session vs a project should read
 * differently for the user).
 */

import { NextResponse } from 'next/server';
import { isDomainError, type DomainErrorCode } from '@/core/errors';

export type ErrorMessages = Partial<Record<DomainErrorCode, string>>;

const DEFAULT_MESSAGES: Record<DomainErrorCode, string> = {
  validation_failed: 'طلب غير صالح',
  not_found: 'غير موجود',
  unauthorized: 'يلزم تسجيل الدخول',
  forbidden: 'غير مسموح',
  conflict: 'تعارض في البيانات',
  rate_limited: 'محاولات كثيرة، حاول لاحقاً',
  invariant_violated: 'حالة غير متوقعة',
  external_service_failure: 'تعذّر الوصول لخدمة خارجية',
};

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  validation_failed: 400,
  not_found: 404,
  unauthorized: 401,
  forbidden: 403,
  conflict: 409,
  rate_limited: 429,
  invariant_violated: 500,
  external_service_failure: 502,
};

export function mapDomainErrorToHttp(err: unknown, overrides?: ErrorMessages): NextResponse {
  if (!isDomainError(err)) {
    console.error('[error-handler] unexpected error:', err);
    return NextResponse.json({ error: 'خطأ غير متوقع' }, { status: 500 });
  }
  const message = overrides?.[err.code] ?? DEFAULT_MESSAGES[err.code];
  const status = STATUS_BY_CODE[err.code];
  return NextResponse.json({ error: message }, { status });
}
