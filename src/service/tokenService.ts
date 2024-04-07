import Token from "../database/models/userToken";

export async function saveToken(userId:number, token:string , expired: Date) {
  await Token.create({ userId, token , expired});
}
