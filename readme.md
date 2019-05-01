# Beacon

This is a **work in progress**, implementing client-side code which is intended to be used in conjunction with [Gestalt](https://github.com/ansuz/gestalt) as the server.

## Features

* [x] a wacky home-cooked framework for a single page app
* [x] cheat-proof randomness, using a [coin-flipping commitment scheme](https://en.wikipedia.org/wiki/Commitment_scheme#Coin_flipping)
* [x] a basic chat interface
  * [ ] with encryption

## How to use it

Install dependencies with `npm i`.

I made a build script but it seems it's not working anymore. Use `npm run debug` instead to build once, then watch the source tree for changes and compile using browserify whenever a modification is made.

**Warning**: this is super janky, and I've only tested it on my own system. You might need to `npm i -g browserify less jshint lesshint` to get undeclared dependencies required to build.

Sorry.

If you manage to get it to build, then you need to serve it. Go hack the `config.js` in _gestalt_ to serve the `./www/` directory in this repo.

GOOD LUCK.
