import express from "express";
import axios from "axios";
import { User, IUser } from "../database/models/user";
import { generateToken } from "../utils/generateJWTtoken";
require("dotenv").config();

const authRoute = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/users/auth/google/callback";

authRoute.get("/auth/google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
  res.redirect(url);
});

authRoute.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });
 
    const { access_token, id_token } = data;

    const { data: profile } = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    // Check if user already exists in the database based on googleId
    let user = await User.findOne({ email: profile.email });

    if (user) {
      throw new Error("Email already , please sign-up with another acount");
    }
    
    // Create a new user if not found
    const newUser: IUser = new User({
      username: profile.name,
      email: profile.email,
      isVerified: true, // Assuming Google OAuth is verified
      googleId: profile.id,
    });
    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id);
    // Save the new user to the database
    res.json({ token: token });
  } catch (error: any) {
    res.redirect("/users/auth/google");
  }
});

authRoute.get("/logout", (req, res) => {
  // Handle user logout logic
  res.redirect("/login");
});

export default authRoute;
