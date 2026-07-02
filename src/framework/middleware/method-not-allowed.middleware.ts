import type { Request, Response, NextFunction, Router } from 'express';
import type { ILayer } from 'express-serve-static-core';
import { MethodNotAllowedError } from '#common/errors';

interface RouteWithMethods {
  path: string;
  methods: Record<string, boolean>;
  stack: ILayer[];
}

interface RouterHandle {
  stack?: ILayer[];
}

const PATH_METHODS = new Map<string, Set<string>>();

/**
 * Walk the router stack and record allowed HTTP methods per path.
 * Handles both direct routes and nested routers.
 */
export function discoverRoutes(prefix: string, router: Router) {
  for (const layer of router.stack) {
    // Direct route: router.get('/foo', …)
    if (layer.route) {
      const route = layer.route as unknown as RouteWithMethods;
      const fullPath = (prefix + route.path).replace(/\/+$/, '') || '/';
      const methods = PATH_METHODS.get(fullPath) ?? new Set();
      for (const method of Object.keys(route.methods)) {
        methods.add(method);
      }
      PATH_METHODS.set(fullPath, methods);
      continue;
    }

    // Nested router: router.use('/sub', subRouter)
    const handle = layer.handle as unknown as RouterHandle;
    if (handle?.stack) {
      const mountPath = extractMountPath(layer);
      discoverRoutes(prefix + mountPath, layer.handle as unknown as Router);
    }
  }
}

/**
 * Extract the clean mount path from an Express router layer.
 *
 * Express creates layers with a regexp like /^\/auth\/?(?=\/|$)/i
 * for router.use('/auth', handle). We extract the path portion
 * by removing the leading ^ and trailing optional-slash + lookahead.
 */
function extractMountPath(layer: ILayer): string {
  const source: string | undefined = layer.regexp?.source;
  if (!source) {
    return '';
  }

  // Remove leading ^\ and trailing \/?(?=\/|$)
  return source
    .replace(/^\^\\?/, '') // drop leading ^\ (source is \/path\/...)
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '') // trailing \/?(?=\/|$)
    .replace(/\\\//g, '/'); // unescape \/ → /
}

export function methodNotAllowedHandler(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const path =
    '/' + req.originalUrl.split('?')[0].replace(/^\/+|\/+$/g, '') || '/';
  const methods = PATH_METHODS.get(path);
  if (methods && !methods.has(req.method.toLowerCase())) {
    next(new MethodNotAllowedError());
  } else {
    next();
  }
}
