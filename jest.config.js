module.exports = {
    testEnvironment: 'jsdom',
    verbose: false,
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
      '^.+\\.tsx?$': [
        'ts-jest',
        {},
      ],
    },
    testRegex: '(/__spec__/.*|(\\.|/)(test|spec))\\.(js|ts)$',
    moduleFileExtensions: [
        'js',
        'ts',
      ],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/../$1',
      },
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/spec/',
      ],
      coverageReporters: [
        'text',
        'json-summary',
      ],
      testEnvironmentOptions: {
        customExportConditions: [
          'node',
          'node-addons',
        ],
      },
      setupFiles: ['./jest.setup.js'],
}