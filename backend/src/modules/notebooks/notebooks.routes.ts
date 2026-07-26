import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/errorHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import * as notebooksService from "./notebooks.service";

export const notebooksRouter = Router();

notebooksRouter.use(requireAuth); // every route below requires login

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

notebooksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { title, description } = createSchema.parse(req.body);
    const notebook = await notebooksService.createNotebook(req.userId!, title, description);
    res.status(201).json(notebook);
  })
);

notebooksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const notebooks = await notebooksService.listNotebooks(req.userId!);
    res.json(notebooks);
  })
);

notebooksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const notebook = await notebooksService.getNotebook(req.userId!, req.params.id!);
    res.json(notebook);
  })
);

notebooksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await notebooksService.deleteNotebook(req.userId!, req.params.id!);
    res.status(204).send();
  })
);
