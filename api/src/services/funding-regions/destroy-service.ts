import db, { BuildingExpenseCategory, Centre, FundingRegion, User } from "@/models"
import { BuildingExpenseCategories } from "@/services"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(
    private fundingRegion: FundingRegion,
    private currentUser: User
  ) {
    super()
  }

  async perform(): Promise<void> {
    await db.transaction(async () => {
      await this.assertNoDependentEntitiesExist(this.fundingRegion.id)

      await this.removeDependentEntities(this.fundingRegion.id)

      await this.fundingRegion.destroy()
    })
  }

  private async assertNoDependentEntitiesExist(fundingRegionId: number) {
    await this.assertNoDependentCentresExist(fundingRegionId)
  }

  private async assertNoDependentCentresExist(fundingRegionId: number) {
    const centresCount = await Centre.count({
      where: {
        fundingRegionId,
      },
    })

    if (centresCount > 0) {
      throw new Error("Funding region with centres cannot be deleted")
    }
  }

  private async removeDependentEntities(fundingRegionId: number) {
    await this.removeDependentBuildingExpenseCategories(fundingRegionId)
  }

  private async removeDependentBuildingExpenseCategories(fundingRegionId: number) {
    await BuildingExpenseCategory.findEach(
      {
        where: {
          fundingRegionId,
        },
      },
      async (buildingExpenseCategory) => {
        await BuildingExpenseCategories.DestroyService.perform(
          buildingExpenseCategory,
          this.currentUser
        )
      }
    )
  }
}

export default DestroyService
