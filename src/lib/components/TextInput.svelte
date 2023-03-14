<script lang="ts">
  import { nanoid } from 'nanoid';

  export let required = false;
  export let label = '';
  export let explanation = '';
  export let value = '';
  export let placeholder = '';

  const name = nanoid();
</script>

<label for={name}
  >{label}{#if required}*{:else}<span>&nbsp;(optional)</span>{/if}</label
>
<input type="text" {name} {required} {placeholder} bind:value />
{#if explanation}
  <p>{explanation}</p>
{/if}

<style lang="scss">
  label {
    display: flex;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  label > span {
    font-size: 0.8em;
    color: #bbb;
  }

  input {
    min-height: 2rem;
  }
</style>
