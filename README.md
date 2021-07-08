# eslint-plugin-thoughtspot-eslint

custom plugins for thoughtspot

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-thoughtspot-eslint`:

```
$ npm install eslint-plugin-thoughtspot-eslint --save-dev
```

## Usage

Add `thoughtspot-eslint` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["thoughtspot-eslint"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "thoughtspot-eslint/rule-name": 2
  }
}
```

## Supported Rules

- ban-window-location-search: bans the use of window.location.search in codebase

## Running tests

Run mocha tests with `npm test`
