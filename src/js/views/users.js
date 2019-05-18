var h = require("hyperscript");
var State = require("../state");

module.exports.route = function (req, res) {
    res.setTitle('Users');
    var list = h('ul.userlist');

    res.main.appendChild(list);

    var render = function () {
        if (!State.transport) { return; }
        list.innerHTML = '';
        var nicks = State.commands.nicks();
        Object.keys(nicks).forEach(function (k) {
            list.appendChild(h('li', nicks[k]));
        });
    };

    State.Page
    .on('net/disconnect', render)
    .on('mpc/ready', render)
    .on('chan/join', render)
    .on('chan/part', render)
    .on('net/connect', render)
    .on('mpc/nick', render)
    .on('name/self', render);

    render();
};
