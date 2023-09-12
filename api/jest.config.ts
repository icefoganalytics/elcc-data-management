import type { JestConfigWithTsJest } from "ts-jest"

export const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": ["<rootDir>/src/$1", "<rootDir>/tests/$1"],
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"], // Runs once for each test file
  globalSetup: "<rootDir>/tests/global-setup.ts", // Runs once before all tests
}

export default jestConfig
