/**
 * @fileoverview Restricts usage of <a> tags in favor of <Link> component
 * @author ThoughtSpot TSE Team
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: "Restricts usage of <a> tags in favor of <Link> component for consistent link handling",
      recommended: true,
    },
    fixable: null,
    schema: [],
  },

  create: function (context) {
    const filename = context.getFilename();

    // Skip test files
    if (filename.match(/\.(spec|test)\.(tsx?|jsx?)$/)) {
      return {};
    }

    return {
      JSXOpeningElement: function (node) {
        if (node.name && node.name.name === 'a') {
          context.report(
            node,
            "Use <Link> component instead of <a> tag. Import: import { Link } from '@thoughtspot/radiant-react/widgets/link'. For exceptions, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars)"
          );
        }
      },
    };
  },
};

