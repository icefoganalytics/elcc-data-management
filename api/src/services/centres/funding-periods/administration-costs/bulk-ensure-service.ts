import { isNil } from "lodash"

import { AdministrationCost, Centre, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/centres/funding-periods/administration-costs/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod,
    private isInitialProvisioning: boolean
  ) {
    super()
  }

  async perform(): Promise<AdministrationCost[]> {
    await this.provisionInitialLedger()

    return AdministrationCost.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findAll({
      where: { centreId: this.centre.id },
    })
  }

  private async provisionInitialLedger(): Promise<void> {
    if (!this.isInitialProvisioning) return

    const historicalAdministrationCost = await AdministrationCost.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findOne({
      attributes: ["id"],
      where: { centreId: this.centre.id },
      paranoid: false,
    })
    if (!isNil(historicalAdministrationCost)) return

    await BulkCreateService.perform(this.centre, this.fundingPeriod)
  }
}

export default BulkEnsureService
