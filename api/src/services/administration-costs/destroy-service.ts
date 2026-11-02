import { AdministrationCost } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(private administrationCost: AdministrationCost) {
    super()
  }

  async perform(): Promise<void> {
    await this.administrationCost.destroy()
  }
}

export default DestroyService
