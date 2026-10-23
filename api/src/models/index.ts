export { type FundingLineValue } from "@/models/funding-line-value"

import db from "@/db/db-client"

import AdministrationCost from "@/models/administration-cost"
import AdministrationCostCategory from "@/models/administration-cost-category"
import BuildingExpense from "@/models/building-expense"
import BuildingExpenseCategory from "@/models/building-expense-category"
import Centre from "@/models/centre"
import ChildCareSpace from "@/models/child-care-space"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import EmployeeBenefit from "@/models/employee-benefit"
import EmployeeWageTier from "@/models/employee-wage-tier"
import FiscalPeriod from "@/models/fiscal-period"
import FundingPeriod from "@/models/funding-period"
import FundingReconciliation from "@/models/funding-reconciliation"
import FundingReconciliationAdjustment from "@/models/funding-reconciliation-adjustment"
import FundingRegion from "@/models/funding-region"
import FundingSubmissionLine from "@/models/funding-submission-line"
import FundingSubmissionLineJson from "@/models/funding-submission-line-json"
import Log from "@/models/log"
import Payment from "@/models/payment"
import User from "@/models/user"
import WageEnhancement from "@/models/wage-enhancement"

db.addModels([
  AdministrationCost,
  AdministrationCostCategory,
  BuildingExpense,
  BuildingExpenseCategory,
  Centre,
  ChildCareSpace,
  ChildCareSpaceCategory,
  EmployeeBenefit,
  EmployeeWageTier,
  FiscalPeriod,
  FundingPeriod,
  FundingReconciliation,
  FundingReconciliationAdjustment,
  FundingRegion,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
  Log,
  Payment,
  User,
  WageEnhancement,
])

AdministrationCost.establishScopes()
AdministrationCostCategory.establishScopes()
BuildingExpense.establishScopes()
BuildingExpenseCategory.establishScopes()
Centre.establishScopes()
ChildCareSpace.establishScopes()
ChildCareSpaceCategory.establishScopes()
EmployeeBenefit.establishScopes()
EmployeeWageTier.establishScopes()
FiscalPeriod.establishScopes()
FundingPeriod.establishScopes()
FundingReconciliation.establishScopes()
FundingReconciliationAdjustment.establishScopes()
FundingRegion.establishScopes()
FundingSubmissionLine.establishScopes()
FundingSubmissionLineJson.establishScopes()
Log.establishScopes()
Payment.establishScopes()
User.establishScopes()
WageEnhancement.establishScopes()

export {
  AdministrationCost,
  AdministrationCostCategory,
  BuildingExpense,
  BuildingExpenseCategory,
  Centre,
  ChildCareSpace,
  ChildCareSpaceCategory,
  EmployeeBenefit,
  EmployeeWageTier,
  FiscalPeriod,
  FundingPeriod,
  FundingReconciliation,
  FundingReconciliationAdjustment,
  FundingRegion,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
  Log,
  Payment,
  User,
  WageEnhancement,
}

// special db instance that has access to all models.
export default db
