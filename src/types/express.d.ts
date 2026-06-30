import * as express from "express";
import { UserRole } from "@/internal/model/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: UserRole;
    }
  }
}
