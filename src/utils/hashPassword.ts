import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
  // Hash the password and return the hashed value
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
  return hashedPassword;
}
