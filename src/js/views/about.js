/*jshint esversion: 6 */
var h = require("hyperscript");
var Marked = require("marked");

module.exports.route = function (req, res) {
    console.log("boop");
    res.setTitle('About');

    var box = h('div.copy');
    box.innerHTML = Marked("This tool provides  private chat rooms with [provably fair](https://en.wikipedia.org/wiki/Provably_fair) random functions in your browser thanks to a little bit of cryptography.\n\n"
    + "You can use it to play games with some assurance that nobody is reading your messages, and that none of your _'friends'_ are cheating on their rolls.\n\n"
    + "It uses a simple server to relay messages, but everything else is peer-to-peer.\n\n"
    + "Set your name in the 'settings' tab, and then use the 'dicebag' to roll flip coins or roll dice.\n\n"
    + "This project was inspired by [Cryptomancer](http://cryptorpg.com), _a tabletop role-playing game made for hackers, by hackers_.\n\n"
    + "Its source code is available [on GitHub](https://github.com/ansuz/beacon).\n\n"
    );

    res.main.appendChild(box);
};
