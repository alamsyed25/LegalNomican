/**
 * Jest configuration for LegalNomican Project
 */
module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",
  
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    "<rootDir>/tests"
  ],

  // The test environment that will be used for testing
  testEnvironment: "node",
  
  // Run tests in separate processes
  // Helps with tests that might have side effects on the environment
  runInBand: true,
  
  // Sets the path to the dotenv file for loading environment variables in tests
  setupFiles: ["<rootDir>/tests/setup.js"],
  
  // Ignore specific directories
  testPathIgnorePatterns: [
    "/node_modules/",
    "/uploads/"
  ],
  
  // Default timeout in milliseconds
  testTimeout: 10000,
};
