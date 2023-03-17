<script lang="ts">
  import DateTimeInput from '$lib/components/datetime/DateTimeInput.svelte';
  import TagInput from '$lib/components/TagInput.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import type { Event, Metadata } from '$lib/db';
  import { notifications } from '$lib/stores';
  import { DateTime } from '$lib/types/date';
  import * as stores from '$lib/stores';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import ShortEvent from '$lib/components/ShortEvent.svelte';
  import { get, writable } from 'svelte/store';

  let metadata: Metadata | undefined;
  let events: Event[] | undefined;

  let start: DateTime | undefined;
  let end: DateTime | undefined;
  let name = '';
  let description = '';
  let tags: string[] = [];
  let isLoading = true;
  let saveButtonTitle = '';
  let saveButtonIsDisabled = false;
  let newEvents = writable<Event[]>([]);

  // TODO I feel like I shouldn't have to create a store to do this but I couldn't get it to work otherwise.
  newEvents.subscribe((e) => {
    saveButtonTitle =
      e.length > 0
        ? `Save ${e.length} events to the timeline.`
        : 'You must add at least one event before saving.';
    saveButtonIsDisabled = e.length === 0;
  });

  stores.timeline.isLoading.subscribe((l) => {
    isLoading = l;
  });

  stores.timeline.metadata.subscribe((t) => {
    // When no timeline is loaded or loading, reroute to the timeline management page
    if (!t && !isLoading && browser) {
      goto('/manage/timelines');
    }
    metadata = t;
  });

  stores.timeline.events.subscribe((e) => {
    events = e;
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (start === undefined || name.length === 0) {
      notifications.add('error', 'The "start" and "name" fields are required');

      return;
    }

    newEvents.update((it) => {
      // This can't happen but TS doesn't know that
      if (start !== undefined) {
        const e = {
          start,
          end,
          name,
          description: description.length > 0 ? description : undefined,
          tags,
          createdOn: new Date(),
          lastModified: new Date(),
        };
        console.log('Adding event to newEvents: ', e);

        it.push(e);
      }

      return it;
    });

    start = undefined;
    end = undefined;
    name = '';
    description = '';
    tags = [];
  }

  async function handleSave() {
    await stores.timeline.addEvents(get(newEvents));
    newEvents.set([]);
  }
</script>

<h1>Add a new event to the timeline</h1>

<div class="container">
  <form on:submit={handleSubmit}>
    <div><DateTimeInput bind:value={start} label="Start*" required /></div>
    <div><DateTimeInput bind:value={end} label="End" /></div>
    <div>
      <TextInput label="Name" placeholder="My new timeline" required bind:value={name} />
    </div>
    <div>
      <TextInput
        textarea
        label="Description"
        placeholder="A timeline tracking the major events in my life."
        bind:value={description}
      />
    </div>
    <div>
      <TagInput bind:value={tags} />
    </div>
    <button class="add">Add</button>
  </form>
  <div class="about">
    <div>
      <h2>How this works</h2>
      <p>
        Add events by filling out the form to the left. Once you're done, click the "Save Events"
        button to save them to your timeline. Once you're done adding events, <a href="/timeline"
          >click here go see them in your timeline.</a
        >
      </p>
      {#if metadata}
        <h2>Current Timeline</h2>
        <p><b>Name:</b></p>
        <p class="indent">{metadata.name}</p>
        <p><b>Description:</b></p>
        <p class="indent">{metadata.description}</p>
      {:else}
        No timeline is loaded.
      {/if}
    </div>
    <button
      class="save-events"
      disabled={saveButtonIsDisabled}
      title={saveButtonTitle}
      type="button"
      on:click={handleSave}>Save Events</button
    >
  </div>
  <div class="events">
    <h2>{$newEvents.length} New Events</h2>
    {#if $newEvents.length === 0}
      <p><i>Start adding events using the above form and they'll show up down here.</i></p>
    {:else}
      <ul>
        {#each $newEvents as event}
          <li>
            <ShortEvent {event} />
          </li>
        {/each}
      </ul>
    {/if}

    {#if events !== undefined && events.length > 0}
      <h2>{events.length} Existing Events</h2>
      <ul>
        {#each events as event}
          <li>
            <i>
              ({event.start}{#if event.end}-{event.end}{/if})
            </i>
            {event.name}{#if event.description}&nbsp;&mdash;&nbsp;{event.description}{/if}
          </li>
        {/each}
      </ul>
    {/if}
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
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    & > div > p {
      margin-bottom: 0.5rem;
    }
  }

  form {
    grid-area: form;
    display: flex;
    flex-direction: column;

    & > *:not(:last-child) {
      margin-bottom: 1rem;
    }

    & > div {
      display: flex;
      flex-direction: column;
    }
  }

  .save-events,
  .add {
    width: 100%;
    height: 3rem;
  }

  .events {
    grid-area: events;
  }
</style>