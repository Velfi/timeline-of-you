<script lang="ts">
  import Icon from '@iconify/svelte';
  import { timeline } from '$lib/stores';

  export let open = false;
  $: isSaving = false;
  let hasChanges = false;
  let timelineId: number | undefined = undefined;

  timeline.hasChanges.subscribe((c) => {
    hasChanges = c;
  });

  timeline.timeline.subscribe((t) => {
    timelineId = t?.id;
  });

  function toggle() {
    // TODO actually make this accessible. Right now, it'll lose focus on the button whenever toggled.
    open = !open;
  }

  function keyboardToggle(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      toggle();
    }
  }

  async function saveTimeline() {
    console.log('Saving timeline');
    isSaving = true;
    await timeline.saveToDb();
    isSaving = false;
    console.log('Saved timeline');
  }
</script>

<!-- <svelte:window on:beforeunload={beforeunload} /> -->

<div class="container">
  {#if open}
    <div class="content">
      <div class="header">
        <button type="button" on:click={toggle} class="close" title="Close the hamburger menu"
          ><Icon font-size="3rem" icon="mdi:robot-confused-outline" /></button
        >
        <h1>A Timeline of Us</h1>
        <p class="visually-hidden">Press escape to close this menu.</p>
      </div>

      <details class="menu-pane">
        <summary>About</summary>

        <p>
          A tool for creating a persistent timeline of your life, ending with your likely date of
          death. You can add events in the past and future, filter events based on labels, and
          search for specific events too.
        </p>

        <p>
          The timeline can be panned and zoomed, and works on desktop or on mobile. You can export
          your timeline for safekeeping or to share it with someone.
        </p>

        <p>
          This software is free and the source code is viewable on <a
            href="https://github.com/Velfi/timeline-of-you">GitHub</a
          >. You are free to host your own timeline on your own website. If you have feature
          requests, bug reports, or other comments, please
          <a href="https://github.com/Velfi/timeline-of-you/issues/new"
            >submit them through GitHub</a
          >.
        </p>
      </details>
      <details class="menu-pane">
        <summary>Help</summary>
        <p>
          This is a new timeline. Start by entering your date of birth and the date you <a
            href="https://www.death-clock.org/">expect to die</a
          >.
        </p>
        <h2>Adding events to the timeline:</h2>
        <ol>
          <li>Decide on a life event that you want to add to the timeline.</li>
          <li>
            Click the date in the timeline where you want to add the event. You can change the date
            after creating the event, so don't worry if the date is slightly off.
          </li>
          <li>Enter that event's information and click "confirm"</li>
        </ol>
        <h2>Deleting events from the timeline:</h2>
        <p>
          Select an event and click the "delete" button. Then, confirm you want to delete the event.
        </p>
      </details>
      <details open class="menu-pane">
        <summary>Menu</summary>
        {#if hasChanges}
          <p>Your timeline has changes! Save them if you don't want to lose them.</p>
          <button type="button" disabled={isSaving} on:click={saveTimeline}
            >{#if isSaving}Now Saving...{:else}Save Active Timeline{/if}</button
          >
        {/if}
        <ul>
          <li><a href="/manage/timelines">Manage Timelines</a></li>

          {#if timelineId}
            <li><a href="/timeline">View Current Timeline</a></li>
            <li><a href="/timeline/quick-add-events">Quickly Add Events</a></li>
          {/if}
          <li><a href="/new/timeline">Create New Timeline</a></li>
          <li><a href="/import/json">Import a timeline from a JSON file</a></li>
        </ul>
      </details>
    </div>
  {:else}
    <button type="button" on:click={toggle} class="open" title="Open the hamburger menu"
      ><Icon font-size="3rem" icon="mdi:robot-confused" /></button
    >
  {/if}
</div>
{#if open}
  <div class="overlay" on:click={toggle} on:keypress={keyboardToggle} />
{/if}

<style lang="scss">
  button {
    cursor: pointer;
    padding: 0.5rem;
    height: 4rem !important;
  }

  .open {
    margin: 1rem;
    background-color: var(--color-theme-1);
    color: var(--color-bg-1);
  }

  .container {
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: fit-content;
    z-index: 100;
    background-color: var(--color-bg-1);
    max-height: calc(100vh - 2rem);
    box-sizing: border-box;
    overflow: auto;
    border-radius: var(--border-radius);
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    & > h1 {
      margin: 0;
      padding: 0.5rem 1rem;
    }
  }

  h1,
  h2 {
    margin-top: 0;
    line-height: normal;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 200%;
  }

  h2 {
    font-size: 110%;
  }

  .content {
    width: 24rem;
    padding: 1rem;

    & > details {
      font-size: 1rem;

      &:not(:last-child) {
        margin-bottom: 1rem;
      }

      & > summary {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        cursor: pointer;
      }
    }
  }
</style>
