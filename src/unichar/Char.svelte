<article>
  <span class=char>{c}</span>
  <div class=info>
    <span>{codepoint} <button class=copy-btn on:click={() => copy_text(c)}><icon id=copy/></button></span>
    <a href=https://codepoints.net/{codepoint}>Codepoints</a>
  </div>
</article>

<script>
import { copy_text } from 'components/src/util.js'

export let c;
let codepoint = 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
</script>

<style>
article {
  box-shadow: 0 0 4px silver;
  background: white;
  padding: 0.2rem;
  margin: 0.2rem;
  display: inline-block;
}
.char {
  padding: 1rem;
}
.info {
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
}
</style>
