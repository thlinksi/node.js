import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}
