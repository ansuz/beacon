/* globals Uint8Array */

/*
(Secure) MultiParty Computation!

Given some basic crypto primitives
and a rudimentary networking API
perform computations as a group,
verifying all computations provided by untrusted parties

Protocols have a number of assumptions
So far we're not guarding against disconnections

*/


var mpc = module.exports;
var nThen = require("nthen");
//var mancy = require("cryptomancy");
// trying to optimize compilation a bit
var mancy = {
    source: require("cryptomancy-source"),
    format: require("cryptomancy-format"),
    util: require("cryptomancy-util"),
    hash: require("tweetnacl").hash,
};

var Assert = require("assert");
var State = require("./state");
var Util = require("./util");

mpc.session_id = function () {
    return String(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
};

mpc.send = function (chan, json, cb) {
    // TODO transport level encryption
    chan.bcast(JSON.stringify(json)).then(function () {
        cb();
    }, function (err) {
        cb(err);
    });
};

var command = function (session_id, command, body) {
    return {
        command: command,
        body: body,
        session_id: session_id,
    };
};

/*
var response = function (session_id, err, body) {
    var o = {
        command: "RESPONSE",
        session_id: session_id,
    };
    if (err) { o.error = err; }
    else { o.body = body; }
    return o;
};*/

var randomBytes = function (n) {
    return mancy.source.bytes.secure()(n);
};

var encode = function (U) {
    return mancy.format.encodeURL64(U);
};

var decode = function (S) {
    return mancy.format.decodeURL64(S);
};

var compareHashes = function (A, B) {
    if (!A || !B) { return false; }
    if (typeof(A) !== typeof(B)) { return false; }
    if (!(A instanceof Uint8Array)) { return false; }
    if (A.length !== B.length) { return false; }

    try {
        return !mancy.util.some(A, function (a, i) {
            return B[i] !== a;
        });
    } catch (e) {
        console.error(e);
        return false;
    }
};

var BYTES = function (env) {
    var map = env.map;
    var api = env.api;

    var computeOutcome = function (session_id) {
        if (!(map[session_id] && typeof(map[session_id]) === 'object')) {
            return null;
        }

        var bytes = map[session_id].bytes;
        var outcome = Object.keys(bytes).map(function (member) {
            return bytes[member];
        }).reduce(function (A, B) {
            var C = new Uint8Array(A.length);
            A.forEach(function (a, i) {
                C[i] = mancy.util.xor(a, B[i]);
            });
            return C;
        });

        // TODO guard against more errors

        return outcome;
    };

    // TODO clean up the session after a timeout, or in the result of an error
    env.calls.BYTES = function (msg, sender) {
        //console.log("INCOMING BYTES REQUEST");

        var me = api.whoami();

        // how you respond to a BYTES rpc depends on the stage
        /*
         * stage 0 (caller publishes their own commit and asks you to match
         * stage 1 (everyone responds with commits || ABORT)
         * stage 2 (caller broadcasts revealed value)
         * stage 3 (everyone responds with reveals || ABORT)
         * stage 4 (caller publishes outcome)
         * stage 5 (everyone audits)
         */

        var session_id = msg.session_id;
        var body = msg.body;

        var stage = body.stage;
        Assert.equal(typeof(stage), 'number');

        // Stage 0
        var participants = body.participants;
        if (stage === 0) {
            //console.log("Stage 0 received successfully");
            // ignore this message if you aren't in the list of participants
            Assert(Array.isArray(participants));

            if (participants.indexOf(api.whoami()) === -1) { return console.error("not meant for me"); } // not meant for me

            Assert.equal(typeof(body.size), 'number');

            // else create a session for it
            map[session_id] = {
                size: body.size,
                locks: {},
                expr: body.expr,
            };
            (function (session) {
                session.initiator = sender;

                // decode and store the caller's commit
                var commits = session.commits = {};
                try {
                    commits[sender] = decode(msg.commit);
                } catch (e) {
                    /* TODO send an error
        var res = response(session_id, void 0, encode(randomBytes(body.size || SIZE)));
        api.send(res, function (err) {
            if (err) { console.error(err); }
        });*/
                }

                var me = api.whoami();
                var bytes = session.bytes = {};
                // generate your own random bytes
                var my_bytes = bytes[me] = randomBytes(session.size);

                // hash, store, and broadcast your commit
                var my_commit = commits[me] = mancy.hash(my_bytes);

                // JANKY API
                var res = command(session_id, "BYTES", {
                    commit: encode(my_commit),
                    stage: 1,
                });
                api.send(res, function (err) {
                    //console.log("responding to stage 0");
                    if (err) { console.error(err); }
                });
            }(map[session_id]));
        } else if (!map[session_id]) {
            // if there's no session, drop this on the floor
            return console.log("NO SESSION");
        }

        // stage 1
        if (stage === 1) {
            (function (session) {
                // we expect 'initiator' to be known
                Assert(Boolean(session.initiator));
                Assert.equal(typeof(session.size), 'number');
                // this is where we expect to observe everyone else's commits
                // store them, proceed
                try {
                    session.commits[sender] = decode(body.commit);
                    if (session.locks && typeof(session.locks[sender]) === 'function') {
                        session.locks[sender](sender);
                    }
                } catch (e) {
                    console.error(e);
                    console.log(msg);
                    /* TODO send an error
        var res = response(session_id, void 0, encode(randomBytes(session.size)));
        api.send(res, function (err) {
            if (err) { console.error(err); }
        });*/
                }
            }(map[session_id]));

            return;
        }

        if (stage === 2) {
            return void (function (session) {
                //console.log("Stage 2 received");
                // caller broadcasts their own revealed value
                // store it, respond with your own revealed value

                Assert.equal(typeof(body.reveal), 'string');

                try {
                    session.bytes[sender] = decode(body.reveal);
                } catch (e) {
                    console.error(e);
                }
                api.send(command(session_id, 'BYTES', {
                    stage: 3,
                    reveal: encode(session.bytes[me]),
                }), function (err) {
                    //if (err) { return void (w.abort() || cb(err)); }
                    if (err) { console.error(err); }
                });
            }(map[session_id]));
        }

        if (stage === 3) {
            return void (function (session) {
                //console.log("Stage 3 received");
                // observe everyone else's revealed values
                // store them, compute outcome

                Assert.equal(typeof(body.reveal), 'string');

                try {
                    session.bytes[sender] = decode(body.reveal);
                } catch (e) {
                    console.error(e);
                }
                Assert.equal(session.bytes[sender].length, session.size);

                if (session.initiator === me && session.locks) {
                    session.locks[sender](sender);
                }
            }(map[session_id]));
        }

        if (stage === 4) {
            return void (function (session) {
                //console.log("Stage 4 received");
                var outcome = computeOutcome(session_id);

                var caller_outcome = decode(body.outcome);


                if (!compareHashes(caller_outcome, outcome)) {
                    console.error("YOU CAUGHT A CHEATER");
                    return void env.events['mpc/bytes'].invoke({
                        error: "CHEATER",
                        initiator: sender,
                        nick: env.nicks[sender] || sender, //initiator,
                        expr: session.expr,
                    });
                }

                env.events['mpc/bytes'].invoke({
                    outcome: outcome,
                    initiator: sender,
                    expr: session.expr,
                    nick: env.nicks[sender] || sender, //initiator,
                });
            }(map[session_id]));
        }

        if (stage === 5) {
            return void (function (/* session */) {
                //console.log("Stage 5 received");
                // set a timeout in which we'll wait for people to complain
                // if nothing, clean up

                // FIXME we're just assuming it worked!
                // listen for error reports from peers
                // find a way to report them
                setTimeout(function () {
                    delete map[session_id];
                });
            }(map[session_id]));
        }
    };

    return function (size, expr, cb) {
        // this function is broken and it's not updating correctly
        // idk why
        //var cb = mancy.util.once(CB);

        //console.log("initiating BYTES mpc");
        var session_id = mpc.session_id();
        var members = api.members();
        var me = api.whoami();

        if (members.length === 1) {
            return void setTimeout(function () {

                var b = mancy.source.bytes.secure()(size);

                env.events['mpc/bytes'].invoke({
                    outcome: b,
                    initiator: me,
                    expr: expr,
                    nick: env.nicks[me] || me,
                });

                cb(void 0, b);
            });
        }

        var session = map[session_id] = {
            commits: {},
            bytes: {},
            initiator: me,
            size: size,
            expr: expr,
        };

        nThen(function (w) {
            var my_bytes = session.bytes[me] = randomBytes(size);
            var commit = session.commits[me] = mancy.hash(my_bytes);

            console.log("Performing a %s-party computation", members.length);

            api.send(command(session_id, 'BYTES', {
                participants: members,
                size: size, // make size a variable
                stage: 0, // first call is stage 0
                commit: encode(commit),
                expr: expr,
            }), w(function (err) {
                if (err) { return void (w.abort() || cb(err)); }
                //console.log("stage 0 sent successfully");
            }));

            // Abort with an error if the computation
            // takes more than 10 seconds
            session.timeout = setTimeout(function () {
                w.abort();
                cb("TIMEOUT");
            }, 10000);
        }).nThen(function (w) {
            /* Stage 1

                Wait until everybody has committed

                * peers broadcast hashes of their own random numbers.
                * everybody memorizes all the commits
                * broadcast abort if there are any errors
            */

            session.locks = {};

            members.forEach(function (member) {
                if (member === me) { return; }
                session.locks[member] = w(function (/*peer*/) {
                    delete session.locks[member];
                });
            });
        }).nThen(function (w) {
            /* Stage 2

                * everybody has committed
                * broadcast the result
                * other peers complain if they produce different results
            */

            api.send(command(session_id, 'BYTES', {
                stage: 2,
                reveal: encode(session.bytes[me]),
            }), w(function (err) {
                // FIXME broadcast abort if there are errors
                if (err) { return void (w.abort() || cb(err)); }
            }));
        }).nThen(function (w) {
            // Stage 3

            members.forEach(function (member) {
                if (member === me) { return; }
                session.locks[member] = w(function (/* peer */) {
                    delete session.locks[member];
                });
            });
        }).nThen(function (w) {
            // Stage 4
            members.forEach(function (member) {
                var commit = session.commits[member];
                var bytes = session.bytes[member];

                if (compareHashes(mancy.hash(bytes), commit)) {
                    // they were honest
                } else {
                    // you caught a cheater
                    // TODO warn everyone of failure
                    console.error("YOU CAUGHT A CHEATER: %s", member);
                }
            });

            var outcome = session.outcome = computeOutcome(session_id);

            api.send(command(session_id, 'BYTES', {
                stage: 4,
                outcome: encode(outcome),
            }), w(function (err) {
                if (err) { return void (w.abort() || cb(err)); }
            }));
        }).nThen(function (/*w*/) {
            // FIXME in the event of an error anywhere in the protocol,
            // broadcast why the process failed
            var result = session.outcome;
            clearTimeout(session.timeout);

            env.events['mpc/bytes'].invoke({
                outcome: computeOutcome(session_id),
                initiator: me,
                expr: session.expr,
                nick: env.nicks[me] || me,
            });

            // cleanup handlers for this session
            // TODO make this cleanup an API?
            delete map[session_id];

            cb(void 0, result);
        });
    };
};

/*
    calls.RESPONSE = function (msg, sender) {
        if (!msg.session_id) { return console.log("NO_TXID"); }
        if (typeof(map[msg.session_id]) !== 'function') { return console.log("NO_SESSION"); }
        try {
            map[msg.session_id](msg, sender);
        } catch (e) {
            console.error(e);
        }
    };*/

var ERROR = function (env) {
    var map = env.map;

    env.calls.ERROR = function (msg /*, sender */) {
        if (map[msg.session_id]) {
            // TODO somehow report an error for this session?
            // idk
        }
    };
};

var MESSAGE = function (env) {
    var messaging = State.messaging;
    var history = messaging.history;
    var api = env.api;

    env.calls.MESSAGE = function (_msg, sender) {
        var msg = Util.clone(_msg);
        history.push(msg);
        env.events['mpc/message'].invoke({
            raw: msg,
            author: env.nicks[sender] || msg.body.author,
            text: msg.body.text,
        });
    };

    return function (text, cb) {
        var session_id = mpc.session_id();

        var cmd = command(session_id, 'MESSAGE', {
            text: text,
            author: env.nick || api.whoami(),
        });
        nThen(function (w) {
            api.send(cmd, w(function (err) {
                if (err) {
                    w.abort();
                    return void cb(err);
                }
            }));
        }).nThen(function () {
            // TODO read receipt?
            cb();
        });
    };
};

var NICK = function (env) {
    var api = env.api;

    env.calls.NICK = function (msg, sender) {
        // This means someone else changed their nick

        var prev = env.nicks[sender] || sender;

        var nick = env.nicks[sender] = msg.body.nick;
        State.events['mpc/nick'].invoke({
            nick: nick,
            author: sender,
            prev: prev,
        });
    };

    return function (nick, cb) {
        // change your nick
        //env.nick = nick;

        var session_id = mpc.session_id();
        var cmd = command(session_id, 'NICK', {
            nick: nick,
        });

        nThen(function (w) {
            api.send(cmd, w(function (err) {
                if (err) {
                    w.abort();
                    return void cb(err);
                }
            }));
        }).nThen(function () {
            env.nicks[api.whoami()] = nick;
            cb();
        });
    };
};

mpc.prepare = function (api, cb) {
    var map = {};
    var calls = {};

    var messaging = State.messaging = State.messaging || {};
    messaging.history = messaging.history || [];
    messaging.ready = false;

    var env = {
        map: map,
        api: api,
        calls: calls,
        //nick: api.whoami(), // TODO add nick command

        nicks: {},

        events: State.events,
    };

    ERROR(env);

    api.receive(function (msg, sender /*, chan */) {
        var cmd = msg.command;

        if (typeof(calls[cmd]) === 'function') {
            return void calls[cmd](msg, sender);
        } else {
            console.error("UNHANDLED_COMMAND", msg);
            // FIXME answer with an error if you don't support an API
        }
    });

    var commands = {
        bytes: BYTES(env),
        whoami: api.whoami,
        message: MESSAGE(env),
        nick: NICK(env),
        name: function () {
            var id = api.whoami();
            return env.nicks[id] || id;
        },

        //nicks: function () { return env.nicks; },

        // TODO coin flips (bytes variant)
        // TODO dice rolls (bytes variant)
        // TODO turn ordering 
        // TODO secure shuffling
        // TODO anonymous veto
    };
    cb(void 0, commands);
};

