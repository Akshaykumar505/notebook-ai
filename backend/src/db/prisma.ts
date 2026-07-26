import { PrismaClient } from "@prisma/client";

/**
 * Single shared Prisma client instance for the whole app.
 * Importing `prisma` from here everywhere avoids opening a new
 * DB connection pool per file/module.
 */
export const prisma = new PrismaClient();
