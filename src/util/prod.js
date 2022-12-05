// Check localStorage + indexedDB
try {
    localStorage.setItem('_TEST_KEY_', 1)
    localStorage.removeItem('_TEST_KEY_')
} catch (e) {
    delete window['localStorage']
    localStorage = {setItem: () => {}, getItem: () => {}, removeItem: () => {}}
}
indexedDB.open('_TEST_DB_', 1).onerror = () => {
    alert('لم نتمكن من فتح قاعدة البيانات! عذرا، لن يعمل التطبيق.')
    window.__debug('Failed to open DB')
}

// Error logging
window.ERROR_COUNT = 0
function post_error(parts) {
    parts = [decodeURI(location) + ' - ' + window.__BUILD_HASH__, ...parts, navigator.userAgent]
    const body = JSON.stringify({err: parts.join('\n'), site: location.host})
    fetch('https://tafsir.app/err.php', {method: 'post', mode: 'no-cors', body})
}
window.onerror = (msg, url, ln, col, err) => {
    if (window.ERROR_COUNT++ > 50)
        return
    const loc = [(url || '').replace('https://', ''), ln || '', col || ''].join(':')
    post_error([msg, loc, err ? err.stack : '<no stack>'])
}
window.onunhandledrejection = e => {
    if (window.ERROR_COUNT++ > 50 || !(e && e.reason && e.reason.stack) || e.reason.stack.includes('TypeError: Failed to fetch'))
        return
    post_error(['(PROMISE) - ' + e.reason.stack])
}

if (!location.host.includes(''))
    alert('ERROR')

function remove_search_param(url_str, param) {
    const url_object = new URL(url_str)
    url_object.searchParams.delete(param)
    return url_object.toString()
}
if (location.search.includes('fbclid='))
    location.replace(remove_search_param(location.href, 'fbclid'))

// Analytics
((e,o,t)=>{const i=e.history,a=i.pushState,c=()=>(localStorage.cid||(localStorage.cid=Math.random().toString(36)),localStorage.cid),n=(o,i,a,n,r,d,l)=>{const s=new URLSearchParams({v:"1",ds:"web",aip:t.anonymizeIp?1:void 0,tid:"UA-KEY",cid:c(),t:o||"pageview",sd:t.colorDepth&&screen.colorDepth?screen.colorDepth+"-bits":void 0,dr:document.referrer||void 0,dt:document.title,dl:document.location.origin+document.location.pathname+document.location.search,ul:t.language?(navigator.language||"").toLowerCase():void 0,de:t.characterSet?document.characterSet:void 0,sr:t.screenSize?`${(e.screen||{}).width}x${(e.screen||{}).height}`:void 0,vp:t.screenSize&&e.visualViewport?`${(e.visualViewport||{}).width}x${(e.visualViewport||{}).height}`:void 0,ec:i||void 0,ea:a||void 0,el:n||void 0,ev:r||void 0,exd:d||void 0,exf:void 0!==l&&!1==!!l?0:void 0});navigator.sendBeacon&&navigator.sendBeacon("https://www.google-analytics.com/collect",s.toString())};i.pushState=function(e){return setTimeout(n,t.delay||10),a.apply(i,arguments)},n()})(window,0,{anonymizeIp:!0,colorDepth:!0,characterSet:!0,screenSize:!0,language:!0})

// ServiceWorker
if ('serviceWorker' in navigator) {
    if (!navigator.serviceWorker.controller)
        navigator.serviceWorker.register('/sw.js')
    else {
        let refreshing
        // Reload page if a new service worker took over
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                location.reload()
                refreshing = true
            }
        })
    }
}
