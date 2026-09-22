
import bcrypt from "bcryptjs";
import config from "../config/env.js";

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, config.bcrypt_salt_rounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};