import { type NextFunction, type Request, type Response } from "express"
import { UserStatus } from "@/models"

export function RequireAdmin(req: Request, res: Response, next: NextFunction) {
  // Linting is broken, this is necessary
  // @ts-expect-error I can't figure out how to override express-jwt's req.user type definition
  if (req.user?.isAdmin !== true) {
    return res.status(403).send("You aren't an admin")
  }
  next()
}

export function RequireActive(req: Request, res: Response, next: NextFunction) {
  // Linting is broken, this is necessary
  // @ts-expect-error I can't figure out how to override express-jwt's req.user type definition
  if (req.user?.status !== UserStatus.ACTIVE) return res.status(403).send("You aren't active")

  next()
}

export function RequireRole(value: any) {
  // let role = value.role;
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log("Checking user:", req.user, "for role", `'${value}'`)
    next()
  }
}
