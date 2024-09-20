module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "^libs/(.*)$": "<rootDir>/src/libs/$1",
  },
};
