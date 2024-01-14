import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../util/error/customError'
export const handleErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // Log the error for debugging

  // Customize the error response based on the error status
  const status = err instanceof CustomError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message
  });
};
