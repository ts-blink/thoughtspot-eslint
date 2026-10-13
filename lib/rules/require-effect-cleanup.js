/**
 * @fileoverview Requires a useEffect that acquires a long-lived resource to return a cleanup
 * @author ThoughtSpot Liveboard Team
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

// Calls that take out a subscription lasting beyond the current tick.
var ACQUIRING_CALLS = [
  "addEventListener",
  "setInterval",
  "setTimeout",
  "requestAnimationFrame",
  "subscribe",
  "observe",
];

// Constructors whose instances must be released explicitly.
var ACQUIRING_CONSTRUCTORS = [
  "MessageChannel",
  "IntersectionObserver",
  "ResizeObserver",
  "MutationObserver",
];

var EFFECT_HOOKS = ["useEffect", "useLayoutEffect"];

/**
 * React only treats a returned *function* as the cleanup. `return undefined`,
 * `return null` and `return 0` are ignored by React, so they are early exits
 * in disguise and must not satisfy the rule.
 */
function isPossiblyFunction(node) {
  if (!node) {
    return false;
  }
  if (node.type === "Literal" || node.type === "TemplateLiteral") {
    return false;
  }
  if (node.type === "Identifier" && node.name === "undefined") {
    return false;
  }
  if (node.type === "UnaryExpression" && node.operator === "void") {
    return false;
  }
  return true;
}

function isFunctionNode(node) {
  return (
    !!node &&
    (node.type === "ArrowFunctionExpression" ||
      node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration")
  );
}

/**
 * The chain of enclosing BlockStatements from the effect body down to node.
 * Returns null when a nested function sits in between: a return in another
 * function is that function's return value, never this effect's cleanup.
 */
function blockChain(node, effectBody) {
  var chain = [];
  for (var current = node; current; current = current.parent) {
    if (current === effectBody) {
      chain.unshift(current);
      return chain;
    }
    if (isFunctionNode(current)) {
      return null;
    }
    if (current.type === "BlockStatement") {
      chain.unshift(current);
    }
  }
  return null;
}

// True when `outer` is the same block as `inner`, or encloses it.
function enclosesOrEquals(outer, inner) {
  return (
    outer.length <= inner.length &&
    outer.every(function (block, index) {
      return block === inner[index];
    })
  );
}

module.exports = {
  meta: {
    docs: {
      description:
        "requires a useEffect that acquires a listener, timer, animation frame, subscription or observer to return a cleanup that releases it",
      recommended: true,
    },
    fixable: null,
    schema: [],
  },

  create: function (context) {
    var filename = context.getFilename();

    // Teardown inside a test is the test runner's business, not ours.
    if (filename.match(/\.(spec|test)\.(tsx?|jsx?)$/)) {
      return {};
    }

    function acquirerName(node) {
      if (node.type === "NewExpression") {
        return node.callee && ACQUIRING_CONSTRUCTORS.indexOf(node.callee.name) !== -1
          ? "new " + node.callee.name
          : null;
      }
      var callee = node.callee;
      var name =
        callee.type === "MemberExpression"
          ? callee.property && callee.property.name
          : callee.name;
      return name && ACQUIRING_CALLS.indexOf(name) !== -1 ? name : null;
    }

    /** Walk a subtree without descending into nested functions. */
    function walkOwnScope(node, visit) {
      if (!node || typeof node.type !== "string") {
        return;
      }
      visit(node);
      Object.keys(node).forEach(function (key) {
        if (key === "parent") {
          return;
        }
        var value = node[key];
        var children = Array.isArray(value) ? value : [value];
        children.forEach(function (child) {
          if (!child || typeof child.type !== "string" || isFunctionNode(child)) {
            return;
          }
          walkOwnScope(child, visit);
        });
      });
    }

    function checkEffect(node) {
      var callback = node.arguments && node.arguments[0];
      if (!isFunctionNode(callback)) {
        return;
      }
      var body = callback.body;
      if (!body) {
        return;
      }
      if (body.type !== "BlockStatement") {
        // Concise arrow body: the implicit return is the expression's own
        // value, so an acquisition here can never be paired with a cleanup.
        var conciseAcquisition = null;
        walkOwnScope(body, function (current) {
          if (
            !conciseAcquisition &&
            (current.type === "CallExpression" || current.type === "NewExpression")
          ) {
            var conciseName = acquirerName(current);
            if (conciseName) {
              conciseAcquisition = conciseName;
            }
          }
        });
        if (conciseAcquisition) {
          context.report(
            node.callee,
            "This effect acquires '" +
              conciseAcquisition +
              "' but returns no cleanup. Return a cleanup that releases it, and capture the handle rather than discarding it."
          );
        }
        return;
      }

      var acquisitions = [];
      var cleanupReturns = [];

      walkOwnScope(body, function (current) {
        if (current.type === "CallExpression" || current.type === "NewExpression") {
          var name = acquirerName(current);
          if (name) {
            acquisitions.push({ node: current, name: name });
          }
        }
        // A bare `return;`, or one returning a non-function, is an early exit.
        if (
          current.type === "ReturnStatement" &&
          isPossiblyFunction(current.argument)
        ) {
          cleanupReturns.push(current);
        }
      });

      if (!acquisitions.length) {
        return;
      }

      var returnChains = cleanupReturns
        .map(function (returnNode) {
          return blockChain(returnNode, body);
        })
        .filter(Boolean);

      for (var i = 0; i < acquisitions.length; i += 1) {
        var acquisitionChain = blockChain(acquisitions[i].node, body);
        if (!acquisitionChain) {
          continue;
        }
        // A cleanup in an enclosing block runs on at least as many paths as the
        // acquisition. One in a deeper block runs on fewer, so it is asymmetric.
        var isReleased = returnChains.some(function (returnChain) {
          return enclosesOrEquals(returnChain, acquisitionChain);
        });
        if (isReleased) {
          continue;
        }
        context.report(
          node.callee,
          returnChains.length
            ? "This effect acquires '" +
                acquisitions[i].name +
                "' on a path that returns no cleanup. Release it in the same branch that acquires it."
            : "This effect acquires '" +
                acquisitions[i].name +
                "' but returns no cleanup. Return a cleanup that releases it, and capture the handle rather than discarding it."
        );
        return;
      }
    }

    return {
      CallExpression: function (node) {
        var callee = node.callee;
        var name =
          callee.type === "MemberExpression"
            ? callee.property && callee.property.name
            : callee.name;
        if (name && EFFECT_HOOKS.indexOf(name) !== -1) {
          checkEffect(node);
        }
      },
    };
  },
};
