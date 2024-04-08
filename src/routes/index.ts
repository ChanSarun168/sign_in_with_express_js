import express, { Request, Response } from "express";
import { UserController } from "../controller/userController";
import { validateUser } from "../middleware/userValidation";
import { IUser, User } from "../database/models/user";
import { generateEmailVerificationToken } from "../utils/randomToken";
import Token from "../database/models/userToken";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { generateToken } from "../utils/generateJWTtoken";
import { Types } from "mongoose";
import {sendVerificationEmail} from '../utils/userEmailConfig';

require("dotenv").config();

const router = express.Router();
const userController = new UserController();

// login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if the user with the given email exists
    const user: IUser | null = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare the password with the hashed password stored in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Email hasn't verified yet!" });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success message along with the token
    res.json({ message: "Login successfully, welcome to our app.", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred while logging in." });
  }
});



router.get("/verify", async (req, res) => {
  const { token } = req.query;

  try {
    let tokenDoc = await Token.findOne({ token });

    if (!tokenDoc) {
      throw new Error("Invalid token");
    }

    if (tokenDoc.expired < new Date()) {
      await Token.deleteOne({ token });

      const user = await User.findById(tokenDoc.userId);
      if (!user) {
        throw new Error("User not found");
      }
     
      const newtoken = generateEmailVerificationToken(user._id)
      const newTime = new Date();

      newTime.setMinutes(newTime.getMinutes() + 1);
      // Save the new verification token to the database
      const newTokenDoc = new Token({ userId: user._id, token: newtoken, expired:newTime});
      const newEmailToken = await newTokenDoc.save();
      const verificationLink = `http://localhost:5000/user/verify?token=${newtoken}`;
      console.log("newToken:",newtoken);
      console.log("newEmail:" ,newEmailToken);
      // Send verification email
      await sendVerificationEmail(user.email, verificationLink); 
      return res.status(400).json({
        message: "Token expired. A new verification email has been sent.",
      });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.isVerified = true;
    await user.save();

    const tokenAfterVerify = generateToken(user._id);

    await Token.deleteOne({ token });

    res.json({
      message: "User verified successfully",
      token: tokenAfterVerify,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});



// router.get("/verify", async (req, res) => {
//   const { token } = req.query;

//   try {
//     // Find the token in the database
//     const tokenDoc = await Token.findOne({ token });

//     if (!tokenDoc) {
//       throw new Error("Invalid token");
//     }

//     const { userId, expired } = tokenDoc;

//     // Check if the token has expired
//     if (expired < new Date()) {
//       const TOKEN_EXPIRATION_TIME_MS = 60 * 1000
//       // Token has expired, delete it from the database
//       await Token.deleteOne({ token });

//       // Generate a new token
//       const newToken = generateToken(userId.toString());

//       // Save the new token in the database
//       const newTokenDoc = new Token({ userId, token: newToken, expired: new Date(Date.now() + TOKEN_EXPIRATION_TIME_MS) });
//       await newTokenDoc.save();

//       // Send verification email with the new token
//       sendVerificationEmail(userId, newToken);

//       return res.json({
//         message: "Token expired. New token generated. Verification email sent.",
//       });
//     }

//     // Token is still valid, proceed with user verification
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new Error("User not found");
//     }

//     // Update user's isVerified status
//     user.isVerified = true;
//     await user.save();

//     // Generate JWT token after verifying the user
//     const tokenAfterVerify = generateToken(user._id);

//     // Delete the token from the database
//     await Token.deleteOne({ token });

//     res.json({
//       message: "User verified successfully",
//       token: tokenAfterVerify,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

router.post("/", async (req: Request, res: Response<any>) => {
  try {
    const { email } = req.body;

    // Check if user with the given email exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already use , Please use another email" });
    }

    // Check if user with the given email exists but not verified
    const unverifiedUser = await User.findOne({ email, isVerified: false });

    if (unverifiedUser) {
      return res.status(400).json({ message: "Please verify your email." });
    }

    // Proceed with user creation if the user is new or already verified
    const user = await userController.createUser(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Routes without user validation
router.get("/", async (req: Request, res: Response<any>) => {
  try {
    const users = await userController.getAllUsers(req.query);
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/:userId",
  validateUser,
  async (req: Request, res: Response<any>) => {
    try {
      const userId = req.params.userId;
      const user = await userController.updateUser(userId, req.body);
      res.status(200).json(user); // Assuming updateUser returns the updated user
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.delete("/:userId", async (req: Request, res: Response<any>) => {
  try {
    const userId = req.params.userId;
    const user = await userController.deleteUser(userId);
    res.status(200).json(user); // Assuming deleteUser returns the deleted user
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:userId", async (req: Request, res: Response<any>) => {
  try {
    const userId = req.params.userId;
    const user = await userController.getUserById(userId);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;


