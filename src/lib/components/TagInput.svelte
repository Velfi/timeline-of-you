<script lang="ts">
  import { VALID_TAG_NAME_REGEX } from '$lib/db/v1/tag';
  import { notifications } from '$lib/stores';
  import Icon from '@iconify/svelte';

  export let required = false;
  export let value: string[] = [];
  let newTag = '';
  $: isValid = VALID_TAG_NAME_REGEX.test(formatTag(newTag));

  const clearTags = () => {
    value = [];
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    if (newTag.length > 0 && isValid) {
      const formattedTag = formatTag(newTag);

      if (value.includes(formattedTag)) {
        notifications.add('warn', `Tag "${formattedTag}" already exists. Try another.`);
        return;
      }

      value = [...value, formattedTag];
      newTag = '';
    }
  };

  function deleteTag(tag: string) {
    value = value.filter((t) => t !== tag);
  }

  function formatTag(name: string) {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }
</script>

<div class="container">
  <label for="tag-input">Tags</label>
  <div class="input-wrapper">
    <input type="text" name="tag-input" {required} bind:value={newTag} on:keydown={onKeydown} />
    <div class="buttons">
      <button type="button" on:click={addTag} disabled={!isValid || newTag.length === 0}
        >Add Tag</button
      >
      <button type="button" on:click={clearTags} disabled={value.length === 0}>Clear Tags</button>
    </div>
  </div>

  {#if value.length > 0}
    <div class="tags">
      {#each value as tag}
        <div class="tag">
          <span>#{tag}</span><button
            title={`Remove tag "${tag}"`}
            class="icon-button"
            type="button"
            on:click={() => deleteTag(tag)}><Icon icon="ic:round-clear" /></button
          >
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  input {
    font-size: inherit;
    margin: 0 1rem 0 0;
    height: var(--input-height);
    padding: var(--input-padding);
    box-sizing: border-box;
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

  .buttons {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;
    white-space: nowrap;
  }

  .tags {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-top: var(--input-padding);
    gap: 0.5rem;
  }

  .tag {
    border-radius: var(--border-radius);
    background-color: #1d2727;
    display: flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    height: 1rem;
    font-size: 90%;

    & > span {
      margin-bottom: 0.4rem;
    }
  }

  .icon-button {
    border: none;
    padding: 0;
    margin: 0;
    margin-left: 0.2rem;
    height: 1rem;
    width: 1rem;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
