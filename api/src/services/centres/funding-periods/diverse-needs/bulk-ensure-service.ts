import { isEmpty } from "lodash"

import { DiverseNeed, Centre, FiscalPeriod, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/centres/funding-periods/diverse-needs/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod,
    private isInitialProvisioning: boolean
  ) {
    super()
  }

  async perform(): Promise<DiverseNeed[]> {
    const fiscalPeriods = await FiscalPeriod.findAll({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
    })
    const fiscalPeriodIds = fiscalPeriods.map(({ id }) => id)
    const existing = await DiverseNeed.findAll({
      where: {
        centreId: this.centre.id,
        fiscalPeriodId: fiscalPeriodIds,
      },
      paranoid: false,
    })
    if (!isEmpty(existing) || !this.isInitialProvisioning) {
      return DiverseNeed.findAll({
        where: {
          centreId: this.centre.id,
          fiscalPeriodId: fiscalPeriodIds,
        },
      })
    }

    return BulkCreateService.perform(this.centre, this.fundingPeriod)
  }
}

export default BulkEnsureService
