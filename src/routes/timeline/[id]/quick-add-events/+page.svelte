<script lang="ts">
  import TagInput from '$lib/components/TagInput.svelte';
  import type { Event } from '$lib/db';
  import { DateTime } from '$lib/types/date';

  let start = '';
  let end = '';
  let name = '';
  let description = '';
  let tags: string[] = [];

  let newEvents: Event[] = [];

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    newEvents.push({
      start: new DateTime(parseInt(start, 10)),
      end: end.length > 0 ? new DateTime(parseInt(end, 10)) : undefined,
      name,
      description: description.length > 0 ? description : undefined,
      tags,
      createdOn: new Date(),
      lastModified: new Date(),
    });

    start = '';
    end = '';
    name = '';
    description = '';
    tags = [];
  }

  function handleSave() {
    // TODO save events to the database
  }
</script>

<h1>Add a new event to the timeline</h1>

<div class="container">
  <form class="new-event" on:submit={handleSubmit}>
    <label class="start">
      Start*
      <input type="date" required bind:value={start} />
    </label>
    <label class="end">
      End
      <input type="date" bind:value={end} />
    </label>
    <label class="name">
      Name*
      <input type="text" required bind:value={name} />
    </label>
    <label class="description">
      Description
      <textarea bind:value={description} />
    </label>
    <div class="tags">
      <TagInput bind:value={tags} />
    </div>
    <button class="add">Add</button>
  </form>
  <div class="about">
    <h2>How this works</h2>
    <p>
      Add events by filling out the form to the left. Once you're done, click the "Save Events"
      button to save them to your timeline.
    </p>
    <button
      class="save-events"
      disabled={newEvents.length === 0}
      type="button"
      on:click={handleSave}>Save Events</button
    >
  </div>
  <div class="events">
    <h2>Events</h2>
    <ul>
      {#each newEvents as event}
        <li>
          <i>
            ({event.start}{#if event.end}-{event.end}{/if})
          </i>
          {event.name}{#if event.description}&nbsp;&mdash;&nbsp;{event.description}{/if}
        </li>
      {/each}
    </ul>
  </div>
</div>

<style lang="scss">
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas:
      'form about'
      'events events';
    column-gap: 2rem;
    margin: 1rem;
  }

  .about {
    grid-area: about;
    display: grid;
    grid-template-rows: min-content auto max-content;
    height: 100%;
  }

  .new-event {
    grid-area: form;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr auto 2fr auto;
    grid-template-areas:
      'start end'
      'name name'
      'description description'
      'tags tags'
      'button button';
    column-gap: 1rem;
    row-gap: 0.5rem;
  }

  button:not(:disabled) {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  .save-events,
  .add {
    width: 100%;
    height: 3rem;
  }

  .events {
    grid-area: events;
  }

  input,
  textarea {
    width: 100%;
    font-size: inherit;
    font-family: inherit;
  }

  .start {
    grid-area: start;
  }

  .end {
    grid-area: end;
  }

  .name {
    grid-area: name;
  }

  .description {
    grid-area: description;
  }

  .tags {
    grid-area: tags;
  }

  .add {
    grid-area: button;
  }
</style>
