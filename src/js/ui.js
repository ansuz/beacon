var h = require("hyperscript");
var marked = require("marked");
var ui = module.exports;
var Util = require("./util");
var ansuz = require("ansuz");

var State = require("./state");
var body = State.global.document.body;

ui.link = function (href, text, id) {
    id = id? '#' + id: '';
    return h('a.internal-link' + id, {
        href: href,
    }, [text]);
};

marked.setOptions({
    sanitize: true
});

var m = ui.m = function (md) {
    var s = h('span.md');
    s.innerHTML = marked(md || '');
    return s;
};

// TODO include translations file from here?
ui.title = function (content) {
    return h('h1.title', content);
};

ui.h1 = function (content) {
    return h('h1', Array.isArray(content)? content: [content]);
};

ui.heading = function (t) {
    return h('h2.heading', t);
};

ui.li = ansuz.fixN(h, 'li', 0);

ui.ul = function (A) {
    return h('ul.list', A.map(function (a) {
        return (typeof(a) === 'object' &&
            Util.includes(['UL', 'OL'], a.nodeName))? a: ui.li(a);
    }));
};

ui.p = function (content) {
    return h('p', content);
};

ui.text = function (placeholder) {
    return h('input.input', {
        type: 'text',
        placeholder: placeholder,
    });
};

ui.textarea = function (placeholder) {
    return h('textarea.input', {
        placeholder: placeholder,
    });
};

ui.number = function (min, max, val) {
    var input = h('input.input.number', {
        type: 'number',
        min: min,
        max: max,
    });
    input.value = val;
    return input;
};

ui.password = function (placeholder) {
    return h('input.input', {
        type: 'password',
        placeholder: placeholder,
    });
};

ui.button = function (text, attr) {
    return h('button.button', attr || {}, [text]);
};

ui.message = function (text, time, author) {
    var nick = author.slice(0, 9);

    return h('div.message', {
        title: new Date(time).toUTCString(),
        'data-author': author,
    }, [
        h('span.author', {
            title: author,
        }, '<' + nick + '>'),
        m(text),
        //h('span.text', text)
    ]);
};

var remove = function (el) {
    if (!el.parentElement) { return; }
    el.parentElement.removeChild(el);
};

var fade = function (el, op, t /* ms */) {
    var s = el.style;
    s.transition = 'opacity ' + t + 'ms';
    s.opacity = op;
};

var fadeAway = function (el, time, cb) {
    setTimeout(function () {
        remove(el);
        if (typeof(cb) === 'function') { cb(); }
    }, time);
    fade(el, 0, time);
};

ui.modal = function (content, cb) {
    var m = h('div.modal', content);
    var time = 500;
    body.appendChild(m);
    cb({
        modal: m,
        remove: function (/* cb */) {
            fadeAway(m, time);
        },
    });
};

ui.dialog = function (content) {
    return h('div.fullscreen',
        h('div.dialog', content)
    );
};

ui.alert = function (text, cb) {
    setTimeout(function () {
        State.global.alert(text);
        if (cb) { cb(); }
    });
};

ui.okButton = function () {
    return ui.button('ok');
};

ui.cancelButton = function () {
    return ui.button('cancel');
};

ui.buttons = function (content) {
    return h('div.buttons', content);
};

ui.content = function (content) {
    return h('div.content', content);
};

var listen = function (cancel, accept) {
    var f;
    var off = function () { State.Page.off('keypress', f); };
    State.Page.on('keypress', (f = function (e) {
        switch (e.key) {
            case 'Escape': off(); return cancel();
            case 'Enter': off(); return accept();
        }
    }));
};

ui.alert = function (content, cb) {
    var ok = ui.okButton();
    var m = ui.dialog([
        ui.content(content),
        ui.buttons([
            ok,
        ]),
    ]);
    var click = ok.onclick = function () { fadeAway(m, 500, cb); };
    body.appendChild(m);
    listen(click, click);

    setTimeout(function () { ok.focus(); });
    // TODO implement this same pattern elsewhere...
    return {
        click: click,
        dialog: m,
        ok: ok,
    };
};

ui.confirm = function (content, cb) {
    var ok = ui.okButton();
    var cancel = ui.cancelButton();

    var m = ui.dialog([
        h('div.content', content),
        ui.buttons([
            cancel,
            ok
        ]),
    ]);

    var CB = Util.once(function (yes) {
        fadeAway(m, 500, function () {
            if (typeof(cb) === 'function') { cb(void 0, yes); }
        });
    });

    ok.onclick = function () { CB(true); };
    cancel.onclick = function () { CB(false); };
    body.appendChild(m);
    listen(cancel.onclick, ok.onclick);
    setTimeout(function () { ok.focus(); });
};

ui.prompt = function (content, opt, cb) {
    opt = opt || {};
    var ok = ui.okButton();
    var cancel = ui.cancelButton();
    var input = ui.text(opt.placeholder || '');

    var m = ui.dialog([
        ui.content(content),
        ui.content(input),
        ui.buttons([
            cancel,
            ok
        ]),
    ]);

    var CB = Util.once(function (e, value) {
        fadeAway(m, 500, function () {
            if (typeof(cb) === 'function') { cb(e, value); }
        });
    });

    ok.onclick = function () { CB(void 0, input.value); };
    cancel.onclick = function () { CB(void 0, null); };

    body.appendChild(m);
    setTimeout(function () { input.focus(); });
    listen(cancel.onclick, ok.onclick);
};

ui.jsonTable = function (O) {
    return h('table.jsonTable',
        h('tbody', Object.keys(O).map(function (k) {
            return h('tr', [
                h('td.attr', {
                    'data-id': k,
                }, k),
                h('td.value', {
                    'data-id': k,
                }, O[k]),
            ]);
        }))
    );
};
