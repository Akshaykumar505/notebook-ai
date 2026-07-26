import cors from "cors";
import express, { Express, Request, Response } from "express";
import { errorHandler } from "@/middleware/errorHandler";
import { env } from "@/config/env";
import { authRouter } from "@/modules/auth/auth.routes";
import { notebooksRouter } from "@/modules/notebooks/notebooks.routes";
import { sourcesRouter } from "@/modules/sources/sources.routes";
import { queryRouter } from "@/modules/query/query.routes";

export function createApp(): Express {
  const app = express();

  // --- Global middleware ---
  app.use(cors()); // Allow frontend (different port) to call this API
  app.use(express.json()); // Parse JSON request bodies

  // Serves uploaded PDF/VTT files directly (e.g. /files/abc123.pdf) so the
  // frontend's source viewer can open the original file for a citation.
  app.use("/files", express.static(env.UPLOAD_DIR));

  // --- Health check ---
  // Useful to verify the server + (later) DB + vector store are reachable.
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- Feature routes ---
  app.use("/api/auth", authRouter);
  app.use("/api/notebooks", notebooksRouter);
  // Nested under a notebook: /api/notebooks/:notebookId/sources, /api/notebooks/:notebookId/query
  app.use("/api/notebooks/:notebookId/sources", sourcesRouter);
  app.use("/api/notebooks/:notebookId/query", queryRouter);

  // --- 404 handler for unmatched routes ---
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  });

  // --- Global error handler (must be registered last) ---
  app.use(errorHandler);

  return app;
}
