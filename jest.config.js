module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  watchPathIgnorePatterns: [
    "<rootDir>/dist/"
  ]
}