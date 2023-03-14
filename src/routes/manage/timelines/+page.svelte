<script lang="ts">
  import { db, type Timeline } from '$lib/db';
  import { liveQuery, type Observable } from 'dexie';
  import { browser } from '$app/environment';
  import { downloadJSONFile } from '$lib/utils';
  import Icon from '@iconify/svelte';

  $: timelines = liveQuery(() => (browser ? db.timelines.toArray() : []));

  async function handleExport(e: MouseEvent) {
    if (
      e.target !== null &&
      e.target instanceof HTMLButtonElement &&
      e.target.dataset.id !== undefined
    ) {
      const id = e.target.dataset.id;
      const timeline = await db.timelines.get(parseInt(id, 10));

      if (timeline !== undefined) {
        const name = `${timeline.name ?? 'timeline'}.json`;
        downloadJSONFile(timeline, name, true);
      } else {
        throw new Error('If you encounter this error, please report it.');
      }
    }
  }

  function handleDelete(e: MouseEvent) {
    if (e.target !== null && e.target instanceof HTMLButtonElement) {
      const id = e.target.dataset.id;

      if (id !== undefined) {
        db.timelines.delete(id);
      }
    }
  }
</script>

<div class="container">
  <h1>Manage your timelines</h1>

  <p>
    This is a list of your saved timelines. You can export, load, or delete timelines by clicking
    the appropriate buttons. You can also create a new timeline by clicking the link at the bottom.
  </p>

  <ul>
    {#if $timelines}
      {#each $timelines as t}
        <li>
          <div class="timeline">
            <a href="/timeline/{t.id}">{t.name}</a>
            <div class="actions">
              <button data-id={t.id} on:click={handleExport} type="button"
                >Export&nbsp;<Icon icon="mdi:file-export-outline" /></button
              >
              <button data-id={t.id} on:click={handleDelete} type="button"
                >Delete&nbsp;<Icon icon="mdi:delete-forever-outline" /></button
              >
            </div>
          </div>
        </li>
      {/each}
    {/if}
    <li>
      <a href="/new/timeline">
        <span class="icon">+</span>
        <span>Create a new timeline</span>
      </a>
    </li>
  </ul>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    max-width: 40rem;
    text-align: justify;
  }

  .timeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .actions {
    display: flex;

    button {
      display: flex;
      border: none;
      border-radius: 0;
    }
  }
</style>
