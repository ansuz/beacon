//var ui = require("../ui");
var State = require("../state");
var global = State.global;
var h = require("hyperscript");
var ui = require("../ui");
var Util = require("../util");
var Game = require("../game");

var data = function (e, k, v) {
    if (!e || typeof(e.getAttribute) !== 'function') { return; }
    if (typeof(v) === 'undefined') {
        return e.getAttribute('data-' + k);
    } else {
        e.setAttribute(k, v);
        return v;
    }
};

var cleanAuthorship = function (main) {
    Util.slice(main.querySelectorAll('div.message')).reduce(function (a, b) {
        if (data(a, 'author') === data(b, 'author')) {
            b.querySelector('.author').style.display = 'none';
            return a;
        }
        return b;
    }, []);
};


module.exports = function (req, res, next) {
    if (State.chat_ready) { return void next(); }
    State.chat_ready = true;

    //res.setTitle('Cryptomancy');

    // TODO separate UI commands into a different module
    var messages = h('div.messages'),
        message_container = h('div.message-container', messages),
        input = ui.text('your message'),
        button = ui.button('send'),
        input_container = h('div.input-container', [
            input,
            button,
        ]);

    res.log.appendChild(h('div.messaging', [
        // TODO implement a userlist
        // TODO implement a room selection UI
        message_container,
        h('br'),
        input_container
    ]));

    var scrollDown = function () {
        messages.scrollTop = messages.scrollHeight;
    };

    // TODO implement action and meta messages
    // for join/part, name change, etc.
    var append = function (text, time, author) {
        messages.append(ui.message(text, time, author));
        cleanAuthorship(res.main);
        scrollDown();
    };

    var roll = function (text, time, author) {
        var msg = ui.message(text, time, author);
        msg.classList.add('action');
        console.log(msg);

        messages.append(msg);
        cleanAuthorship(res.main);
        scrollDown();
    };

    var display_nick = function (text, time, author) {
        var msg = ui.message(text, time, author);
        msg.classList.add('action');

        console.log(msg);

        messages.append(msg);
        cleanAuthorship(res.main);
        scrollDown();
    };

    //var messenger = State.messenger;
    var setEditable = function (bool) {
        if (Boolean(bool)) {
            input.removeAttribute('disabled');
        } else {
            input.setAttribute("disabled", true);
        }
    };

    setEditable(State.messaging && State.messaging.ready);

    // TODO support rendering other channels
    /*
    messenger.channels[''].history.forEach(function (parsed) {
        append(parsed.payload[1], parsed.time, parsed.id);
    });*/

    var disconnectAlert;

    State
    .on('net/disconnect', function () {
        // only ever show one alert at a time...
        if (disconnectAlert) { disconnectAlert.click(); }
        disconnectAlert = ui.alert("Disconnected!", function () {});
        setEditable(false);
    })
    .on('net/connect', function () {

    })
    .on('mpc/ready', function () {
        if (disconnectAlert) { disconnectAlert.click(); }
        setEditable(true);
        if (input.focus) { input.focus(); }
    })
    .on('mpc/message', function (msg) {
        console.log(msg);
        append(msg.text, new Date(), msg.author);
    })
    .on('mpc/nick', function (msg) {
        display_nick(msg.prev + " is now known as " + msg.nick, new Date(), msg.author);
    })
    .on('mpc/bytes', function (result) {
        if (result.error) {
            return console.error(result.error);
        }

        console.log(result);

        var parsed = Game.parse(result.expr);
        console.log(parsed);

        if (!parsed.length) { 
            return void console.error("INVALID_EXPR");
        }

        var output = Game.run_parsed(result.outcome, parsed);

        // TODO handle mpc/bytes
        console.log(result);
        // TODO display this with special formatting
        console.log(output);
        roll(output, new Date(), result.nick); //initiator);
    });

    var myName = function () {
        return global.commands.name();
    };

/*
    State.Page
    //.on('rpc/reconnect', function () { console.log("RECONNECTED!"); })
    .on('rpc/disconnect', function () { })
    .on('rpc/message', function (msg) {
        console.log('received a user message:', msg);
        append(msg.payload[1], msg.time, msg.id);
    }).on('rpc/part', function (msg) {
        console.log('received a part message:', msg);
        append('User ' + msg.id + ' left', +new Date(), msg.id);
    }).on('rpc/join', function (msg) {
        console.log('received a join message:', msg);
        append('User ' + msg.id + ' joined', +new Date(), msg.id);
    });*/

    var roll_die = function (val) {
        var parsed = Game.parse(val);
        if (!parsed.length) {
            return console.error("INVALID_EXPR");
        }

        var me = myName();
        global.commands.bytes(32, val, function (err /*, res */) {
            if (err) {
                append('' + err, new Date(), me);
                return;
            }

            //var outcome = Game.run_parsed(res, parsed);
            //roll(outcome, new Date(), me);
        });
    };

    var clear = function () {
        messages.innerHTML = '';
    };

    var setNick = function (val) {
        var nick = val.replace(/^\/nick/, '').trim();
        if (!nick) { return; }

        global.commands.nick(nick, function (err) {
            if (err) { return void console.error(err); }
            display_nick('You are now known as ' + nick, new Date(), myName());
        });
    };

    var handleInput = function (val) {
        if (/^\/roll/.test(val)) {
            return void roll_die(val.replace(/^\/roll/, ''));
        }

        if (/^\/clear/.test(val)) {
            return void clear();
        }

        if (/^\/nick/.test(val)) {
            return void setNick(val);
        }

        // TODO add it to the interface but don't mark it as received

        // TODO support sending messages to other channels
        global.commands.message(val, function (err) {
            if (err) {
                return void console.error(err);
            }
            // TODO mark the message as received
            append(val, new Date(), myName());
        });

        // TODO add message encryption for different channels

        // FIXME message attribution is dropped when navigating to 'messaging' without a full reload
        //append(msg.payload[1], msg.time, 'me');

    };

    button.addEventListener('click', function () {
        if (!(State.messaging && State.messaging.ready)) { return; }

        var val = input.value;
        if (!val.trim()) { return; }
        input.value = '';
        handleInput(val);
    });

    input.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') { button.click(); }
    });

    next();
};
