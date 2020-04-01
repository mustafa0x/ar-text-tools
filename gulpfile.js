const gulp = require('gulp');
const del = require('del');
const map = require('map-stream');
const fs = require('fs');
const r = f => fs.readFileSync(f).toString();

function modify(mod) {
    return map((file, cb) => {
        file.contents = new Buffer(mod(file.contents.toString()));
        cb(null, file);
    });
}

function prep_js() {
    const terser = require('gulp-terser');
    const concat = require('gulp-concat');

    return gulp.src('assets/{repls,text}.js')
        .pipe(concat('js.min.js'))
        .pipe(modify(s => {
            return s.replace('export default repls;\n', '')
                    .replace("import repls from './repls.js';\n", '');
        }))
        .pipe(terser({toplevel: true}))
        .pipe(gulp.dest('dist'));
}

function prep_css() {
    const postcss = require('gulp-postcss');
    const autoprefixer = require('autoprefixer');
    const mqpacker = require('css-mqpacker');
    const cssnano = require('cssnano');
    const concat = require('gulp-concat');

    return gulp.src('assets/{main,text}.css')
        .pipe(concat('style.min.css'))
        .pipe(postcss([
            autoprefixer,
            mqpacker,
            cssnano
        ]))
        .pipe(gulp.dest('dist'));
}

function combine(cb) {
    const icons = r('assets/icons.svg').replace(/id="/g, 'id="icon-').replace(/\n +/g, '');
    let pg = r('index.html');
    pg = pg.replace('assets/icon.png', 'data:image/png;base64,' + fs.readFileSync('icon.png', 'base64'));
    pg = pg.replace(/\n<link rel="stylesheet"[\s\S]+\.css">/, () => `<style>${r('dist/style.min.css')}</style>`);
    pg = pg.replace(/\n<script src[\s\S]*<\/script>/, () => `<script>${r('dist/js.min.js')}</script>`);
    pg = pg.replace(/>\n */g, '> ');
    pg = pg.replace(/xlink:href="assets\/icons.svg#/g, 'xlink:href="#icon-');
    fs.writeFileSync('dist/index.html', pg + icons);
    cb();
}

exports.build = gulp.series(cb => del('dist'), gulp.parallel(prep_js, prep_css), combine);
