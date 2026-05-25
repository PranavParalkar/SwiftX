import type { Config } from 'jest'

/**
 * Jest config — two projects:
 *   • unit         → pure TS lib/* tests, node env, fast
 *   • integration  → API route handler tests with mocked Supabase, node env
 *
 * Component / DOM tests can be added under __tests__/component/ with a
 * third project using jest-environment-jsdom.
 */
const config: Config = {
  // Top-level coverage + reporting config — shared across projects
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    // SonarQube quality-gate target — new code coverage ≥ 80%.
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/__tests__/e2e/', '/__tests__/load/'],

  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: { jsx: 'react-jsx', module: 'CommonJS', esModuleInterop: true, isolatedModules: true },
            diagnostics: false,
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: { jsx: 'react-jsx', module: 'CommonJS', esModuleInterop: true, isolatedModules: true },
            diagnostics: false,
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
}

export default config
