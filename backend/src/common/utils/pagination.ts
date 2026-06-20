/**
 * Shared pagination helpers.
 *
 * Centralises the `skip`/`take` calculation and the response metadata shape so
 * services and controllers don't each re-derive them (previously duplicated in
 * screening, users, audit and admin).
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NormalizePaginationOptions {
  /** Default page when none/invalid is supplied. */
  defaultPage?: number;
  /** Default limit when none/invalid is supplied. */
  defaultLimit?: number;
  /** Upper bound applied to `limit` to protect the database. */
  maxLimit?: number;
}

/**
 * Normalises raw page/limit inputs (which may be strings from query params or
 * undefined) into safe positive integers plus the derived `skip` offset.
 */
export function getPaginationParams(
  page?: number | string,
  limit?: number | string,
  options: NormalizePaginationOptions = {},
): PaginationParams {
  const { defaultPage = 1, defaultLimit = 20, maxLimit = 200 } = options;

  const parsedPage = Math.trunc(Number(page));
  const parsedLimit = Math.trunc(Number(limit));

  const safePage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : defaultPage;
  const safeLimitRaw =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : defaultLimit;
  const safeLimit = Math.min(safeLimitRaw, maxLimit);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

/** Builds the standard pagination metadata block for a paged response. */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    pages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
