var State = require("../state");
var h = require("hyperscript");

module.exports.route = function (req, res) {
    res.setTitle("Dicebag");

    var Expr = {
        "coin": "1d2",
        "two coins": "1d2, 1d2",
        "three coins": "1d2, 1d2, 1d2",
        "_1": "",
        "_2": "",
        d4: "1d4",
        d6: "1d6",
        d8: "1d8",
        "_3": "",
        "_4": "",
        d10: "1d10",
        d12: "1d12",
        d20: "1d20",
        d100: "1d100",
    };

    var buttons = Object.keys(Expr).map(function (k) {
        if (!Expr[k]) { return h('br'); }

        var b = h('button', k);
        b.onclick = function () {
            State.global.commands.bytes(32, Expr[k], function (err, result) {
                if (err) { return console.error(err); }
                console.log(result);

            });
        };

        return b;
    });

    var box = h('div.box', buttons);


    res.main.appendChild(box);

};
