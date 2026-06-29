import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export const API_VERSION_HEADER = 'X-API-Version';
export const DEPRECATED_HEADER = 'X-API-Deprecated';
export const SUNSET_HEADER = 'X-API-Sunset';
export const LATEST_VERSION = '1';

@Injectable()
export class VersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;

    // Extract version from path (/api/v1/... -> v1)
    const versionMatch = path.match(/^\/api\/(v\d+)\//);
    const pathVersion = versionMatch
      ? versionMatch[1].replace('v', '')
      : LATEST_VERSION;

    // Check Accept header for version negotiation
    const acceptHeader = req.get('Accept') || '';
    const headerVersionMatch = acceptHeader.match(
      /application\/vnd\.autisense\.v(\d+)\+json/,
    );
    const requestedVersion = headerVersionMatch
      ? headerVersionMatch[1]
      : pathVersion;

    // Set version info on request for downstream use
    (req as any).apiVersion = requestedVersion;

    // Add version header to response
    res.setHeader(API_VERSION_HEADER, requestedVersion);

    next();
  }
}
