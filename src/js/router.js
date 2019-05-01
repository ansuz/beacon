var router = module.exports;

var unmon = require("unmon-router");
var ui = require("./ui");
var util = require("./util");
var nav = require("./nav");
//var notify = require("./notify");
//var visible = require("./visible");

var routes = router.routes = require("./views/index");
var State = require("./state");
var document = State.global.document;

var request = function (hash) {
    if (!hash) { return { url: '/' }; }
    return {
        url: hash.slice(1),
        parts: hash.slice(1).split('/').filter(Boolean),
    };
};

var render;
var redirect = function (hash) {
    router.render(hash);
    State.global.history.replaceState({}, State.global.document.title, hash);
};

var Page = State.Page = {};

// Page events...
var eventsApi = util.events([
/*
    'rpc/message',
    'rpc/connect',
    'rpc/disconnect',
    'rpc/join',
    'rpc/part',*/
]);

var events = Page.events = eventsApi.events;
Page.on = function (k, f) {
    if (events[k]) {
        events[k].on(f);
        return Page;
    }
    var handler = events[k] = util.handler();
    State.global.addEventListener(k, handler.invoke);
    handler.on(f);
};

Page.off = function (k, f) {
    if (!events[k]) { return Page; }
    events[k].off(f);
    return Page;
};

Page.once = function (k, f) {
    if (events[k]) {
        events[k].once(f);
        return Page;
    }
    var handler = events[k] = util.handler();
    State.global.addEventListener(k, handler.invoke);
    handler.once(f);
};

Page.clear = function () {
    Object.keys(Page.events).forEach(function (k) {
        Page.events[k].clear();
    });
    return Page;
};

var response = function () {
    var res = {
        main: document.querySelector('.spa-main'),
        log: document.querySelector('.spa-log'),
        bar: document.querySelector('.spa-bar'),
        setTitle: function (t) {
            res.title = document.title = t;
            res.bar.appendChild(ui.title(t));
            res.bar.appendChild(nav());
        },
        append: function (el) {
            res.main.appendChild(el);
        },
        on: function (k, f) {
            Page.on(k, f);
        },
        off: function (k, f) {
            Page.off(k, f);
        },
        redirect: redirect,
        update: function (hash) {
            State.global.history.replaceState({}, document.title, hash);
        },
    };
    return res;
};

router.clear = function (req, res, next) {
    // start fresh
    res.bar.innerHTML = '';
    res.main.innerHTML = '';
    //notify.set(true);
    Page.clear();
    next();
};

render = unmon()
.route(/.*/, require("./routes/logger"))
.route(/.*/, require("./routes/chat"))
.route(/.*/, router.clear)
.route(/.*/, function (req, res, next) {
    var page = req.url.split('/').filter(Boolean)[0];
    if (typeof(routes[page]) !== 'function') {
        return void next();
    }
    routes[page](req, res);
})
.route(/.*/, routes.four04)
.compile();

router.render = function (hash) {
    render(request(hash), response());
};

