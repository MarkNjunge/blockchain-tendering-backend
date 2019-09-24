import * as crypto from "crypto";

export function generateSessionId() {
  return crypto.randomBytes(24).toString("hex");
}
