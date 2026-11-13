import { type AxiosInstance } from "axios"
import MockAdapter from "axios-mock-adapter"
import { onTestFinished } from "vitest"

export function mockAxios(client: AxiosInstance): MockAdapter {
  const mock = new MockAdapter(client, { onNoMatch: "throwException" })
  onTestFinished(() => mock.restore())
  return mock
}

export default mockAxios
