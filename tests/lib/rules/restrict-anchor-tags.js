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
    {
      code: "import { Link } from '@thoughtspot/radiant-react/widgets/link';\nconst MyComponent = () => <Link href='/path'>Click here</Link>;",
      filename: "test.tsx",
    },
    {
      code: "<div>Some content</div>",
      filename: "test.tsx",
    },
    {
      code: "const element = document.createElement('a');",
      filename: "test.tsx",
    },
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
    {
      code: "<a href='/path'>Click here</a>",
      filename: "test.tsx",
      errors: [
        {
          message:
            "Use <Link> component instead of <a> tag. Import: import { Link } from '@thoughtspot/radiant-react/widgets/link'. For exceptions, In case your link is static and wouldn't be used by customers for customized Link in UI, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars).",
        },
      ],
    },
    {
      code: "const MyComponent = () => <a href='https://example.com' target='_blank'>External Link</a>;",
      filename: "component.tsx",
      errors: [
        {
          message:
            "Use <Link> component instead of <a> tag. Import: import { Link } from '@thoughtspot/radiant-react/widgets/link'. For exceptions, In case your link is static and wouldn't be used by customers for customized Link in UI, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars).",
        },
      ],
    },
    {
      code: "<div><a className='link' onClick={() => {}}>Click</a></div>",
      filename: "page.jsx",
      errors: [
        {
          message:
            "Use <Link> component instead of <a> tag. Import: import { Link } from '@thoughtspot/radiant-react/widgets/link'. For exceptions, In case your link is static and wouldn't be used by customers for customized Link in UI, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars).",
        },
      ],
    },
  ],
});

