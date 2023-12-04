import express, { type Request, type Response } from "express"
import cors from "cors"
import path from "path"
import helmet from "helmet"
import { VUE_APP_FRONTEND_URL } from "@/config"
import {
  apiRouter,
  userRouter,
  centreRouter,
  centreFundingRouter,
  fundingPeriodRouter,
  submissionLineRouter,
} from "./routes"
import { migrationRouter } from "./routes/migration-router"
import { checkJwt, autheticateAndLoadUser } from "./middleware/authz.middleware"

export const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'", "https://dev-0tc6bn14.eu.auth0.com"],
      "base-uri": ["'self'"],
      "block-all-mixed-content": [],
      "font-src": ["'self'", "https:", "data:"],
      "frame-ancestors": ["'self'"],
      "img-src": ["'self'", "data:", "https:"],
      "object-src": ["'none'"],
      "script-src": ["'self'", "'unsafe-eval'"],
      "script-src-attr": ["'none'"],
      "style-src": ["'self'", "https:", "'unsafe-inline'"],
      "worker-src": ["'self'", "blob:"],
      "connect-src": ["'self'", "https://dev-0tc6bn14.eu.auth0.com"],
    },
  })
)

// very basic CORS setup
app.use(
  cors({
    origin: VUE_APP_FRONTEND_URL,
    optionsSuccessStatus: 200,
    credentials: true,
  })
)
/*
app.get("/api/healthCheck", RequiresData, (req: Request, res: Response) => {
  // app.get("/api/healthCheck",  (req: Request, res: Response) => {
  doHealthCheck(req, res);
});
 */
app.use("/api/user", userRouter)
app.use("/api/migrate", migrationRouter)
app.use("/api/centre", checkJwt, autheticateAndLoadUser, centreRouter)
app.use("/api/funding-period", fundingPeriodRouter)
app.use("/api/submission-line", submissionLineRouter)
app.use("/api/centreSubmission", checkJwt, autheticateAndLoadUser, centreFundingRouter)
app.use(apiRouter)

// serves the static files generated by the front-end
app.use(express.static(path.join(__dirname, "web")))

// if no other routes match, just send the front-end
app.use((req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "web") + "/index.html")
})

export default app
