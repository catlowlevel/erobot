import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    verbose: true,
    transform: {
        "^.+\\.[tj]sx?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    coverageProvider: "v8",
    // moduleNameMapper: manageMapper(
    //     pathsToModuleNameMapper(tsconfigJson.compilerOptions.paths, {
    //         prefix: "<rootDir>/",
    //     }) as Record<string, string>
    // ),
    transformIgnorePatterns: ["<rootDir>/node_modules/"],
};
export default config;
