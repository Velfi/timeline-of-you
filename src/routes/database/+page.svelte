<script lang="ts">
  import { browser } from '$app/environment';
  import { deleteDatabase, db, exportTimelineToJSON, getTimelineMetadataList } from '$lib/db';
  import { notifications } from '$lib/stores';
  import { onMount } from 'svelte';
  import type { Metadata, Event, Tag } from '$lib/db/v1';
  import DateTime from '$lib/components/DateTime.svelte';

  let timelineCount = 0;
  let eventCount = 0;
  let tagCount = 0;
  let orphanedEvents = 0;
  let orphanedTags = 0;
  let isExporting = false;

  async function updateDatabaseState() {
    if (!browser) return;

    timelineCount = await db.metadata.count();
    eventCount = await db.events.count();
    tagCount = await db.tags.count();

    // Find orphaned events (events not referenced by any timeline)
    const allEvents = await db.events.toArray();
    const allTimelines = await db.metadata.toArray();
    const referencedEventIds = new Set(allTimelines.flatMap((t: Metadata) => t.eventIds || []));
    orphanedEvents = allEvents.filter(
      (e: Event) => e.id !== undefined && !referencedEventIds.has(e.id)
    ).length;

    // Find orphaned tags (tags not referenced by any event)
    const allTags = await db.tags.toArray();
    const referencedTagIds = new Set(allEvents.flatMap((e: Event) => e.tagIds || []));
    orphanedTags = allTags.filter(
      (t: Tag) => t.id !== undefined && !referencedTagIds.has(t.id)
    ).length;
  }

  onMount(() => {
    updateDatabaseState();
  });

  async function handleDelete() {
    if (
      browser &&
      confirm(
        'Are you absolutely sure you want to delete your database? This action is irreversible.'
      )
    ) {
      try {
        await deleteDatabase();
        notifications.add('success', 'Successfully deleted database');
        await updateDatabaseState();
      } catch (e) {
        notifications.add('error', 'Failed to delete database');
      }
    }
  }

  async function cleanUpOrphanedEvents() {
    if (!browser) return;

    try {
      const allEvents = await db.events.toArray();
      const allTimelines = await db.metadata.toArray();
      const referencedEventIds = new Set(allTimelines.flatMap((t: Metadata) => t.eventIds || []));
      const orphanedEventIds = allEvents
        .filter((e: Event) => e.id !== undefined && !referencedEventIds.has(e.id))
        .map((e: Event) => e.id as number);

      if (orphanedEventIds.length === 0) {
        notifications.add('info', 'No orphaned events found');
        return;
      }

      await db.events.bulkDelete(orphanedEventIds);
      notifications.add(
        'success',
        `Successfully deleted ${orphanedEventIds.length} orphaned events`
      );
      await updateDatabaseState();
    } catch (e) {
      notifications.add('error', 'Failed to clean up orphaned events');
    }
  }

  async function cleanUpOrphanedTags() {
    if (!browser) return;

    try {
      const allTags = await db.tags.toArray();
      const allEvents = await db.events.toArray();
      const referencedTagIds = new Set(allEvents.flatMap((e: Event) => e.tagIds || []));
      const orphanedTagIds = allTags
        .filter((t: Tag) => t.id !== undefined && !referencedTagIds.has(t.id))
        .map((t: Tag) => t.id as number);

      if (orphanedTagIds.length === 0) {
        notifications.add('info', 'No orphaned tags found');
        return;
      }

      await db.tags.bulkDelete(orphanedTagIds);
      notifications.add('success', `Successfully deleted ${orphanedTagIds.length} orphaned tags`);
      await updateDatabaseState();
    } catch (e) {
      notifications.add('error', 'Failed to clean up orphaned tags');
    }
  }

  async function exportDatabase() {
    if (!browser) return;

    try {
      isExporting = true;
      const timelines = await getTimelineMetadataList();
      const exports = await Promise.all(
        timelines.map((timeline) => exportTimelineToJSON(timeline.id as number))
      );

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        timelines: exports.map((json) => JSON.parse(json)),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.add('success', 'Successfully exported database');
    } catch (e) {
      notifications.add('error', 'Failed to export database');
      console.error('Export failed:', e);
    } finally {
      isExporting = false;
    }
  }
</script>

<h1>Manage your in-browser database</h1>
<div class="container">
  <p>
    This app saves timelines, events, and tags in your browser using something called <a
      href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"
      rel="noreferrer">IndexedDB</a
    >. You can use this page to clear your database if you want to start over.
  </p>
  <p>
    It's also possible to view database states here and run cleanup if your database has tags or
    events that aren't associated with a timeline.
  </p>

  <h2>Database state</h2>
  <div class="database-state">
    <p>Timelines: {timelineCount}</p>
    <p>Events: {eventCount}</p>
    <p>Tags: {tagCount}</p>
    <p>Orphaned events: {orphanedEvents}</p>
    <p>Orphaned tags: {orphanedTags}</p>
    {#if browser}
      <p>Last updated: <DateTime date={new Date()} format="relative" /></p>
    {/if}
  </div>

  <h2>Database Export</h2>
  <p>
    Export your entire database as a JSON file. This includes all timelines, their events, and tags.
    You can use this file to backup your data or transfer it to another device.
  </p>
  <button type="button" on:click={exportDatabase} disabled={isExporting}>
    {isExporting ? 'Exporting...' : 'Export database'}
  </button>

  <h2>The Danger Zone</h2>
  <p>Actions in this section are <strong>irreversible</strong>. <em>Please be careful.</em></p>
  <div class="irreversible-actions">
    <button type="button" class="error" on:click={handleDelete}>Delete database</button>
    <p>
      This will <strong>delete</strong> your entire database including all timelines, their events, and
      tags associated with those events.
    </p>
    <button type="button" class="error" on:click={cleanUpOrphanedEvents}
      >Clean up orphaned events</button
    >
    <p>
      This will find all events that aren't associated with a timeline and delete them. Why would
      the database include events not associated with a timeline? Bugs mostly. I'm only human and I
      make mistakes.
    </p>
    <button type="button" class="error" on:click={cleanUpOrphanedTags}
      >Clean up orphaned tags</button
    >
    <p>
      This will find all events that aren't associated with a timeline and delete them. Why would
      the database include events not associated with a timeline? Same as the above. I make
      mistakes.
    </p>
  </div>
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

  .error {
    border-color: var(--color-accent-1);
  }

  .irreversible-actions {
    display: grid;
    grid-template-columns: max-content 3fr;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--color-bg-1);
    border-radius: var(--border-radius);
    border: var(--border);

    & > p {
      margin-bottom: 0;
    }

    & > button {
      margin-top: 0.4rem;
    }
  }

  .database-state {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
    padding: 1rem;
    background-color: var(--color-bg-1);
    border-radius: var(--border-radius);
    border: var(--border);

    p {
      margin: 0;
      padding: 0.5rem;
      background-color: var(--color-bg-0);
      border-radius: var(--border-radius);
      border: var(--border);
    }
  }
</style>
