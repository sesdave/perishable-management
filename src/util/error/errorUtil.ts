import { CustomError } from './customError';

export function throwCustomError(message: string, statusCode: number): never {
  throw new CustomError(message, statusCode);
}
