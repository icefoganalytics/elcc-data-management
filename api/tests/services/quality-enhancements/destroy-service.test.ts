import { qualityEnhancementFactory } from "@/factories"
import QualityEnhancement from "@/models/quality-enhancement"
import DestroyService from "@/services/quality-enhancements/destroy-service"

describe("api/src/services/quality-enhancements/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when deleting a monthly record, retires it without removing its history", async () => {
        // Arrange
        const enhancement = await qualityEnhancementFactory.create()

        // Act
        await DestroyService.perform(enhancement)

        // Assert
        const retired = await QualityEnhancement.findByPk(enhancement.id, { paranoid: false })
        expect(retired).toEqual(
          expect.objectContaining({ id: enhancement.id, deletedAt: expect.any(Date) })
        )
      })
    })
  })
})
