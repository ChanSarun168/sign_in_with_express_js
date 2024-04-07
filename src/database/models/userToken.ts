// user-token.ts
import mongoose from "mongoose";
import { date } from "zod";

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  token: { type: String, required: true },
  expired : {type : Date , required: true}
});

const Token = mongoose.model("Token", tokenSchema);

export default Token;
