<script lang="ts">
  import { db, deleteTimelineById } from '$lib/db';
  import { liveQuery } from 'dexie';
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { notifications, timeline } from '$lib/stores';
  import { exportTimelineById } from '$lib/db/export';
  import { downloadJSONFile } from '$lib/utils';

  $: timelines = liveQuery(() => (browser ? db.timelines.toArray() : []));

  async function handleExport(e: MouseEvent) {
    if (
      e.target !== null &&
      e.target instanceof HTMLButtonElement &&
      e.target.dataset.id !== undefined
    ) {
      const t = await exportTimelineById(e.target.dataset.id);
      const name = `${t.metadata.name ?? 'timeline'}.json`;

      downloadJSONFile(t, name, true);
    }
  }

  async function handleDelete(e: MouseEvent) {
    if (e.target !== null && e.target instanceof HTMLButtonElement) {
      const { id, name } = e.target.dataset;

      if (id === undefined) {
        throw new Error(
          'handleDelete was called but event target had no ID. If you encounter this error, please report it.'
        );
      }

      await deleteTimelineById(id)
        .then(() => {
          const message = 'Successfully deleted timeline';
          name ?? message.concat(` "${name}"`);
          notifications.add('success', message);
        })
        .catch(() => {
          const message = 'Failed to delete timeline';
          name ?? message.concat(` "${name}"`);
          notifications.add('error', message);
        });
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
            <a href="/timeline" on:click={() => timeline.loadFromDb(t.id)}>{t.name}</a>
            <div class="actions">
              <a href="/timeline/quick-add-events" on:click={() => timeline.loadFromDb(t.id)}>Add Events</a>
              <button data-id={t.id} on:click={handleExport} type="button"
                >Export&nbsp;<Icon icon="mdi:file-export-outline" /></button
              >
              <button data-id={t.id} data-name={t.name} on:click={handleDelete} type="button"
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
    <li>
      <a href="/import/json">
        <span class="icon">+</span>
        <span>Import a timeline from a JSON file</span>
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
  }

  .actions {
    display: flex;

    button {
      display: flex;
      border: none;
      border-radius: 0;
    }
  }

  .icon {
    font-size: 1.5rem;
    margin-right: 0.5rem;
  }

  ul > li:not(:last-child) {
    margin-bottom: 0.5rem;
  }
</style>
