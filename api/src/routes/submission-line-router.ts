import express, { type Request, type Response } from "express"
import { param } from "express-validator"
import { checkJwt, loadUser } from "../middleware/authz.middleware"
import { ReturnValidationErrors } from "../middleware"
import { SubmissionLineService } from "../services"
import { FundingSubmissionLine } from "@/models"
import { FundingSubmissionLineSerializer } from "@/serializers"

export const submissionLineRouter = express.Router()

submissionLineRouter.use(checkJwt)
submissionLineRouter.use(loadUser)

const db = new SubmissionLineService()

submissionLineRouter.get("/", async (req: Request, res: Response) => {
  const fundingSubmissionLines = await FundingSubmissionLine.findAll()

  const serailizedFundingSubmissionLines =
    FundingSubmissionLineSerializer.serialize(fundingSubmissionLines)

  res.json({ data: serailizedFundingSubmissionLines })
})

submissionLineRouter.put(
  "/:id",
  [param("id").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const { id } = req.params
    await db.update(parseInt(id), req.body)

    res.json({ data: req.body })
  }
)

submissionLineRouter.post("/fiscal-year", async (req: Request, res: Response) => {
  const { fiscal_year, base_lines_on, interval } = req.body
  const yearExists = await db.getAll({ fiscal_year })

  if (yearExists.length > 0) {
    return res.status(400).json({ message: "Year already exists" })
  }

  const basis = await db.getAll({ fiscal_year: base_lines_on })

  for (const line of basis) {
    delete line.id
    line.fiscal_year = fiscal_year

    await db.create(line)
  }

  res.json({ data: req.body })
})

submissionLineRouter.post("/", async (req: Request, res: Response) => {
  await db.create(req.body)

  res.json({ data: req.body })
})

submissionLineRouter.delete("/:id", async (req: Request, res: Response) => {
  res.json({})
})
