<script lang="ts">
  import Icon from '@iconify/svelte';

  export let title: string | undefined = undefined;
  export let text: string | undefined = undefined;
  export let icon: string;
  export let disabled = false;
  export let borderless = false;
</script>

<button {title} {disabled} class:borderless on:click>
  <Icon {icon} />{#if text}&nbsp;{text}{/if}
</button>

<style lang="scss">
  button {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: inherit;
    color: var(--color-text);
    border: var(--border);
    border-radius: var(--border-radius);
    padding: 0.5rem;
    cursor: pointer;
  }

  button.borderless {
    border: none;
  }
</style>
