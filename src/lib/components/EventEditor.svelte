<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TimelineEvent } from '$lib/db';
  import { timeline } from '$lib/stores/timeline';
  import DateTimeInput from './datetime/DateTimeInput.svelte';
  import { notifications } from '$lib/stores';

  export let event: TimelineEvent;
  export let isOpen = false;

  // Create a working copy to avoid mutating the original until save
  let editedEvent = {
    name: event.name,
    description: event.description || '',
    start: event.start,
    end: event.end,
  };

  const dispatch = createEventDispatcher<{
    close: void;
    save: { event: TimelineEvent };
    delete: void;
  }>();

  function saveChanges() {
    // Update the event with edited values
    const updatedEvent = {
      ...event,
      name: editedEvent.name,
      description: editedEvent.description,
      start: editedEvent.start,
      end: editedEvent.end,
      lastModified: new Date(),
    };

    dispatch('save', { event: updatedEvent });
    isOpen = false;
  }

  function cancel() {
    // Reset to original values
    editedEvent = {
      name: event.name,
      description: event.description || '',
      start: event.start,
      end: event.end,
    };

    dispatch('close');
    isOpen = false;
  }

  async function handleDelete() {
    if (!event.id) {
      notifications.add('error', 'Cannot delete an unsaved event');
      return;
    }

    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await timeline.deleteEvent(event.id);
      await timeline.saveToDb();
      dispatch('delete');
      isOpen = false;
      notifications.add('success', 'Event deleted successfully');
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop">
    <div class="modal">
      <header>
        <h2>Edit Event</h2>
        <button class="close-button" on:click={cancel}>&times;</button>
      </header>

      <div class="modal-content">
        <div class="form-group">
          <label for="event-name">Event Name</label>
          <input
            id="event-name"
            type="text"
            bind:value={editedEvent.name}
            placeholder="Event name"
          />
        </div>

        <div class="form-group">
          <label for="event-description">Description</label>
          <textarea
            id="event-description"
            bind:value={editedEvent.description}
            placeholder="Brief description"
            rows="2"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="event-start">Start Date/Time</label>
          <DateTimeInput id="event-start" bind:value={editedEvent.start} required={true} />
        </div>

        <div class="form-group">
          <label for="event-end">End Date/Time (Optional)</label>
          <DateTimeInput id="event-end" bind:value={editedEvent.end} />
        </div>
      </div>

      <footer>
        <button class="delete-button" on:click={handleDelete}>Delete</button>
        <button class="cancel-button" on:click={cancel}>Cancel</button>
        <button class="save-button" on:click={saveChanges}>Save Changes</button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background-color: var(--color-bg-1);
    border-radius: var(--border-radius);
    border: var(--border);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  header {
    padding: 16px;
    border-bottom: var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-text);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-theme-2);
    padding: 0;
    height: auto;
  }

  .modal-content {
    padding: 16px;
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--color-text);
  }

  input,
  textarea {
    width: 400px;
    padding: var(--input-padding);
    border: var(--border);
    border-radius: var(--border-radius);
    font-family: inherit;
    font-size: inherit;
    background: var(--color-bg-0);
    color: var(--color-text);
  }

  textarea {
    resize: vertical;
  }

  footer {
    padding: 16px;
    border-top: var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  button {
    padding: var(--input-padding);
    border-radius: var(--border-radius);
    font-size: inherit;
    cursor: pointer;
  }

  .delete-button {
    background-color: var(--color-error, #ff4444);
    border: none;
    color: var(--color-bg-0);
  }

  .delete-button:hover {
    background-color: var(--color-error-hover, #ff6666);
  }

  .cancel-button {
    background-color: var(--color-bg-0);
    border: var(--border);
    color: var(--color-text);
  }

  .save-button {
    background-color: var(--color-accent-1);
    border: none;
    color: var(--color-bg-0);
  }

  .save-button:hover {
    background-color: var(--color-accent-2);
  }

  .cancel-button:hover {
    background-color: var(--color-bg-1);
  }
</style>
