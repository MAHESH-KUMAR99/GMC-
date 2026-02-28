import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export class JWTSession {
  constructor() {
    this.secret = process.env.JWT_SECRET;
  }

  async generateJWTToken(uid) {
    const token = jwt.sign({ uid }, this.secret, { expiresIn: "30d" });
    return token;
  }

  async verifyJWTToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return { valid: true, uid: decoded.uid };
    } catch (err) {
      return { valid: false, message: err.message };
    }
  }
}
