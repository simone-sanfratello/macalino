'use strict'

module.exports = {
  roots: ['<rootDir>'],
  collectCoverageFrom: ['src/**'],
  testMatch: ['<rootDir>/test/!(_)**.test.js'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  coveragePathIgnorePatterns: ['/test/'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
