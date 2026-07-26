import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "@/middleware/errorHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { assertNotebookOwnership } from "@/modules/notebooks/notebooks.service";
import { upload } from "./upload.middleware";
import * as sourcesService from "./sources.service";

// mergeParams lets this router read :notebookId from the parent router (see app.ts)
export const sourcesRouter = Router({ mergeParams: true });

sourcesRouter.use(requireAuth);

// Every route here operates on a notebook the user must own — check once, up front.
sourcesRouter.use(
  asyncHandler(async (req, _res, next) => {
    await assertNotebookOwnership(req.userId!, req.params.notebookId!);
    next();
  })
);

sourcesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const sources = await sourcesService.listSources(req.params.notebookId!);
    res.json(sources);
  })
);

const textSchema = z.object({ title: z.string().min(1), content: z.string().min(1) });
sourcesRouter.post(
  "/text",
  asyncHandler(async (req, res) => {
    const { title, content } = textSchema.parse(req.body);
    const source = await sourcesService.createTextSource(req.params.notebookId!, title, content);
    res.status(201).json(source);
  })
);

const urlSchema = z.object({ title: z.string().min(1), url: z.string().url() });
sourcesRouter.post(
  "/url",
  asyncHandler(async (req, res) => {
    const { title, url } = urlSchema.parse(req.body);
    const source = await sourcesService.createUrlSource(req.params.notebookId!, title, url);
    res.status(201).json(source);
  })
);

sourcesRouter.post(
  "/youtube",
  asyncHandler(async (req, res) => {
    const { title, url } = urlSchema.parse(req.body);
    const source = await sourcesService.createYoutubeSource(req.params.notebookId!, title, url);
    res.status(201).json(source);
  })
);

sourcesRouter.post(
  "/pdf",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("No file uploaded (expected field 'file')", 422);
    const title = (req.body.title as string) || req.file.originalname;
    const source = await sourcesService.createFileSource(
      req.params.notebookId!,
      title,
      "PDF",
      req.file.path
    );
    res.status(201).json(source);
  })
);

sourcesRouter.post(
  "/vtt",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("No file uploaded (expected field 'file')", 422);
    const title = (req.body.title as string) || req.file.originalname;
    const source = await sourcesService.createFileSource(
      req.params.notebookId!,
      title,
      "VTT",
      req.file.path
    );
    res.status(201).json(source);
  })
);

sourcesRouter.post(
  "/:sourceId/reindex",
  asyncHandler(async (req, res) => {
    await sourcesService.reindex(req.params.notebookId!, req.params.sourceId!);
    res.status(202).json({ message: "Re-indexing started" });
  })
);

sourcesRouter.delete(
  "/:sourceId",
  asyncHandler(async (req, res) => {
    await sourcesService.deleteSource(req.params.notebookId!, req.params.sourceId!);
    res.status(204).send();
  })
);
