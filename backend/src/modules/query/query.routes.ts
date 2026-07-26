import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/errorHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { assertNotebookOwnership } from "@/modules/notebooks/notebooks.service";
import { answerQuestion } from "./query.service";

export const queryRouter = Router({ mergeParams: true });

queryRouter.use(requireAuth);

const querySchema = z.object({ question: z.string().min(1) });

queryRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    await assertNotebookOwnership(req.userId!, req.params.notebookId!);
    const { question } = querySchema.parse(req.body);
    const result = await answerQuestion(req.params.notebookId!, question);
    res.json(result);
  })
);
