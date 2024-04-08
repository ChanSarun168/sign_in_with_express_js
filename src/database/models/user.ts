import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isVerified: boolean;
  googleId: string;
 
}

const userSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String},
  isVerified: { type: Boolean, default: false },
  googleId: {type:String , unique:true}
  
});

export const User = mongoose.model<IUser>("User", userSchema);
