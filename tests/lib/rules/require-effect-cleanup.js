/**
 * @fileoverview Tests for require-effect-cleanup rule
 * @author ThoughtSpot Liveboard Team
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/require-effect-cleanup"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var NO_CLEANUP = /but returns no cleanup/;
var NO_CLEANUP_ON_PATH = /on a path that returns no cleanup/;

var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run("require-effect-cleanup", rule, {
  valid: [
    // Acquisition and release at the top level of the effect.
    {
      code:
        "useEffect(() => { window.addEventListener('r', onR); return () => window.removeEventListener('r', onR); }, []);",
    },
    // Both inside the same branch: the release runs whenever the acquire did.
    {
      code:
        "useEffect(() => { if (on) { window.addEventListener('r', onR); return () => window.removeEventListener('r', onR); } }, []);",
    },
    // Guard clause: the bare return is an early exit, the cleanup is top level.
    {
      code:
        "useEffect(() => { if (!on) return; window.addEventListener('r', onR); return () => window.removeEventListener('r', onR); }, []);",
    },
    // Release in an enclosing block runs on at least as many paths as the acquire.
    {
      code:
        "useEffect(() => { if (on) { window.addEventListener('r', onR); } return () => window.removeEventListener('r', onR); }, []);",
    },
    // Member form of the hook.
    {
      code:
        "React.useEffect(() => { const t = setInterval(tick, 1); return () => clearInterval(t); }, []);",
    },
    // useLayoutEffect is covered by the same contract.
    {
      code:
        "useLayoutEffect(() => { const o = new ResizeObserver(cb); o.observe(el); return () => o.disconnect(); }, []);",
    },
    // Returning a function reference counts as cleanup.
    {
      code:
        "useEffect(() => { const s = src.subscribe(cb); return s.unsubscribe.bind(s); }, []);",
    },
    // Nothing long-lived is acquired.
    {
      code: "useEffect(() => { setState(compute()); }, []);",
    },
    // Concise body that acquires nothing.
    {
      code: "useEffect(() => setState(compute()), []);",
    },
    // Test files manage their own teardown.
    {
      code: "useEffect(() => { window.addEventListener('r', onR); }, []);",
      filename: "widget.spec.tsx",
    },
  ],

  invalid: [
    // Nothing is returned at all.
    {
      code: "useEffect(() => { window.addEventListener('r', onR); }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    // A nested function returns a value, but the effect itself does not.
    {
      code:
        "useEffect(() => { const h = (e) => { return e.detail; }; window.addEventListener('r', h); }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    // The cleanup is returned from the rAF callback, so React never receives it.
    {
      code:
        "useEffect(() => { const id = requestAnimationFrame(() => { return () => cancelAnimationFrame(id); }); }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    // Acquires on every run, releases only when the branch is taken.
    {
      code:
        "useEffect(() => { window.addEventListener('r', onR); if (on) { return () => window.removeEventListener('r', onR); } }, []);",
      errors: [{ message: NO_CLEANUP_ON_PATH }],
    },
    // Acquire and release sit in different branches.
    {
      code:
        "useEffect(() => { if (x) { window.addEventListener('r', onR); } if (y) { return () => window.removeEventListener('r', onR); } }, []);",
      errors: [{ message: NO_CLEANUP_ON_PATH }],
    },
    // A bare return is an early exit, not a cleanup.
    {
      code: "useEffect(() => { window.addEventListener('r', onR); return; }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    // React ignores a non-function return, so these are early exits too.
    {
      code:
        "useEffect(() => { if (!on) return undefined; window.addEventListener('r', onR); }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    {
      code: "useEffect(() => { window.addEventListener('r', onR); return null; }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    {
      code: "useEffect(() => { window.addEventListener('r', onR); return false; }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    {
      code: "useEffect(() => { window.addEventListener('r', onR); return void 0; }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    // A concise arrow body returns the expression's value, never a cleanup.
    {
      code: "useEffect(() => window.addEventListener('r', onR), []);",
      errors: [{ message: NO_CLEANUP }],
    },
    // The classic callback form is checked like an arrow.
    {
      code: "useEffect(function () { const t = setInterval(tick, 1); }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
    // Member form is checked too.
    {
      code: "React.useEffect(() => { const t = setTimeout(fn, 1); }, []);",
      errors: [{ message: NO_CLEANUP }],
    },
  ],
});
