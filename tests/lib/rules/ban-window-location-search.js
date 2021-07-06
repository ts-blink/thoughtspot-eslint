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

        // give me some code that won't trigger a warning
    ],

    invalid: [
        {
            code: "const queryParams = window.location.search",
            errors: [{
                message: "Fill me in.",
                type: "Me too"
            }]
        }
    ]
});
