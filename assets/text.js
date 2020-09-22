import repls from './repls.js';
const $ = (s, cont) => (cont || document).querySelector(s);
const $$ = (s, cont) => (cont || document).querySelectorAll(s);
NodeList.prototype.__proto__ = Array.prototype;
Node.prototype.on = Node.prototype.addEventListener;
NodeList.prototype.on = function on() { this.forEach(n => n.on(...arguments)); };
HTMLElement.prototype.appendHTML = function appendHTML(s) { this.insertAdjacentHTML('beforeEnd', s); };
const ar_wrap = ar => Array.isArray(ar[0]) ? ar : [ar];
function copy_text(text) {
    if ('clipboard' in navigator)
        navigator.clipboard.writeText(text);
    else {
        const ta = document.createElement('textarea');
        Object.assign(ta, {value: text, style: 'position: fixed; top: -9999em'});
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }
}

function tip(msg, time) {
    const tip_id = Date.now();
    $('#tip p').innerHTML = msg;
    $('#tip').classList.add('active');
    $('#tip').dataset.tip_id = tip_id;
    setTimeout(() => {
        if (+$('#tip').dataset.tip_id === tip_id)
            $('#tip').classList.remove('active');
    }, time || 1500);
}
$$('[data-collapse]').on('click', e => {
    const el = $('#' + e.currentTarget.dataset.collapse);
    e.currentTarget.classList.toggle('active');
    el.style.maxHeight = el.style.maxHeight ? null : el.scrollHeight + 'px';
});

const t_area = $('#clean textarea');
const flip_arrow = s => s.replace(/➔/g, '<span class="arrow">➔</span>');
const mods = repls.map(grp => grp[1].map(grp_repls => [grp_repls.length === 2, grp_repls[1]])).flat();
$('#clean-ops').on('click', e => {
    let el = e.target.closest('.check-lbl');
    if (!el || e.target.tagName === 'INPUT') // 'label > checkmark' double fires
        return;
    const id = el.firstElementChild.dataset.id;
    mods[+id][0] = !mods[+id][0];
});
$('#clean-btn').on('click', () => {
    let t = t_area.value;
    mods.filter(m => m[0]).forEach(m => {
        ar_wrap(m[1]).forEach(f => t = t.replace(f[0], f[1]));
    });
    t_area.select();
    document.execCommand('insertText', false, t); // For undo
    select_and_copy();
});

function select_and_copy() {
    t_area.select();
    document.execCommand('copy');
    tip('حُسّن النص ونُسخ');
}

let repl_i = 0;
$('#clean-ops').innerHTML = repls.map(grp => {
    const items = grp[1].map(x => {
        const chk = x[2] === 0 ? '' : 'checked';
        return `<label class="check-lbl">
            <input type="checkbox" data-id="${repl_i++}" ${chk}><span>${flip_arrow(x[0])}</span>
        </label>`;
    }).join('\n');
    return `<section><h2>${grp[0]}</h2>${items}</section>`;
}).join('');

// Other actions menu and button
const fix_ar_enc = s => (new TextDecoder('windows-1256')).decode(new Uint8Array([...s].map(c => c.charCodeAt(0))));
const actions = [
    ['تحويل رموز «%» إلى نصّ (في الروابط)', [/(.*)/g, s => decodeURI(s).replace(/ /g, '%20')]],
    ['حذف كل الحركات', [/[ً-ْ]*/g, ''], 0],
    ['وضع مسافات قبل كل فقرة', [/(^|\n)(\S)/g, '$1   $2']],
    ['إصلاح نحو (ÕæÊíÉ)', [/(.*)/g, fix_ar_enc]],
    ['- ➔ •', [/(^ *|\n *)-/g, '$1•']],
];
const tpl_actions = (act, i) => `<li><button data-id="${i}">${flip_arrow(act[0])}</button></li>`;
$('#text-actions-menu').innerHTML = actions.map(tpl_actions).join('');
$('#text-actions-btn').on('click', e => {
    $('#text-actions-menu').hidden = !$('#text-actions-menu').hidden;
    if ($('#text-actions-menu').hidden)
        e.target.blur();
});
$('#text-actions-btn').on('blur', e => {
    setTimeout(() => $('#text-actions-menu').hidden = true, 200);
});
$('#text-actions-menu').on('click', e => {
    if (e.target.tagName !== 'BUTTON')
        return;
    undo('add', t_area.value);
    const id = e.target.dataset.id;
    ar_wrap(actions[+id][1]).forEach(f => { t_area.value = t_area.value.replace(f[0], f[1]); });
    select_and_copy();
});

// Undo
const undo_stack = [];
function undo(action, val) {
    if (action === 'add') {
        undo_stack.push(val);
        $('#undo-btn').disabled = !undo_stack.length;
    }
    else if (action === 'undo' && undo_stack.length){
        $('#undo-btn').disabled = !(undo_stack.length - 1);
        return undo_stack.pop();
    }
}
$('#undo-btn').on('click', () => {
    t_area.value = undo('undo');
});

t_area.on('paste', e => {
    undo('add', e.target.value);
});

// Copy section
const copy_items = {
    رموز: '﷽,ﷺ,ﷻ,۝,۞'.split(','),
    'رموز (اعتمدت حديثًا)': '\uFDFE,\uFDFF,\uFD40,\uFD41,\uFD42,\uFD43,\uFD44,\uFD45,\uFD47,\uFD4D,\uFD48,\uFD49'.split(','),
    تنسيق: '﴿﴾,«»,‹›,”“,’‘,•,✽'.split(','),
    تواريخ: [
        Intl.DateTimeFormat('ar-SA', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}).format(),
        Intl.DateTimeFormat('ar-SA').format(),
        Intl.DateTimeFormat('ar-EG').format().replace(/\//g, '-'),
    ],
};
Object.entries(copy_items).forEach(([title, ops]) => {
    $('#copy-chars').appendHTML(`<h3>${title}</h3>` + ops.map(op => `<button>${op}</button>`).join(' '));
});

$('#copy-chars').on('click', e => {
    let el = e.target;
    if (el.tagName !== 'BUTTON')
        return;
    copy_text(el.innerText);
    tip('نُسخ');
});
