/**
 * @fileoverview bans the usage of window location search
 * @author Utsav Kapoor
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: "bans the usage of window location search",
      recommended: false,
    },
    fixable: null, // or "code" or "whitespace"
    schema: [],
  },

  create: function (context) {
    return {
      MemberExpression: function (node) {
        if (
          node.object.type === "MemberExpression" &&
          node.property.name === "search" &&
          isNestedObject(node) &&
          node.object.object.name === "window" &&
          node.object.property.type === "Identifier" &&
          node.object.property.name === "location"
        ) {
          context.report(
            node,
            "usage of window.location.search is banned. Use env-flags package to get Query Params or query string"
          );
        }
      },
    };

    // Checks if the object is of type foo.bar.baz
    function isNestedObject(node) {
      return !!(node && node.object && node.object.object);
    }
  },
};
