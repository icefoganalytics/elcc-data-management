import { type GenericAbortSignal } from "axios"
import { effectScope, ref } from "vue"

import httpClient from "@/api/http-client"
import type { AdministrationCostAsIndex } from "@/api/administration-costs-api"

import useAdministrationCosts from "@/use/use-administration-costs"

type AdministrationCostListResponse = {
  data: {
    administrationCosts: AdministrationCostAsIndex[]
    totalCount: number
  }
}

describe("web/src/use/use-administration-costs.ts", () => {
  describe("useAdministrationCosts", () => {
    describe("request lifecycle", () => {
      test("when the consuming scope stops, aborts the pending ledger request", ({
        onTestFinished,
      }) => {
        // Arrange
        const pendingRequest = Promise.withResolvers<AdministrationCostListResponse>()
        let requestSignal: GenericAbortSignal | undefined
        vi.mocked(httpClient, true).get.mockImplementationOnce((_url, options) => {
          requestSignal = options?.signal
          return pendingRequest.promise
        })
        const query = ref({
          where: {
            centreId: 1,
            fiscalPeriodId: 1,
          },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        scope.run(() => useAdministrationCosts(query))

        // Act
        scope.stop()

        // Assert
        expect(requestSignal?.aborted).toEqual(true)
      })
    })
  })
})
