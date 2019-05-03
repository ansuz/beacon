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
        s.replace(/^(\d+)d(\d+)$/, function (all, n, r) {
            if (isNaN(n) || isNaN(r)) { return; }

            o = {};
            o.t = 'd'; // it's a die
            o.n = n;
            o.r = r;
            o.src = all;
            return '';
        })
        .replace(/^(\d+)c$/, function (all, n) {
            o = {};
            o.n = n;
            o.t = 'c'; // it's a coin
            o.r = 2; // it has two sides..
            o.src = all;
            return '';
        });

        return o;
    }).filter(Boolean);
    return parsed;
};


var formatted_die_roll = function (die, parsed) {
    var n = parsed.n;
    var total = 0;
    var r = parsed.r;
    var src = parsed.src;
    while (n--) {
        total += (die(r) + 1);
    }
    return src + " => " + total;
};

var formatted_coin_toss = function (die, parsed) {
    var n = parsed.n;
    var total = '';
    //var r = parsed.r;
    var src = parsed.src;

    while (n--) {
        total += die(2) === 0? 'T': 'H';
    }
    return src + ' => ' + total;
};

Game.run_parsed = function (bytes, parsed) {
    var src = Game.src(bytes);
    var die = Game.die(src);

    console.log(parsed);

    var res = parsed.map(function (o) {
        if (o.t === 'c') { return formatted_coin_toss(die, o); }
        if (o.t === 'd') { return formatted_die_roll(die, o); }
        // throw error? should never get here
        return '';
    }).join(', ');
    return res;
};

