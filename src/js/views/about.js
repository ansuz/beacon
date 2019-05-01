/*jshint esversion: 6 */
var h = require("hyperscript");
var Marked = require("marked");

module.exports.route = function (req, res) {
    console.log("boop");
    res.setTitle('About');

    var box = h('div.copy');
    box.innerHTML = Marked("Cryptomancy is inspired by [Cryptomancer](http://cryptorpg.com), a tabletop role-playing game made for hackers, by hackers.\n\n"
    + "It provides tools for playing tabletop roleplaying games over the internet without relying on a trusted third party to prevent players from cheating on their random dice rolls.\n\n"
    + "It accomplishes this by using a cryptographic technique known as a [secure coin flip](https://en.wikipedia.org/wiki/Commitment_scheme#Coin_flipping).\n\n"
    + "Cryptomancy communicates using a [CryptPad](https://cryptpad.fr) server. Its cryptographic components come from [TweetNaCl-js](https://github.com/dchest/tweetnacl-js).\n\n");

    res.main.appendChild(box);
};
