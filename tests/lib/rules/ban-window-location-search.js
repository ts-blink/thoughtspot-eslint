/**
 * @fileoverview bans the usage of window location search
 * @author ban-window-location-search
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/ban-window-location-search"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run("ban-window-location-search", rule, {
  valid: [
    {
      code: "var queryHash = window.location.hash;",
    },
    {
      code: "var location = window.location;",
    },
  ],

  invalid: [
    {
      code: "var queryParams = window.location.search;",
      errors: [
        {
          message:
            "usage of window.location.search is banned. Use env-flags package to get Query Params or query string",
        },
      ],
    },
  ],
});
