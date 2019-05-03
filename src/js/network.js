var State = require("./state");
var Util = require("./util");
var global = State.global;

var Network = module.exports;

//var mancy = require('cryptomancy');
var nThen = require("nthen");
var netflux_websocket = require("netflux-websocket");

// an ephemeral channel id
Network.default_channel = '004718d53646c30b58ac57d659d712a902';
var websocket_url;
try {
    websocket_url = global.location.origin.replace(/http/, 'ws') + '/cryptpad_websocket';
} catch (e) {
    websocket_url = 'ws://127.0.0.1:3005/cryptpad_websocket';
}

console.log(websocket_url);

Network.connect = function (cb) {
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
        console.log("connected to [%s]", Network.default_channel);

        // add one-time handlers
        setup(network);

        var handlers = [];
        var handle = function (msg, sender) {
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

        var api = {
            receive: function (handler) {
                handlers.push(handler);
            },
            send: function (json, cb) {
                chan.bcast(JSON.stringify(json))
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
        };

        State.events['net/connect'].invoke({
            channel: chan.id,
        });

        cb(void 0, api);
    };

    onReconnect = function () {
        network.join(Network.default_channel).then(onOpen, function (err) {
            if (err) { console.error(err); }
            State.events['net/reconnect'].invoke({
                channel: Network.default_channel,
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
        network.join(Network.default_channel)
        .then(onOpen, function (err) {
            w.abort();
            cb(err);
        });
    });
};

