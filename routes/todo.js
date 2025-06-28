import express from "express";
const Router = express.Router;
const todoRouter = Router();
import { todoModel } from "../db.js";
import { z } from "zod";
import userMiddleware from "../middleware/user.js";

todoRouter.post("/create", userMiddleware, async function (req, res) {
  const requiredBody = z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(10).max(100),
    status: z.enum(["pending", "in-progress", "completed"]).optional(),
  });
  try {
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parsedDataWithSuccess.success) {
      return res.json({
        message: "incorrect format",
      });
    }
    const { title, description, status } = parsedDataWithSuccess.data;
    await todoModel.create({
      title,
      description,
      status,
      userId: req.userId,
    });
    res.json({ message: "todo created" });
  } catch (err) {
    res.status(500).json({
      message: "failed to create",
      error: err.message,
    });
  }
});

todoRouter.get("/todos", userMiddleware, async function (req, res) {
  const todos = await todoModel.find({ userId: req.userId });
  if (!todos) {
    return res.json({
      message: "error",
    });
  }
  res.json({
    message: "todos fetched",
    todos,
  });
});

todoRouter.put("/todo/:id", userMiddleware, async (req, res) => {
  const todoId = req.params.id;
  const userId = req.userId;

  // Define validation schema for update body
  const updateSchema = z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(3).max(200).optional(),
    status: z.enum(["pending", "in-progress", "completed"]).optional(),
  });

  // Validate request body
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid data format", errors: parsed.error.errors });
  }

  try {
    const updated = await todoModel.updateOne(
      { _id: todoId, userId }, // Ensure the todo belongs to the logged-in user
      { $set: parsed.data }
    );

    if (updated.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Todo not found or unauthorized" });
    }

    res.json({ message: "Todo updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

todoRouter.delete("/delete/:id", userMiddleware, async function (req, res) {
  const todoId = req.params.id;
  if (!todoId) {
    res.json({
      message: "todo not found",
    });
  }
  try {
    await todoModel.deleteOne({ _id: todoId });
    res.json({
      message: "todo deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
export { todoRouter };
