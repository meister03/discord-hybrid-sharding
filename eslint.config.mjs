import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores([".git", "node_modules", "docs"]), {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:prettier/recommended",
        "plugin:@typescript-eslint/recommended",
    ),

    plugins: {
        prettier,
        jsdoc,
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "commonjs",
    },

    rules: {
        "jsdoc/no-undefined-types": "warn",
        "no-unused-vars": "off",
        "prettier/prettier": "off",
        "sort-keys": 0,
        "@typescript-eslint/ban-ts-comment": 0,
        "@typescript-eslint/ban-types": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/naming-convention": 0,
        "@typescript-eslint/member-ordering": 0,
        "@typescript-eslint/return-await": 0,
        "@typescript-eslint/no-dynamic-delete": 0,
        "@typescript-eslint/no-require-imports": 0,
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/restrict-template-expressions": 0,
        "prefer-named-capture-group": 0,
        "no-useless-escape": 0,
        "@typescript-eslint/no-unnecessary-condition": 0,
        "@typescript-eslint/prefer-optional-chain": 0,
        "max-len": 0,
        "no-negated-condition": 0,
        "class-methods-use-this": 0,
        "@typescript-eslint/no-shadow": 0,
        "@typescript-eslint/prefer-nullish-coalescing": 0,
        "@typescript-eslint/no-unsafe-declaration-merging": 0, // Add this rule to disable the error
        "@typescript-eslint/no-wrapper-object-types": 0, // Add this rule to disable the error
        "prefer-const": "error", // Add this rule to enforce the use of const
        "@typescript-eslint/no-empty-object-type": "error"
    },
}]);