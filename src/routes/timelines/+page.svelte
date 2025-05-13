<script lang="ts">
  import Icon from '@iconify/svelte';
  import { notifications, timeline } from '$lib/stores';
  import { downloadJSONFile } from '$lib/utils';
  import {
    deleteTimelineById,
    exportTimelineToJSON,
    getTimelineMetadataList,
    type TimelineMetadata,
  } from '$lib/db';
  import { onMount } from 'svelte';

  let timelineList: TimelineMetadata[] = [];

  onMount(async () => {
    timelineList = await getTimelineMetadataList();
  });

  async function handleExport(e: MouseEvent) {
    if (e.target !== null && e.target instanceof HTMLButtonElement) {
      const { id, name } = e.target.dataset;

      if (id === undefined) {
        throw new Error(
          'handleExport was called but event target had no ID. If you encounter this error, please report it.'
        );
      }

      const t = await exportTimelineToJSON(parseInt(id, 10));
      const fileName = `${name ?? 'timeline'}.json`;

      downloadJSONFile(t, fileName);
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

      await deleteTimelineById(parseInt(id, 10))
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

      timelineList = await getTimelineMetadataList();
    }
  }

  function handleLoadTimeline(
    event: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement }
  ) {
    const { id } = event.currentTarget.dataset;
    if (id) {
      timeline.loadFromDb(parseInt(id, 10));
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
    {#each timelineList as t}
      <li>
        <div class="timeline">
          <a href="/timeline/{t.id}" data-id={t.id} on:click={handleLoadTimeline}>{t.name}</a>
          <div class="actions">
            <a
              href={`/timeline/${t.id}/quick-add-events`}
              data-id={t.id}
              on:click={handleLoadTimeline}>Quick Add Events</a
            >
            <a href="/timeline/{t.id}/events" data-id={t.id} on:click={handleLoadTimeline}
              >Events List</a
            >
            <button data-id={t.id} data-name={t.name} on:click={handleExport} type="button"
              >Export&nbsp;<Icon icon="mdi:file-export-outline" /></button
            >
            <button data-id={t.id} data-name={t.name} on:click={handleDelete} type="button"
              >Delete&nbsp;<Icon icon="mdi:delete-forever-outline" /></button
            >
          </div>
        </div>
      </li>
    {/each}
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
    max-width: 50rem;
    text-align: justify;
  }

  .timeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    button {
      display: flex;
      align-items: center;
      height: unset;
      border: none;
      border-radius: 0;
      padding: 0 0 0 0.5rem;
    }
  }

  .icon {
    font-size: 1.5rem;
    margin-right: 0.5rem;
  }
</style>
