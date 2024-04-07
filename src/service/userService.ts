import { UserRepo } from "../database/repository/userRepo";
import { hashPassword } from "../utils/hashPassword";
import { User } from "../database/models/user";

export class UserService {
  private userRepository: UserRepo;

  constructor() {
    this.userRepository = new UserRepo();
  }

  async getAllUsers(page: number, limit: number, username: string) {
    const skip = (page - 1) * limit;
    let query = {};

    if (username) {
      // If username is provided, filter by username
      query = { username: { $regex: username, $options: "i" } };
    }

    return await User.find(query).skip(skip).limit(limit);
  }

  async getUserCount() {
    return await User.countDocuments({});
  }

  async getUserById(userId: string) {
    return await this.userRepository.getUserById(userId);
  }

  async createUser(userData: any) {
    const hashedPassword = await hashPassword(userData.password);
    const userWithHashedPassword = { ...userData, password: hashedPassword };
    return await this.userRepository.createUser(userWithHashedPassword);
  }

  async updateUser(userId: string, updatedUserData: any) {
    return await this.userRepository.updateUser(userId, updatedUserData);
  }

  async deleteUser(userId: string) {
    return await this.userRepository.deleteUser(userId);
  }

  async verifyToken(tokenValue:string){
    
  }
}
