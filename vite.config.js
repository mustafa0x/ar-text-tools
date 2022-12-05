import {svelte} from '@sveltejs/vite-plugin-svelte'
import autoimport from 'svelte-preprocess-autoimport'
import svelte_preprocess from 'svelte-preprocess'
import postcssNesting from 'postcss-nesting'
import path from 'path'
import {apply_repls} from 'components/src/util.js'
import {execFileSync as exec} from 'child_process'

const markup_repls = [
    [/<icon id=(.+?)>/g, '<svg class="icon icon-$1"><use href=/icons.svg#$1></svg>'],
    [/(?<=<a )(?=href="?https?:)/g, 'target=_blank '],
]
const is_build = process.argv.includes('build')
const vars = {
    'window.__BUILD_DATE__': `'${(new Date).toISOString()}'`,
    'window.__BUILD_HASH__': `'${exec('git', ['rev-parse', '--short', 'HEAD']).toString().trim()}'`,
    'window.__DEBUG__': !is_build,
}
const build_config = {
    lib: {
        entry: 'src/main.js',
        formats: ['es'],
        fileName: (format) => `bundle.${format}.js`,
    },
    rollupOptions: {
        output: {
            entryFileNames: 'bundle.js',
            assetFileNames: 'bundle.css',
            intro: Object.entries(vars).map(([k, v]) => `${k} = ${v}`).join('\n'),
        },
    },
}
export default {
    publicDir: is_build ? false : 'public',
    build: {
        reportCompressedSize: false,
        minify: false,
        ...(is_build ? build_config : {}),
    },
    server: {host: !!process.env.VITE_HOST},
    resolve: {
        alias: [{find: '~', replacement: path.resolve('src')}],
    },
    define: is_build ? {} : vars,
    plugins: [
        svelte({
            preprocess: [
                {markup({content}) { return {code: apply_repls(content, markup_repls)} }},
                autoimport(),
                svelte_preprocess({markupTagName: 'not_a_tag', postcss: {plugins: [postcssNesting()]}}),
            ],
            onwarn(warning, handler) {
                if (['a11y-autofocus', 'security-anchor-rel-noreferrer'].includes(warning.code))
                    return
                handler(warning)
            },
        }),
    ],
    optimizeDeps: {
        exclude: ['tinro'],
    },
}
