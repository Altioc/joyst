const { createDefaultEsmPreset } = require("ts-jest");

const preset = createDefaultEsmPreset();

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    ...preset,
    testEnvironment: "jsdom",
    collectCoverage: true,
    coverageReporters: ["text"]
};
