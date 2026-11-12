import { AdministrationCost, AdministrationCostCategory } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private administrationCostCategory: AdministrationCostCategory) {
    super()
  }

  async perform(): Promise<void> {
    const administrationCostsUsingCategory = await AdministrationCost.count({
      where: { categoryId: this.administrationCostCategory.id },
    })
    if (administrationCostsUsingCategory > 0) {
      throw new Error("Cannot delete a category used by Administration Cost records")
    }

    await this.administrationCostCategory.destroy()
  }
}

export default DestroyService
