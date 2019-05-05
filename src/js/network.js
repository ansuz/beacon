var State = require("./state");
var Util = require("./util");
var global = State.global;

var Network = module.exports;

//var mancy = require('cryptomancy');
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
var Crypto = require("./crypto");

Network.connect = function (seed, cb) {
    var src = Source.bytes.deterministic(Format.decodeUTF8(seed));
    var channel_id = Format.encodeHex(src(17)); // take 17 uint8s for an ephemeral channel id

    // derive a temporary public keypair for yourself
    // TODO store a key somewhere so you can have a persistent identity
    var personal_keys = Crypto.keys.personal();

    // derive group keys from the PRNG
    var group_keys = Crypto.keys.group.fromSource(src);
    // add your personal keys to the group keys so you can pass around one set
    var all_keys = Crypto.keys.group.addPersonal(group_keys, personal_keys);

    var List = {};
    var myID;
    var network;
    var listMembers = function () {
        console.log('Users: [%s]', Object.keys(List).join(', '));
    };

    var onJoin = function (peer) {
        State.events['net/join'].invoke({
            id: peer,
        });

        if (peer.length === 16 && !network.historyKeeper) {
            network.historyKeeper = peer;
        }

        if (peer === network.historyKeeper) { return; }
        if (List[peer]) { return; }
        List[peer] = true;
        console.log("%s joined the channel", peer);
        listMembers();
    };

    var onLeave = function (peer) {
        State.events['net/part'].invoke({
            id: peer,
        });
        delete List[peer];
        console.log("%s left the channel", peer);
        listMembers();
    };

    var onReconnect;
    var onDisconnect = function (reason) {
        // remove everyone from the userlist
        List = {};
        State.events['net/disconnect'].invoke({
            reason: reason,
        });
    };

    var setup = Util.once(function (network) {
        // add reconnect handlers
        network.on('reconnect', onReconnect);

        // add disconnect handlers
        network.on('disconnect', onDisconnect);
    });

    var onOpen = function (chan) {
        console.log("connected to [%s]", chan.id);

        // add one-time handlers
        setup(network);

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
                return handler(parsed, sender, chan);
            });
        };

        chan.members.forEach(function (peer) {
            onJoin(peer);
        });
        chan.on('join', onJoin);
        chan.on('leave', onLeave);
        chan.on("message", handle);

        console.log("history keeper has id [%s]", network.historyKeeper);

        myID = chan.myID;

        var migrate = function (seed, cb) {
            // Assume that the seed has been set to the hash.
            // this should get called by chat...
            // don't touch the hash from here


            // TODO disconnect from your current channel
            // TODO connect to the new channel
            // TODO call back when connected

            cb('NOT_IMPLEMENTED');
        };

        var api = {
            receive: function (handler) {
                handlers.push(handler);
            },
            send: function (json, cb) {
                var plaintext = JSON.stringify(json);
                var ciphertext = Crypto.group.encrypt(plaintext, all_keys);

                chan.bcast(ciphertext)
                .then(function () {
                    cb();
                }, function (err) {
                    cb(err);
                });
            },
            members: function () {
                return Object.keys(List);
            },
            whoami: function () {
                return chan.myID;
            },
            migrate: migrate,
        };

        State.events['net/connect'].invoke({
            channel: chan.id,
        });

        cb(void 0, api);
    };

    onReconnect = function () {
        network.join(channel_id)
        .then(onOpen, function (err) {
            if (err) { console.error(err); }
            State.events['net/reconnect'].invoke({
                channel: channel_id
            });
            console.log("reconnected");
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
    }).nThen(function (w) {
        console.log(channel_id);
        network.join(channel_id)
        .then(onOpen, function (err) {
            w.abort();
            cb(err);
        });
    });
};

