export type GeneralApiProblem =
  /**
   * Times up.
   */
  | { kind: 'timeout'; temporary: true }
  /**
   * Cannot connect to the server for some reason.
   */
  | { kind: 'cannot-connect'; temporary: true }
  /**
   * The server experienced a problem. Any 5xx error.
   */
  | { kind: 'server' }
  /**
   * We're not allowed because we haven't identified ourself. This is 401.
   */
  | { kind: 'unauthorized' }
  /**
   * We don't have access to perform that request. This is 403.
   */
  | { kind: 'forbidden' }
  /**
   * Unable to find that resource.  This is a 404.
   */
  | { kind: 'not-found' }
  /**
   * All other 4xx series errors.
   */
  | { kind: 'rejected' }
  /**
   * Something truly unexpected happened
   */
  | { kind: 'unknown' }
  /**
   * The data we received is not in the expected format.
   */
  | { kind: 'bad-data' }
  /**
   * Request has been cancelled. Only possible if `cancelToken` is provided in config.
   */
  | { kind: 'cancelled' };

export type ApiProblems = GeneralApiProblem & {
  data?: unknown;
  error?: Error;
};

export type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isApiEnvelope<T>(body: unknown): body is ApiEnvelope<T> {
  if (!isRecord(body)) {
    return false;
  }
  return typeof body.statusCode === 'number' && typeof body.message === 'string' && 'data' in body;
}

export function unwrapApiData<T>(body: unknown): T {
  if (isApiEnvelope<T>(body)) {
    return body.data;
  }
  return body as T;
}
