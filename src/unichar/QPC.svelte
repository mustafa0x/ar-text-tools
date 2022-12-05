<script>
export let pref;
export let url;

const pad = i => (i + '').padStart(3, '0')
let font_name = 1;
let in_text = '';
async function load_font(pg) {
    const font = new FontFace(pref + pad(pg), `url(${url + pref + pad(pg)}.woff2)`);
    document.fonts.add(await font.load());
}
$: load_font(font_name);
</script>

<input type=number bind:value={font_name} min=1 max=605><br>
<textarea bind:value={in_text}></textarea><br>
<div style="font-family: {pref + pad(font_name)}">{in_text}</div>
