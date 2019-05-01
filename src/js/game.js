var Game = module.exports;
//var mancy = require("cryptomancy");

var mancy = {
    source: require("cryptomancy-source"),
    methods: require("cryptomancy-methods"),
};

var ansuz = require("ansuz");

Game.src = function (seed) {
    return mancy.source.deterministic(seed);
};

Game.die = function (src) {
    return mancy.methods.die(src);
};

Game.seed = function () {
    return ansuz.die(Number.MAX_SAFE_INTEGER);
};

Game.d_100 = function (bytes) {
    return Game.die(Game.src(bytes))(100);
};

Game.parse = function (expr) {
    var parsed = expr.split(',')
    .filter(Boolean)
    .map(function (s) { return s.trim(); })
    .map(function (s) {
        var o;
        s.replace(/(\d+)d(\d+)/, function (all, n, r) {
            if (isNaN(n) || isNaN(r)) { return; }

            o = {};
            o.n = n;
            o.r = r;
            o.src = all;
        });

        return o;
    }).filter(Boolean);
    return parsed;
};

Game.run_parsed = function (bytes, parsed) {
    var src = Game.src(bytes);
    var die = Game.die(src);

    console.log(parsed);

    var res = parsed.map(function (o) {
        var n = o.n;
        var total = 0;

        while (n--) {
            total += (die(o.r) + 1);
        }
        return o.src + " => " + total;
    }).join(', ');
    return res;
};

