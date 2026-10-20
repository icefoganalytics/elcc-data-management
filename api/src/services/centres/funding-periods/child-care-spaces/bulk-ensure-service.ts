import { isNil } from "lodash"

import { ChildCareSpace, Centre, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/centres/funding-periods/child-care-spaces/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod,
    private isInitialProvisioning: boolean
  ) {
    super()
  }

  async perform(): Promise<ChildCareSpace[]> {
    await this.provisionInitialLedger()

    return ChildCareSpace.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findAll({
      where: {
        centreId: this.centre.id,
      },
    })
  }

  private async provisionInitialLedger(): Promise<void> {
    if (!this.isInitialProvisioning) return

    const historicalChildCareSpace = await ChildCareSpace.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findOne({
      attributes: ["id"],
      where: { centreId: this.centre.id },
      paranoid: false,
    })
    if (!isNil(historicalChildCareSpace)) return

    await BulkCreateService.perform(this.centre, this.fundingPeriod)
  }
}

export default BulkEnsureService
