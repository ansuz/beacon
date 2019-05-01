var h = require("hyperscript");
module.exports.route = function (req, res) {
    res.setTitle('404');
    res.main.appendChild(h('p', 'Page not found'));
};


