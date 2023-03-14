<script lang="ts">
  export let required = false;
  export let value: string[] = ['default'];

  const handleChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    let newTag = input.value;
    if (newTag.startsWith('#')) {
      newTag = newTag.slice(1);
    }

    value.push(newTag);
    input.value = '';
    // This is necessary to trigger a re-render
    value = [...value];
  };

  const clearTags = () => {
    value = [];
  };
</script>

<div class="container">
  <label for="tag-input">Tags</label>
  <div class="input-wrapper">
    <input type="text" name="tag-input" {required} on:change={handleChange} />
    <button type="button" on:click={clearTags} disabled={value.length === 0}>reset</button>
  </div>

  {#if value.length > 0}
    <div>
      {#each value as tag, index}
        <span class="tag">#{tag}</span>
        {#if index !== value.length - 1}&nbsp;{/if}
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background-color: #1d2727;
  }

  input {
    font-size: inherit;
  }

  .container {
    display: flex;
    flex-direction: column;
    min-height: 4rem;
  }

  .input-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  button {
    padding: 0.5rem 2rem;
  }
</style>
