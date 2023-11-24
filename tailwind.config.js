import {fontFamily} from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
const config = {
    content: ['./index.html', './src/**/*.svelte', './node_modules/components/src/*.svelte'],

    experimental: {
        optimizeUniversalDefaults: true,
    },
    corePlugins: {
        container: false,
    },
    theme: {
        extend: {
            fontFamily: {
                sans: ['Kitab', ...fontFamily.sans],
            },
            listStyleType: {
                arabic: 'arabic-indic',
            },
        },
    },
}
export default config
