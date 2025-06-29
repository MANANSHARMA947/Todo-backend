import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
// const router = express.Router()
const app = express();
app.use(express.json());
import { userRouter } from "./routes/user.js";
import { todoRouter } from "./routes/todo.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static('public'));

import dotenv from "dotenv";
dotenv.config();

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.use("/user", userRouter);
app.use("/todo", todoRouter);

const MONGODB_URL = process.env.MONGODB_URL;
async function main() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    app.listen(3000, () => {
      console.log("🚀 Server is running on port 3000");
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

main();
