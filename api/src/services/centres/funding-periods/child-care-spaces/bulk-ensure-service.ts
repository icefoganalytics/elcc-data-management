import { ChildCareSpace, Centre, FundingPeriod } from "@/models"
import BaseService from "@/services/base-service"
import BulkCreateService from "@/services/centres/funding-periods/child-care-spaces/bulk-create-service"

export class BulkEnsureService extends BaseService {
  constructor(
    private centre: Centre,
    private fundingPeriod: FundingPeriod
  ) {
    super()
  }

  async perform(): Promise<ChildCareSpace[]> {
    await BulkCreateService.perform(this.centre, this.fundingPeriod)

    return ChildCareSpace.withScope({
      method: ["byFundingPeriod", this.fundingPeriod.id],
    }).findAll({
      where: {
        centreId: this.centre.id,
      },
    })
  }
}

export default BulkEnsureService
