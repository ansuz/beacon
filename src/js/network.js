var State = require("./state");
var Util = require("./util");
var global = State.global;

var Network = module.exports;

var nThen = require("nthen");
var netflux_websocket = require("netflux-websocket");

var websocket_url;
try {
    websocket_url = global.location.origin.replace(/http/, 'ws') + '/cryptpad_websocket';
} catch (e) {
    websocket_url = 'ws://127.0.0.1:3005/cryptpad_websocket';
}

console.log(websocket_url);

var Format = require("cryptomancy-format");
var Source = require("cryptomancy-source");
var Crypto = require("./lib/crypto");

Network.connect = function (seed, CB) {
    // make sure the callback is not called more than once
    var cb = Util.once(CB);

    var channel_id, all_keys;

    var configureFromSeed = function (seed) {
        if (typeof(seed) !== 'string') {
            console.log("initializing seed");
            seed = '';
        }
        console.log(seed);
        State.active_channel = seed;

        var src = Source.bytes.deterministic(Format.decodeUTF8(seed));
        channel_id = Format.encodeHex(src(17)); // take 17 uint8s for an ephemeral channel id

        // derive a temporary public keypair for yourself
        // TODO store a key somewhere so you can have a persistent identity
        var personal_keys = Crypto.keys.personal();

        // derive group keys from the PRNG
        var group_keys = Crypto.keys.group.fromSource(src);
        // add your personal keys to the group keys so you can pass around one set
        all_keys = Crypto.keys.group.addPersonal(group_keys, personal_keys);
    };

    configureFromSeed(seed);

    var myID;
    var network;

    var onJoin = function (peer) {
        State.events.invoke('chan/join',{
            id: peer,
        });

        if (peer.length === 16 && !network.historyKeeper) {
            network.historyKeeper = peer;
        }

        if (peer === network.historyKeeper) { return; }
        console.log("%s joined the channel", peer);
    };

    var onLeave = function (peer) {
        State.events.invoke('chan/part', {
            id: peer,
        });
        console.log("%s left the channel", peer);
    };

    var onReconnect;
    var onDisconnect = function (reason) {
        State.events.invoke('net/disconnect', {
            reason: reason,
        });
    };

    var setup = Util.once(function (network) {
        // add reconnect handlers
        network.on('reconnect', onReconnect);

        // add disconnect handlers
        network.on('disconnect', onDisconnect);
    });


    var handlers = [];
    var handle = function (ciphertext, sender) {
        var msg;
        try {
            msg = Crypto.group.decrypt(ciphertext, all_keys);
        } catch (e) {
            console.error(e);
            return;
        }
        var parsed = Util.tryParse(msg);
        if (parsed === null) { return; }
        handlers.some(function (handler) {
            return handler(parsed, sender);
        });
    };

    var api = {
        receive: function (handler) {
            // doesn't seem to work after migrating?
            handlers.push(handler);
        },
        members: function () {
            if (!network) { return; }
            if (!(network.webChannels && network.webChannels.length)) { return; }
            return network.webChannels[0].members.filter(function (id) {
                return id.length === 32;
            });
        },
    };

    var Transport;

    var onOpen = function (chan, cb) {
        console.log("connected to [%s]", chan.id);

        // add one-time handlers
        setup(network);

        chan.members.forEach(function (peer) {
            onJoin(peer);
        });
        chan.on('join', onJoin);
        chan.on('leave', onLeave);
        chan.on("message", handle);

        console.log("history keeper has id [%s]", network.historyKeeper);

        myID = chan.myID;

        api.send = function (json, cb) {
            var plaintext = JSON.stringify(json);
            var ciphertext = Crypto.group.encrypt(plaintext, all_keys);

            chan.bcast(ciphertext)
            .then(function () {
                cb();
            }, function (err) {
                cb(err);
            });
        };

        api.whoami = function () {
            return chan.myID;
        };

        api.migrate = function (seed, cb) {
            // Assume that the seed has been set to the hash.
            // this should get called by chat...
            // don't touch the hash from here

            nThen(function () {
                // disconnect from your current channel
                chan.leave();

                // set up new keys
                configureFromSeed(seed);

                // connect to the new channel
                Transport(network, cb);
            });

            cb('NOT_IMPLEMENTED');
        };

        // FIXME this shouldn't be here, or should be renamed
        State.events.invoke('net/connect', {
            channel: chan.id,
        });

        cb(void 0, api);
    };

    onReconnect = function () {
        network.join(channel_id)
        .then(function (chan) {
            onOpen(chan, function (err) {
                console.error(err);
            });
        }, function (err) {
            if (err) { console.error(err); }
            State.events.invoke('net/reconnect', {
                channel: channel_id
            });
            console.log("reconnected");
        });
    };

    Transport = function (network, cb) {
        //console.log(channel_id);
        network.join(channel_id)
        .then(function (chan) {
            onOpen(chan, cb);
        }, function (err) {
            cb(err);
        });
    };

    nThen(function (w) {
        netflux_websocket.connect(websocket_url, function (url) {
            return new global.WebSocket(url);
        })
        .then(w(function (_network) {
            network = State.network = _network;
        }), function (err) {
            w.abort();
            cb(err);
        });
    }).nThen(function () {
        Transport(network, cb);
    });
};

