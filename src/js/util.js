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

Util.handler = function () {
    var stack = [];
    var api;
    return (api = {
        on: function (f) {
            if (typeof(f) === 'function') { return void stack.push(f); }
            console.error("expected a function");
        },
        off: function (f) {
            var i = stack.indexOf(f);
            if (i === -1) { return; }
            stack.splice(i, 1);
        },
        once: function (f) {
            var g = function () {
                var args = Util.slice(arguments);
                f.apply(null, args);
                api.off(g);
            };
            api.on(g);
        },
        invoke: function () {
            var args = Util.slice(arguments);
            stack.some(function (f) {
                return f.apply(null, args);
            });
        },
        clear: function () {
            stack.splice(0, stack.length);
        },
    });
};

Util.events = function (names) {
    var api = {};
    var events = api.events = {};
    var get = function (k) {
        if (events[k]) { return events[k]; }
        console.error("unsupported event type: ", k);
        throw new Error('INVALID EVENT TYPE');
    };

    names.forEach(function (name) { events[name] = Util.handler(); });
    ['on', 'off', 'once'].forEach(function (method) {
        api[method] = function (k, f) {
            get(k)[method](f);
            return api;
        };
    });

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
