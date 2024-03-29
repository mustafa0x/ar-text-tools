import fs from 'fs';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import glob from 'glob';
import { minify } from 'terser';
import { execFileSync as exec } from 'child_process';

const r = f => fs.readFileSync(f).toString();
const r_glob = (pattern, sep='') => glob.sync(pattern, {nosort: true}).map(f => r(f)).join(sep);
const min_js = async s => (await minify(s, {mangle: {toplevel: true}, toplevel: true})).code;
const min_css = async s => (await postcss([autoprefixer, cssnano({preset: ['default', {normalizeUrl: false}]})]).process(s, {from: undefined})).css;
const apply_repls = (s, repls) => repls.reduce((a, b) => a.replace(b[0], b[1]), s);

async function main() {
    // CSS
    const css = await min_css(r_glob('assets/{main,text}.css'));

    // JS
    const build_hash = `window.__BUILD_HASH__ = '${exec('git', ['rev-parse', '--short', 'HEAD']).toString().trim()}';`;
    const js = await min_js(apply_repls(r_glob('assets/{repls,text}.js'), [
        ['export default repls;\n', ''],
        ["import repls from './repls.js';\n", ''],
    ]))

    // Combine
    const icons = apply_repls(r('assets/icons.svg'), [[/ xmlns=".*?"/, ''], [/id="/g, 'id="icon-'], [/\n */g, ''], [/="([^ ]+)"/g, '=$1']]);
    const pg = apply_repls(r('index.html'), [
        ['assets/icon.png', 'data:image/png;base64,' + fs.readFileSync('icon.png', 'base64')],
        [/="([^ ]+)"/g, '=$1'],
        [/xlink:href=assets\/icons.svg#/g, 'xlink:href=#icon-'],
        [/\n<link rel=stylesheet[\s\S]+\.css>/, () => `<style>${css}</style>`],
        [/\n<script src[\s\S]*<\/script>/, () => `<script type=module>${build_hash}${js}</script>`],
        [/>\n+ */g, '>'],
        [/&#32;/g, ' '],
    ]);
    fs.writeFileSync('dist/index.html', pg + icons);
}

main();
