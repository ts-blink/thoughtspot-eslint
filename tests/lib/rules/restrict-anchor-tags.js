/**
 * @fileoverview Tests for restrict-anchor-tags rule
 * @author ThoughtSpot TSE Team
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/restrict-anchor-tags"),
    RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
});

ruleTester.run("restrict-anchor-tags", rule, {
    valid: [
        // Using Link component (preferred)
        {
            code: "import { Link } from '@thoughtspot/radiant-react/widgets/link';\nconst MyComponent = () => <Link href='/path'>Click here</Link>;",
            filename: "test.tsx",
        },

        // Non-anchor elements
        {
            code: "<div>Some content</div>",
            filename: "test.tsx",
        },

        // Creating anchor via DOM API (not JSX)
        {
            code: "const element = document.createElement('a');",
            filename: "test.tsx",
        },

        // Test files are allowed to use anchor tags
        {
            code: "<a href='/path'>Click here</a>",
            filename: "test.spec.tsx",
        },
        {
            code: "<a href='/path'>Click here</a>",
            filename: "component.test.jsx",
        },
    ],

    invalid: [
        // Basic anchor tag without disable comment
        {
            code: "<a href='/path'>Click here</a>",
            filename: "test.tsx",
            errors: [
                {
                    message:
                        "Use <Link> component instead of <a> tag. For exceptions for non react components, In case your link is static and wouldn't be used by main app in UI, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]. Please request TSE team review.",
                },
            ],
        },

        // Anchor tag in component
        {
            code: "const MyComponent = () => <a href='https://example.com' target='_blank'>External Link</a>;",
            filename: "component.tsx",
            errors: [
                {
                    message:
                        "Use <Link> component instead of <a> tag. For exceptions for non react components, In case your link is static and wouldn't be used by main app in UI, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]. Please request TSE team review.",
                },
            ],
        },

        // Anchor tag with onClick
        {
            code: "<div><a className='link' onClick={() => {}}>Click</a></div>",
            filename: "page.jsx",
            errors: [
                {
                    message:
                        "Use <Link> component instead of <a> tag. For exceptions for non react components, In case your link is static and wouldn't be used by main app in UI, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]. Please request TSE team review.",
                },
            ],
        },

        // Disable comment without description separator (--)
        {
            code: "// eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags\n<a href='/path'>Click here</a>",
            filename: "test.tsx",
            noInlineConfig: true,
            errors: [
                {
                    message: "'//eslint-disable-next-line' has no effect because you have 'noInlineConfig' setting in your config.",
                },
                {
                    message:
                        "Anchor tag disable comment must include a description after '--'. Required format: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]",
                },
            ],
        },

        // Disable comment with description but too short
        {
            code: "// eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- Short desc\n<a href='/path'>Click here</a>",
            filename: "test.tsx",
            noInlineConfig: true,
            errors: [
                {
                    message: "'//eslint-disable-next-line' has no effect because you have 'noInlineConfig' setting in your config.",
                },
                {
                    message:
                        "Anchor tag disable comment description is too short (10 chars, minimum 20 required). Required format: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]",
                },
            ],
        },

        // Disable comment with proper length but missing TSE review
        {
            code: "// eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-12345] This is a static error page link that needs anchor tag\n<a href='/path'>Click here</a>",
            filename: "test.tsx",
            noInlineConfig: true,
            errors: [
                {
                    message: "'//eslint-disable-next-line' has no effect because you have 'noInlineConfig' setting in your config.",
                },
                {
                    message:
                        "Anchor tag disable comment must include '[TSE-Reviewed]' to confirm TSE team review. Required format: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]",
                },
            ],
        },
    ],
});