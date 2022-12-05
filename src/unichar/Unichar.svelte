<h1>Unichar</h1>

<textarea bind:value={text}></textarea>
<section>
  {#each text as c (Math.random())}
    {#if c === ' ' || c === '\n'}
      <div class=break>&nbsp;</div>
    {:else}
      <Char {c} />
    {/if}
  {/each}
</section>

<hr>
<Diff_DMP />

<hr>
<h1>خط مصحف حفص</h1>
<QPC pref=QCF2 url=https://muqri.com/mushaf/woff2/ />

<hr>
<h1>خط مصحف حفص القديم</h1>
<QPC pref=QCF_P url=https://raw.githubusercontent.com/alquran-foundation/qpc-fonts/master/mushaf-woff2/ />

<hr>
<Normalizer/>
<!-- <QPC1 /> -->

<script>
import Char from './Char.svelte';
import QPC from './QPC.svelte';
import Normalizer from './Normalizer.svelte';
// import QPC1 from './QPC1.svelte';
import Diff_DMP from './Diff_DMP.svelte';
let text = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ';
</script>

<style>
h1 {
  text-align: center;
}
.break {
  line-height: 2;
}
textarea {
  display: block;
  margin: 0 auto;
  height: 10rem;
  width: 24rem;
  margin-bottom: 1rem;
}
</style>
