/**
 * @fileoverview Tests for restrict-external-variables-css-overrides Stylelint rule
 * @author ThoughtSpot TSE Team
 */
"use strict";

const { lint } = require("stylelint");
const path = require("path");
const assert = require("assert");

// Helper function to run stylelint with our config
async function lintCSS(code, filename = "test.scss") {
    const result = await lint({
        code,
        config: {
            plugins: ["./lib/rules/restrict-external-variables-css-overrides.js"],
            rules: {
                "thoughtspot/restrict-external-variables-css-overrides": true,
            },
        },
        configBasedir: path.resolve(__dirname, "../../.."),
        codeFilename: filename,
    });

    return result;
}

describe("restrict-external-variables-css-overrides (Stylelint)", function () {
    describe("valid cases", function () {
        it("should allow regular CSS properties", async function () {
            const result = await lintCSS(".my-class { color: red; }");
            assert.strictEqual(result.errored, false);
            assert.strictEqual(result.results[0].warnings.length, 0);
        });

        it("should allow custom CSS variables (not --ts-var-)", async function () {
            const result = await lintCSS(".my-class { --custom-var: blue; }");
            assert.strictEqual(result.errored, false);
            assert.strictEqual(result.results[0].warnings.length, 0);
        });

        it("should allow --ts-var- in _external_variables files", async function () {
            const result = await lintCSS(
                ".root { --ts-var-primary-color: blue; }",
                "_external_variables.scss"
            );
            assert.strictEqual(result.errored, false);
            assert.strictEqual(result.results[0].warnings.length, 0);
        });

        it("should allow using --ts-var- with var() function", async function () {
            const result = await lintCSS(
                ".my-class { color: var(--ts-var-primary-color); }"
            );
            assert.strictEqual(result.errored, false);
            assert.strictEqual(result.results[0].warnings.length, 0);
        });
    });

    describe("invalid cases", function () {
        it("should report error for --ts-var- override", async function () {
            const result = await lintCSS(
                ".my-class { --ts-var-primary-color: red; }"
            );
            assert.strictEqual(result.errored, true);
            assert.strictEqual(result.results[0].warnings.length, 1);
            assert.ok(
                result.results[0].warnings[0].text.includes(
                    'Do not override CSS variable "--ts-var-primary-color"'
                )
            );
        });

        it("should report multiple errors for multiple --ts-var- overrides", async function () {
            const result = await lintCSS(
                ":root { --ts-var-spacing: 16px; --ts-var-font-size: 14px; }"
            );
            assert.strictEqual(result.errored, true);
            assert.strictEqual(result.results[0].warnings.length, 2);
        });
    });
});