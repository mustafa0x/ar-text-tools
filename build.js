import fs from 'fs';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import glob from 'glob';
import rimraf from 'rimraf';
import { minify } from 'terser';
import { execFileSync as exec } from 'child_process';

const r = f => fs.readFileSync(f).toString();
const r_glob = (pattern, sep='') => glob.sync(pattern, {nosort: true}).map(f => r(f)).join(sep);
const min_js = async s => (await minify(s, {mangle: {toplevel: true}, toplevel: true})).code;
const min_css = async s => (await postcss([autoprefixer, cssnano({preset: ['default', {normalizeUrl: false}]})]).process(s, {from: undefined})).css;

async function main() {
    rimraf.sync('dist');
    fs.mkdirSync('dist');

    // CSS
    const css = await min_css(r_glob('assets/{main,text}.css'));

    // JS
    const build_hash = `window.__BUILD_HASH__ = '${exec('git', ['rev-parse', '--short', 'HEAD']).toString().trim()}';`;
    let js_files = r_glob('assets/{repls,text}.js');
    js_files = js_files.replace('export default repls;\n', '').replace("import repls from './repls.js';\n", '');
    let js = await min_js(js_files);
    js = `<script type=module>${build_hash}${js}</script>`;

    // Combine
    const icons = r('assets/icons.svg').replace(/id="/g, 'id="icon-').replace(/\n */g, '').replace(/="([^ ]+)"/g, '=$1');
    let pg = r('index.html');
    pg = pg.replace('assets/icon.png', 'data:image/png;base64,' + fs.readFileSync('icon.png', 'base64'));
    pg = pg.replace(/="([^ ]+)"/g, '=$1');
    pg = pg.replace(/xlink:href=assets\/icons.svg#/g, 'xlink:href=#icon-');
    pg = pg.replace(/\n<link rel=stylesheet[\s\S]+\.css>/, () => `<style>${css}</style>`);
    pg = pg.replace(/\n<script src[\s\S]*<\/script>/, () => js);
    pg = pg.replace(/>\n+ */g, '>');
    pg = pg.replace(/&#32;/g, ' ');
    fs.writeFileSync('dist/index.html', pg + icons);
}

main();
