import { isNil } from "lodash"

import {
  Centre,
  ChildrenWithDiverseNeedsFundingRecord,
  FiscalPeriod,
  FundingPeriod,
} from "@/models"
import { Centres } from "@/services"
import BaseService from "@/services/base-service"

export class BulkEnsureService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod,
    private isInitialProvisioning: boolean
  ) {
    super()
  }

  async perform(): Promise<ChildrenWithDiverseNeedsFundingRecord[]> {
    const fiscalPeriods = await FiscalPeriod.findAll({
      attributes: ["id"],
      where: { fundingPeriodId: this.fundingPeriod.id },
    })
    const fiscalPeriodIds = fiscalPeriods.map(({ id }) => id)
    const historicalRecord = await ChildrenWithDiverseNeedsFundingRecord.findOne({
      attributes: ["id"],
      where: {
        centreId: this.centre.id,
        fiscalPeriodId: fiscalPeriodIds,
      },
      paranoid: false,
    })
    if (!isNil(historicalRecord) || !this.isInitialProvisioning) {
      return ChildrenWithDiverseNeedsFundingRecord.findAll({
        where: {
          centreId: this.centre.id,
          fiscalPeriodId: fiscalPeriodIds,
        },
      })
    }

    return Centres.FundingPeriods.ChildrenWithDiverseNeedsFundingRecords.BulkCreateService.perform(
      this.centre,
      this.fundingPeriod
    )
  }
}

export default BulkEnsureService
