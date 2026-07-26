// Extends Express's Request type so `req.userId` is recognized by TypeScript
// after our auth middleware sets it.
declare namespace Express {
  export interface Request {
    userId?: string;
  }
}
