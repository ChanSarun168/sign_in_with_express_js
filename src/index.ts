// app.ts

require("dotenv").config();
import express, { Express, Request, Response } from "express";
import connectionToDatabase from "./utils/connectionToDatabase";
import router from "./routes/index";
import { time } from "./middleware/requestTime";
import { errorHandler } from "./middleware/errorHandler";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger.json";
import  {authRoute}  from "./routes/authRoute";
import session from "express-session";
import passport from "../src/utils/auth";



const app: Express = express();

app.use(express.json());
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true , cookie:{secure:false} }));
app.use(passport.initialize());
app.use(passport.session());


app.get("/", (req: Request, res: Response) => {
  res.send("Server is running on port 5000");
});
// request time
app.use(time);

// Use routes defined in the routes/index.ts file
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/user", router);
app.use("/users", authRoute)


// global error
app.use(errorHandler);

export default app;
