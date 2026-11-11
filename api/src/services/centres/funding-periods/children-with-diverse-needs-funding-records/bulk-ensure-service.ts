import { isNil } from "lodash"

import { Centre, ChildrenWithDiverseNeedsFundingRecord, FundingPeriod } from "@/models"
import { Centres } from "@/services"
import BaseService from "@/services/base-service"

export class BulkEnsureService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<void> {
    const historicalRecord = await ChildrenWithDiverseNeedsFundingRecord.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findOne({
      attributes: ["id"],
      where: {
        centreId: this.centre.id,
      },
      paranoid: false,
    })
    if (!isNil(historicalRecord)) {
      return
    }

    await Centres.FundingPeriods.ChildrenWithDiverseNeedsFundingRecords.BulkCreateService.perform(
      this.centre,
      this.fundingPeriod
    )
  }
}

export default BulkEnsureService
