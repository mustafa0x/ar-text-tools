<h1>مقارنة بين النصوص</h1>

<section dir=ltr>
  <label>Timeout <input type=number bind:value={timeout}></label>
  <label>cleanupSemantic <input type=checkbox bind:checked={cleanup_semantic}></label>
  <label>cleanupEfficiency <input type=checkbox bind:checked={cleanup_efficiency}></label>
  <label>EditCost <input type=number bind:value={edit_cost}></label>
</section>

<h2>قبل</h2>
<textarea bind:value={a}></textarea>
<h2>بعد</h2>
<textarea bind:value={b}></textarea>

<section class=diff-cont dir=auto>
  {#each diff_data as [op, text]}
    {#if op == DiffMatchPatch.DIFF_INSERT}
      <ins>{text}</ins>
    {:else if op == DiffMatchPatch.DIFF_DELETE}
      <del>{text}</del>
    {:else if op == DiffMatchPatch.DIFF_EQUAL}
      <span>{text}</span>
    {/if}
  {/each}
</section>

<div hidden><ins class=active></ins><del class=active></del></div>

<script>
import * as DiffMatchPatch from 'diff-match-patch';

let a = '';
let b = '';
let timeout = 30;
let cleanup_semantic = true;
let cleanup_efficiency = false;
let edit_cost = 4;

const dmp = new DiffMatchPatch.diff_match_patch();

$: diff_data = get_diff(a, b, {edit_cost, timeout, cleanup_semantic, cleanup_efficiency});
function get_diff(a, b) {
    dmp.Diff_EditCost = edit_cost;
    dmp.Diff_Timeout = timeout;
    const diff = dmp.diff_main(a, b);
    if (cleanup_semantic)
        dmp.diff_cleanupSemantic(diff);
    if (cleanup_efficiency)
        dmp.diff_cleanupEfficiency(diff);
    return diff;
}
</script>

<style>
section.diff-cont {
  border: 1px solid grey;
  white-space: pre-line;
  height: 100%;
  overflow: auto;

  padding: 0.2rem 0.3rem;
  border-radius: 3px;
  background-color: #fff;
  max-width: 800px;
  line-height: 1.7;
}
ins { background: #e6ffe6; color: green; }
del { background: #ffe6e6 }
ins, del {
  text-decoration: none;
  transition: background-color 200ms, padding 200ms;
}
ins.active, del.active {
  background-color: orange !important;
  padding: 0.2rem 0.5rem;
}
input[type=number] {
  max-width: 3rem;
}
</style>
