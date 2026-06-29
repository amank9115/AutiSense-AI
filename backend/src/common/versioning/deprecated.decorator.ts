import { SetMetadata } from '@nestjs/common';

export const DEPRECATED_KEY = 'deprecated';
export const SUNSET_DATE_KEY = 'sunsetDate';

/**
 * Marks an endpoint as deprecated.
 * @param sunsetDate - Optional ISO date string when the endpoint will be removed
 * @param message - Optional deprecation message
 */
export function Deprecated(sunsetDate?: string, message?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(DEPRECATED_KEY, { deprecated: true, sunsetDate, message })(
      target,
      propertyKey,
      descriptor,
    );
  };
}

export interface DeprecationInfo {
  deprecated: boolean;
  sunsetDate?: string;
  message?: string;
}
