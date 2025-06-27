import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const JWT_USER_PASSWORD = "iammanan";
import { z } from "zod";
import userMiddleware from "../middleware/user.js";
import { userModel } from "../db.js";

const app = express();

const userRouter = express.Router();

userRouter.post("/signup", async function (req, res) {
  const requiredBody = z.object({
    email: z.string().min(3).max(100).email(),
    firstName: z.string().min(3).max(10),
    lastName: z.string().min(3).max(10),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[0-9]/, "Password must include at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must include at least one special character"
      ),
  });
  const parsedDataWithSuccess = requiredBody.safeParse(req.body);
  if (!parsedDataWithSuccess.success) {
    res.json({
      message: "incorrect format",
    });
    return;
  }
  const { email, firstName, lastName, password } = parsedDataWithSuccess.data;
  const hashedPass = await bcrypt.hash(password, 10);
  try {
    await userModel.create({
      email,
      firstName,
      lastName,
      password: hashedPass,
    });
  } catch (err) {
    res.status(403).json({
      err,
    });
  }
  res.json({
    message: "signup succeeded",
  });
});

userRouter.post("/signin", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const response = await userModel.findOne({
    email,
  });
  if (!response) {
    res.status(403).json({
      message: "user does not exist in our db",
    });
    return;
  }
  const passwordmatch = await bcrypt.compare(password, response.password);
  if (passwordmatch) {
    const token = jwt.sign(
      {
        id: response._id.toString(),
      },
      JWT_USER_PASSWORD
    );
    res.json({
      token,
    });
  } else {
    res.status(403).json({
      message: "incorrect Credential",
    });
  }
});

userRouter.get("/profile", userMiddleware, async function (req, res) {
  try {
    const user = await userModel
      .findOne({ _id: req.userId })
      .select("-password");
    // const user = await userModel.findById(req.userId).select
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

userRouter.put("/update", userMiddleware, async function (req, res) {
  const userId = req.userId;
  const { email, firstName, lastName } = req.body;
  let updateFields = {
    email,
    firstName,
    lastName,
  };

  // Only hash and include password if provided

  const user = await userModel.updateOne(
    {
      _id: userId,
      //$set is a MongoDB update operator that updates specific fields in a document without replacing the entire document.
    },
    {
      $set: updateFields,
    }
  );
  res.json({
    message: "profile Updated",
  });
});

userRouter.put("/change-password", userMiddleware, async function (req, res) {
  const { oldPass, newPass } = req.body;

  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Old password doesn't match" });
    }

    const hashedNewPass = await bcrypt.hash(newPass, 10);
    await userModel.updateOne({ _id: req.userId }, { password: hashedNewPass });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

userRouter.delete("/delete", userMiddleware, async function (req, res) {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    await userModel.deleteOne({ _id: userId });
    res.json({
      message: "User deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: "server error",
      error: err.message,
    });
  }
});
export { userRouter };
