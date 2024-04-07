import passport from "passport";


var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request:any, accessToken:any, refreshToken:any, profile:any, done:any) {
    done(null,profile);
  }
));
passport.serializeUser((user,done)=>{
  done(null,user);
});

passport.deserializeUser((user:any,done)=>{
  done(null, user);
})

export default passport;