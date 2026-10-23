import { AdministrationCostCategory } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private administrationCostCategory: AdministrationCostCategory) {
    super()
  }

  async perform(): Promise<void> {
    await this.administrationCostCategory.destroy()
  }
}

export default DestroyService
