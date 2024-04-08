import passport from "passport";
import { User, IUser } from "../database/models/user"; // Import your User model
import generateRandomPassword from "./generateRandomPassword";

var GoogleStrategy = require('passport-google-oauth2').Strategy;
require("dotenv").config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/users/auth/google/callback",
  passReqToCallback: true
},
async (request: any, accessToken: any, refreshToken: any, profile: any, done: any) => {
  try {
    // Check if the user already exists in the database based on googleId
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {

      const password = generateRandomPassword(10);

      // Create a new user if not found
      user = new User({
        username: profile.displayName,
        email: profile.email,
        password: password, // No password since user signed in with Google
        isVerified: true, // Assume verified since signed in with Google
        googleId: profile.id
      });

      // Save the new user to the database
      await user.save();
    }

    // Pass the user object to the callback
    done(null, user);
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    done(error, null);
  }
}));


passport.serializeUser((user: any, done) => {
  done(null, user.googleId); // Store googleId in session
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findOne({ googleId: id }); // Use googleId instead of _id
    done(null, user);
  } catch (error) {
    done(error);
  }
});


export default passport;
