# requires an effect that acquires a long-lived resource to return a cleanup (require-effect-cleanup)

Anything acquired on a route must be released when that route unmounts.
Navigating between liveboards unmounts every tile, so a listener, timer or
observer with no cleanup is retained for the life of the tab. Two rounds of
liveboard memory leaks were caused by this pattern.

## Rule Details

This rule does **not** require a cleanup from every effect. Most effects
correctly return nothing; only an effect that acquires something from the
list below has to release it. Do not add an empty `return () => {}` to
satisfy it.

The rule reports a `useEffect` / `useLayoutEffect` whose callback acquires a
long-lived resource without returning a cleanup that releases it. It matches
both `useEffect(...)` and `React.useEffect(...)`.

Acquisition means a call to `addEventListener`, `setInterval`, `setTimeout`,
`requestAnimationFrame`, `.subscribe()` or `.observe()`, or construction of a
`MessageChannel`, `IntersectionObserver`, `ResizeObserver` or
`MutationObserver`.

Two things decide whether a `return` counts as the cleanup:

1. **Scope.** A `return` belongs to its nearest enclosing function. One inside
   a nested callback is that callback's return value, never the effect's
   cleanup. A `return` nested in an `if` or `try` block is still the effect's.
2. **Reach.** The cleanup must sit in the same block as the acquisition, or in
   a block enclosing it. A cleanup in an enclosing block runs on at least as
   many paths as the acquisition; one in a deeper block runs on fewer, so the
   resource leaks on the paths it does not cover.

Only a returned **function** is a cleanup. A bare `return;`, and a return of
a non-function value (`return null`, `return undefined`, `return void 0`,
`return false`), are early exits — React ignores them.

An effect written with a concise arrow body (`useEffect(() => doThing(), [])`)
returns that expression's own value, so it can never supply a cleanup; one
that acquires is always reported.

Examples of **incorrect** code for this rule:

```js
// Nothing is released.
useEffect(() => {
    window.addEventListener('resize', onResize);
}, []);

// The cleanup is returned from the rAF callback, so React never receives it.
useEffect(() => {
    const id = requestAnimationFrame(() => {
        return () => cancelAnimationFrame(id);
    });
}, []);

// Acquires on every run, releases only when the branch is taken.
useEffect(() => {
    window.addEventListener('resize', onResize);
    if (enabled) {
        return () => window.removeEventListener('resize', onResize);
    }
}, []);
```

Examples of **correct** code for this rule:

```js
useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
}, []);

// Acquire and release in the same branch.
useEffect(() => {
    if (enabled) {
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }
}, []);

// Guard clause: the bare return is an early exit, the cleanup is top level.
useEffect(() => {
    if (!enabled) return;
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
}, []);
```

### Why timers are included

`setTimeout` and `requestAnimationFrame` account for most of what this rule
reports, and they are deliberately in the default set. A pending timer or
frame holds its callback, and that callback holds the whole closure scope it
was created in — the component's props, state and DOM refs. When the component
unmounts without cancelling, that scope is retained until the callback fires,
and a repeating or re-scheduled one retains it indefinitely. That is the same
retention that caused the liveboard navigation leaks, so a timer is not a
lesser case than a listener.

The secondary benefit is that the cancelled handle cannot fire against an
unmounted component, which removes a class of stale-state writes.

### Options

None. The set of acquiring calls is fixed; see the list above.

## When Not To Use It

Spec and test files are skipped: their teardown is the test runner's
business. An effect that hands teardown to a ref or an imperative API rather
than the returned function is still reported; suppress those individually with
a reason, rather than turning the rule off.
