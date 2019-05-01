/*  This file is used as a mailbox between different modules that need to share
    resources. State is risky, so this should be kept as small as possible.

    Nothing outside of this file should maintain persistent state.
    Nothing inside this file should implement any logic.
*/
var State = module.exports;

// node defines 'global', while browsers implement 'self' or 'window'
// unify these
var global = global; // trick the linter so that it catches global being used elsewhere


// FIXME I'm pretty sure this is wrong, but I haven't needed to fix it yet
State.global = typeof(global) !== 'undefined'?
    global:
        typeof(self) !== 'undefined'? self: {};

// to inspect state...
State.global.State = State;
