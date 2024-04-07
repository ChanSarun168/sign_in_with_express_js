// import express from "express";
// import passport from "passport";

// const authRoute = express.Router();

// // Route to initiate Google OAuth authentication
// authRoute.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// // Route for Google OAuth callback after successful authentication
// authRoute.get(
//   "/google/callback",
//   passport.authenticate("google", { successRedirect: "/protected", failureRedirect: "/auth/failure" })
// );

// // Protected route that requires authentication
// authRoute.get("/protected", (req, res) => {
//   res.send("Hello, you are authenticated!");
// });

// // Route to handle authentication failures
// authRoute.get("/auth/failure", (req, res) => {
//   res.send("Authentication failed. Please try again.");
// });

import express, { Request, Response, NextFunction } from "express";
import passport from "passport";

// Create the Express router
export const authRoute = express.Router();

// Middleware to check if the user is authenticated
function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  // Passport.js adds the 'user' object to the request if the user is authenticated
  if (req.user) {
    next(); // User is authenticated, proceed to the next middleware or route handler
  } else {
    res.status(401).send("Unauthorized"); // User is not authenticated, send 401 Unauthorized
  }
}

// Route to initiate Google OAuth2 authentication
authRoute.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

// Route to handle the Google OAuth2 callback after authentication
authRoute.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/success",
    failureRedirect: "/auth/google/failure",
  })
);

// Route for successful Google OAuth2 authentication
authRoute.get("/auth/google/success", isLoggedIn, (req, res) => {
  res.send("Hello there! You are authenticated.");
});

// Route for failed Google OAuth2 authentication
authRoute.get("/auth/google/failure", (req, res) => {
  res.status(401).send("Authentication failed. Please try again.");
});

