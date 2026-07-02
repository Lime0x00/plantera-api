import type { NextFunction, Response } from 'express';
import Logger from '#infrastructure/observability/logger';
import type { ApiResponse } from '#common/types';

export abstract class Controller {
  protected readonly logger = Logger;

  constructor() {
    const prototype = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(prototype);
    for (const method of methods) {
      if (
        method !== 'constructor' &&
        typeof (this as any)[method] === 'function'
      ) {
        (this as any)[method] = (this as any)[method].bind(this);
      }
    }
  }

  protected ok<TData>(res: Response, data: TData, message = 'OK') {
    return res.status(200).json(this.buildSuccessResponse(data, message));
  }

  protected created<TData>(res: Response, data: TData, message = 'Created') {
    return res.status(201).json(this.buildSuccessResponse(data, message));
  }

  protected noContent(res: Response) {
    return res.status(204).send();
  }

  protected fail(res: Response, statusCode: number, message: string) {
    return res.status(statusCode).json({
      error: {
        code: statusCode,
        type: 'ERROR',
        message,
        details: [],
      },
    });
  }

  protected async run(next: NextFunction, fn: () => Promise<Response | void>) {
    try {
      await fn();
    } catch (error) {
      next(error);
    }
  }

  private buildSuccessResponse<TData>(
    data: TData,
    message: string
  ): ApiResponse<TData> {
    const response: any = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    };

    if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
      response.data = (data as any).data;
      response.meta = (data as any).meta;
    } else if (data !== undefined) {
      response.data = data;
    }

    return response;
  }
}
