<script>
let in_text = '';
$: in_text = in_text.normalize('NFC');
</script>

<textarea bind:value={in_text}></textarea><br>
