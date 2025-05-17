<main>
  <Tabs bind:current_tab>
    <svelte:fragment slot=buttons>
      <button class=tab-btn>repls</button>
      <button class=tab-btn>unichar</button>
    </svelte:fragment>
    <section id=clean class="w-full">
      <h2>تحسين النص</h2>
      <textarea dir=auto bind:this={t_area}/>
      <div id=clean-btns>
        <button class=round-btn on:click={clean_btn_click}>تحسين</button>
        <Popover>
          <button class=round-btn slot=button let:show on:click={show}>أخرى</button>
          <ul class="popover popover-menu">
            {#each actions as act, i}
              <li><button data-id={i}>{flip_arrow(act[0])}</button></li>
            {/each}
          </ul>
        </Popover>
        <button class=round-btn id=undo-btn disabled on:click={() => t_area.value = undo('undo')} on:paste={e => undo('add', e.target.value)}><icon id=undo></button>
        <button class=round-btn id=clean-ops-btn data-collapse=clean-ops on:click={data_collapse_click}><icon id=settings> خيارات</button>
      </div>

      <section id=text-actions />
      <section id=clean-ops class=collapse1>
        {#each repls as grp}
          <div>
            <h2>{grp[0]}</h2>
            {#each grp[1] as x}
              <label class="check-lbl">
                <input type=checkbox data-id={repl_i++} checked={x[2] === 0}>
                <span>{flip_arrow(x[0])}</span>
              </label>
            {/each}
          </div>
        {/each}

      </section>
    </section>
    <section class="w-full">
      <Unichar/>
    </section>
  </Tabs>

  <br><hr>
  <section id=copy-chars>
    <h2>للاقتباس</h2>
    {#each Object.entries(copy_items) as [title, ops]}
      <h3>{title}</h3>
      {#each ops as op}
        <button>{op}</button>
      {/each}
    {/each}
  </section>
  <footer>
    من مشاريع <a href=https://nuqayah.com>نُقاية</a>
  </footer>
</main>

<script>
import Popover from 'components/src/Popover.svelte'
import Tabs from 'components/src/Tabs.svelte'
import Unichar from '~/unichar/Unichar.svelte'

let current_tab = 1

const _DS = (s, cont) => (cont || document).querySelector(s)
NodeList.prototype.__proto__ = Array.prototype
Node.prototype.on = Node.prototype.addEventListener
NodeList.prototype.on = function on() { this.forEach(n => n.on(...arguments)) }

import repls from './util/repls.js'
const ar_wrap = ar => Array.isArray(ar[0]) ? ar : [ar]
function tip(msg, time) {
    const tip_id = Date.now()
    _DS('#tip p').innerHTML = msg
    _DS('#tip').classList.add('active')
    _DS('#tip').dataset.tip_id = tip_id
    setTimeout(() => {
        if (+_DS('#tip').dataset.tip_id === tip_id)
            _DS('#tip').classList.remove('active')
    }, time || 1500)
}
function data_collapse_click(e) {
    const el = _DS('#' + e.currentTarget.dataset.collapse)
    e.currentTarget.classList.toggle('active')
    el.style.maxHeight = el.style.maxHeight ? null : el.scrollHeight + 'px'
}

let t_area
const flip_arrow = s => s.replace(/➔/g, '<span class="arrow">➔</span>')
const mods = repls.map(grp => grp[1].map(grp_repls => [grp_repls.length === 2, grp_repls[1]])).flat()
function clean_ops_click(e) {
    let el = e.target.closest('.check-lbl')
    if (!el || e.target.tagName === 'INPUT') // 'label > checkmark' double fires
        return
    const id = el.firstElementChild.dataset.id
    mods[+id][0] = !mods[+id][0]
}
function clean_btn_click() {
    let t = t_area.value
    mods.filter(m => m[0]).forEach(m => {
        ar_wrap(m[1]).forEach(f => t = t.replace(f[0], f[1]))
    })
    t_area.select()
    document.execCommand('insertText', false, t) // For undo
    select_and_copy()
}

function select_and_copy() {
    t_area.select()
    document.execCommand('copy')
    tip('حُسّن النص ونُسخ')
}

let repl_i = 0

// Other actions menu and button
const fix_ar_enc = s => (new TextDecoder('windows-1256')).decode(new Uint8Array([...s].map(c => c.charCodeAt(0))))
const actions = [
    ['تحويل رموز «%» إلى نصّ (في الروابط)', [/(.*)/g, s => decodeURI(s).replace(/ /g, '%20')]],
    ['حذف كل الحركات', [/[ً-ْ]*/g, ''], 0],  // TODO: ࣰࣱࣲٕۣٔۡ۟ۤۖۗۘۚۛۜۥࣳۦٰۭٜۧۢۨ۠۬
    ['وضع مسافات قبل كل فقرة', [/(^|\n)(\S)/g, '$1   $2']],
    ['إصلاح نحو (ÕæÊíÉ)', [/(.*)/g, fix_ar_enc]],
    ['- ➔ •', [/(^ *|\n *)-/g, '$1•']],
]
// $('#text-actions-menu').innerHTML = actions.map(tpl_actions).join('')
let actions_menu_hidden
function actions_btn_click(e) {
    actions_menu_hidden = !actions_menu_hidden
    if (actions_menu_hidden)
        e.target.blur()
}
function actions_menu_click(e) {
    if (e.target.tagName !== 'BUTTON')
        return
    undo('add', t_area.value)
    const id = e.target.dataset.id
    ar_wrap(actions[+id][1]).forEach(f => { t_area.value = t_area.value.replace(f[0], f[1]) })
    select_and_copy()
}

// Undo
const undo_stack = []
function undo(action, val) {
    if (action === 'add') {
        undo_stack.push(val)
        _DS('#undo-btn').disabled = !undo_stack.length
    }
    else if (action === 'undo' && undo_stack.length){
        _DS('#undo-btn').disabled = !(undo_stack.length - 1)
        return undo_stack.pop()
    }
}
// onMount(() => {})

// Copy section
const copy_items = {
    رموز: '﷽ﷺﷻ۝۞',
    'رموز (اعتمدت حديثًا)': '\uFDFE\uFD4E\uFDFF\uFD40\uFD4F\uFD41\uFD42\uFD43\uFD44\uFD45\uFD47\uFD4D\uFD48\uFD49\uFD4A\uFD4C',
    تنسيق: '﴿﴾,«»,‹›,”“,’‘,•,✽'.split(','),
    تواريخ: [
        Intl.DateTimeFormat('ar-SA', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}).format(),
        Intl.DateTimeFormat('ar-SA').format(),
        Intl.DateTimeFormat('ar-EG').format().replace(/\//g, '-'),
    ],
}

function copy_chars_click(e) {
    let el = e.target
    if (el.tagName !== 'BUTTON')
        return
    copy_text(el.innerText)
    tip('نُسخ')
}

</script>

<style>
.tab-btn {
  flex: 1;
  padding: 0.4rem;
  font-size: 0.8rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-top: 2px solid #eee;
  border-bottom: 2px solid transparent;
  font-weight: bold;
}
.tab-btn:global(.active) {
  border-bottom: 2px solid coral;
  background-color: #fff;
}
</style>