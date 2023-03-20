<script lang="ts">
  import TextInput from '$lib/components/TextInput.svelte';
  import BeginningAndEndInput from '$lib/components/datetime/BeginningAndEndInput.svelte';
  import type { DateTime } from '$lib/types/date';
  import { goto } from '$app/navigation';
  import { notifications, timeline } from '$lib/stores';
  import { createTimeline } from '$lib/db';

  let start: DateTime | undefined;
  let end: DateTime | undefined;
  let name = '';
  let description = '';

  $: formIsIncomplete = start === undefined || end === undefined || start.year > end.year;

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (start === undefined || end === undefined) {
      throw new Error('unreachable');
    }

    const newTimelineId = await createTimeline(start, end, name, description);
    await timeline.loadFromDb(newTimelineId);

    notifications.add(
      'success',
      `Timeline "${name === '' ? '(unnamed)' : name}" created successfully`
    );
    // After successfully saving the timeline, redirect to the manage page.
    goto(`/manage/timelines`);
  }
</script>

<h1>Start a new timeline</h1>

<div class="container">
  <p>
    Start a new timeline by entering the start and end dates. You can also add a title and a note.
    Once you're ready, click the save button.
  </p>
  <form on:submit={handleSubmit}>
    <div class="beginning-and-end">
      <BeginningAndEndInput required bind:start bind:end />
    </div>
    <div class="name">
      <TextInput label="Give your timeline a name" placeholder="My life" bind:value={name} />
    </div>
    <div class="description">
      <TextInput
        label="Give your timeline a description"
        placeholder="This is a timeline of my life"
        bind:value={description}
      />
    </div>
    <button class="save" disabled={formIsIncomplete}>Save</button>
  </form>
</div>

<style lang="scss">
  button {
    width: 100%;
  }

  form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 2rem;
    column-gap: 2rem;
    grid-template-areas:
      'beginning-and-end beginning-and-end'
      'title description'
      'save save';
    justify-items: stretch;
  }

  .beginning-and-end {
    grid-area: beginning-and-end;
  }

  .name {
    grid-area: title;
  }

  .description {
    grid-area: description;
  }

  .name,
  .description {
    display: flex;
    flex-direction: column;
  }

  .save {
    grid-area: save;
  }
</style>
