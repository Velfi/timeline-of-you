<script lang="ts">
  import { nanoid } from 'nanoid';

  export let required = false;
  export let label = '';
  export let explanation = '';
  export let value = '';
  export let placeholder = '';
  export let textarea = false; 

  const name = nanoid();
</script>

<label for={name}
  >{label}{#if required}*{:else}<span>&nbsp;(optional)</span>{/if}</label
>
{#if textarea}
  <textarea name={name} {required} {placeholder} bind:value />
{:else}
  <input type="text" name={name} {required} {placeholder} bind:value />
{/if}
{#if explanation}
  <p>{explanation}</p>
{/if}

<style lang="scss">
  label > span {
    font-size: 0.8em;
    color: #bbb;
  }

  input {
    min-height: 2rem;
  }
</style>
