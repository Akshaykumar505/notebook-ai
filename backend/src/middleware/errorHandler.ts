import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/**
 * Custom error class for expected, "known" application errors
 * (e.g. "Notebook not found", "Unsupported source type").
 * We throw AppError with a specific status code; anything else
 * (unexpected bugs) falls through as a 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * Centralized error handler — every route's errors end up here via next(err)
 * or thrown errors inside async handlers wrapped by asyncHandler().
 * This means individual route handlers never need try/catch + res.status().json()
 * boilerplate repeated everywhere.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal server error" });
}

/**
 * Wraps async route handlers so thrown errors/rejected promises
 * are forwarded to errorHandler instead of crashing the process
 * or being silently swallowed.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
