var Util = module.exports;

Util.slice = function (A, start, end) {
    return Array.prototype.slice.call(A, start, end);
};

Util.noop = function () {};

Util.isString = function (s) { return typeof(s) === 'string'; };

Util.includes = function (A, e) { return A.indexOf(e) !== -1; };

Util.once = function (f) {
    if (typeof(f) !== 'function') {
        throw new Error("expected a function");
    }
    var c;
    return function () {
        if (c) { return; }
        c = true;
        f.apply(this, Util.slice(arguments));
    };
};

Util.uid = function () {
    return Number(Math.floor(Math.random() *
        Number.MAX_SAFE_INTEGER)).toString(32);
};

Util.handler = function (parent) {
    var stack = [];
    var api;
    return (api = {
        on: function (f) {
            if (typeof(f) === 'function') {
                stack.push(f);
                return parent;
            }
            console.error("expected a function");
        },
        off: function (f) {
            var i = stack.indexOf(f);
            if (i !== -1) { stack.splice(i, 1); }
            return parent;
        },
        once: function (f) {
            var g = function () {
                var args = Util.slice(arguments);
                f.apply(null, args);
                api.off(g);
            };
            api.on(g);
            return parent;
        },
        invoke: function () {
            var args = Util.slice(arguments);
            stack.some(function (f) {
                return f.apply(null, args);
            });
            return parent;
        },
        clear: function () {
            stack.splice(0, stack.length);
            return parent;
        },
    });
};

/* Given an array of event names, return....

events(['name1', 'name2']) => {
    events: {
        name1: {
            on,
            off,
            once,
            invoke,
            clear,
        },
        name2: {

        },
    },
    on: (k, f),
    off: (k, f),
    once: (k, f),
}

*/


Util.events = function (names) {
    var api = {};
    var events = /* api.events =*/ {};
    var get = function (k) {
        if (events[k]) { return events[k]; }
        console.error("unsupported event type: ", k);
        throw new Error('INVALID EVENT TYPE');
    };

    names.forEach(function (name) { events[name] = Util.handler(api); });
    ['on', 'off', 'once', 'clear'].forEach(function (method) {
        api[method] = function (k, f) {
            get(k)[method](f);
            return api;
        };
    });

    api.invoke = function () {
        var k = arguments[0];
        get(k).invoke.apply(this, Util.slice(arguments, 1));
    };

    api.list = function () {
        return Object.keys(events);
    };

    return api;
};

Util.tryParse = function (s) {
    try {
        return JSON.parse(s);
    } catch (e) {
        return null;
    }
};

Util.clone = function (o) {
    return JSON.parse(JSON.stringify(o));
};
