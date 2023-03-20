<script lang="ts">
  import { browser } from '$app/environment';
  import { deleteDatabase } from '$lib/db';
  import { notifications } from '$lib/stores';

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
      } catch (e) {
        notifications.add('error', 'Failed to delete database');
      }
    }
  }

  async function cleanUpOrphanedEvents() {
    alert('This is not implemented yet.');
  }

  async function cleanUpOrphanedTags() {
    alert('This is not implemented yet.');
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
  <p>TODO</p>

  <h2>Database Export</h2>
  <p>Someday, when I have time, I'll implement this.</p>

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
    border-color: crimson;
  }

  .irreversible-actions {
    display: grid;
    grid-template-columns: max-content 3fr;
    gap: 1rem;

    & > p {
      margin-bottom: 0;
    }

    & > button {
      margin-top: 0.4rem;
    }
  }
</style>
