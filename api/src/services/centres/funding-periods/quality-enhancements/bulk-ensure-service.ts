import { isNil } from "lodash"

import Centre from "@/models/centre"
import FundingPeriod from "@/models/funding-period"
import QualityEnhancement from "@/models/quality-enhancement"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/centres/funding-periods/quality-enhancements/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod,
    private isInitialProvisioning = false
  ) {
    super()
  }

  async perform(): Promise<QualityEnhancement[]> {
    if (this.isInitialProvisioning) await this.provisionInitialLedger()
    return QualityEnhancement.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findAll({
      where: { centreId: this.centre.id },
    })
  }

  private async provisionInitialLedger(): Promise<void> {
    const existing = await QualityEnhancement.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findOne({
      attributes: ["id"],
      where: { centreId: this.centre.id },
      paranoid: false,
    })
    if (isNil(existing)) await BulkCreateService.perform(this.centre, this.fundingPeriod, true)
  }
}

export default BulkEnsureService
