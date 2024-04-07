import { Request, Response } from "express";
import { UserService } from "../service/userService";
import StatusCodes from "../utils/const/statusCode";
import { sendVerificationEmail } from "../utils/userEmailConfig";
import { generateEmailVerificationToken } from "../utils/randomToken";
import { saveToken } from "../service/tokenService";
import { generateToken } from "../utils/generateJWTtoken";
import {
  Query,
  Route,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Body,
  Queries,
} from "tsoa";
import Token from "../database/models/userToken";
import { User } from "../database/models/user";

const userService = new UserService();

interface QueryParams {
  limit?: number;
  page?: number;
  username?: string;
}

@Route("user")
export class UserController {
  @Get("/")
  public async getAllUsers(@Queries() queryParams: QueryParams): Promise<any> {
    try {
      const pageNumber = queryParams.page ? queryParams.page : 1;
      const pageSize = queryParams.limit ? queryParams.limit : 10;
      const nameFilter =
        queryParams.username !== null && queryParams.username !== undefined
          ? queryParams.username
          : "";

      const users = await userService.getAllUsers(
        pageNumber as number,
        pageSize as number,
        nameFilter // Passing name filter to userService.getAllUsers function
      );

      const totalCount = await userService.getUserCount();
      const totalPages = Math.ceil((totalCount / pageSize) as number);

      return {
        status: "success",
        message: "Users are found",
        data: users,
        meta: {
          page: pageNumber,
          limit: pageSize,
          total: totalCount,
          totalPages: totalPages,
        },
      };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  @Get("/{userId}")
  public async getUserById(@Path() userId: string): Promise<any> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error("User not found");
      } else {
        return {
          data: user,
        };
      }
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  @Post("/")
  public async createUser(@Body() requestBody: any): Promise<any> {
    try {
      const user = await userService.createUser(requestBody);

      // Generate verification token
      const token = generateEmailVerificationToken(user._id); // Assuming user._id is the MongoDB ObjectId
      const newTime = new Date();

      newTime.setMinutes(newTime.getMinutes() + 1);

      // Save token
      await saveToken(user._id, token ,newTime);

      // Generate verification link
      const verificationLink = `http://localhost:5000/user/verify?token=${token}`;

      // Send verification email
      await sendVerificationEmail(user.email, verificationLink);




      return {
        status: "success",
        message: "User created successfully. Verification email sent.", 
      };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  @Put("/{userId}")
  public async updateUser(
    @Path() userId: string,
    @Body() updatedUserData: any
  ): Promise<any> {
    try {
      const user = await userService.updateUser(userId, updatedUserData);
      if (!user) {
        throw new Error("User not found");
      } else {
        return {
          status: "success",
          message: "User updated successfully",
          data: user,
        };
      }
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  @Delete("/{userId}")
  public async deleteUser(@Path() userId: string): Promise<any> {
    try {
      const user = await userService.deleteUser(userId);
      if (!user) {
        throw new Error("User not found");
      } else {
        return {
          status: "success",
          message: "User deleted successfully",
          data: user,
        };
      }
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  @Get("/verify")
  public async verifyUser(@Query() token: string): Promise<any> {
    try {
      // Find the token in the database
      const tokenDoc = await Token.findOne({ token });
      if (!tokenDoc) {
        throw new Error("Invalid token");
      }

      // Update the user's isVerified status
      const user = await User.findById(tokenDoc.userId);
      if (!user) {
        throw new Error("User not found");
      }


      user.isVerified = true;
      await user.save();

      // Delete the token from the database
      await Token.deleteOne({ token });

      return { message: "User verified successfully" };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }
}
