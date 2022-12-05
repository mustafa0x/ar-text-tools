import {readable, writable} from 'svelte/store'
import {get, set} from 'idb-keyval'
import {debounce} from 'components/src/util.js'

export const appdata = writable({})

async function get_data() {
    let d = await get('appdata')
    if (!d) {
        const f = await fetch('/appdata.json')
        d = await f.json()
    }
    appdata.set(d)
}
get_data()

appdata.subscribe(debounce(data => {
    set('appdata', data)
}, 200))
