<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { TimelineEvent } from '$lib/db';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import DateTimeDisplay from './datetime/DateTimeDisplay.svelte';
  import { DataSet } from 'vis-data';
  import { Timeline } from 'vis-timeline';
  import type { DataItem, TimelineOptions } from 'vis-timeline';
  import '$lib/styles/vis-timeline-theme.css';

  export let events: TimelineEvent[] = [];
  export let title: string;
  export let description: string;

  let container: HTMLDivElement;
  let timeline: Timeline;
  let selectedEvent: TimelineEvent | null = null;
  let showHelpModal = false;

  $: if (events.length === 0 && browser) {
    goto(`/timeline/${$page.params.id}/events`);
  }

  $: startEvent = events.length > 0 ? events[0] : null;
  $: endEvent = events.length > 0 ? events[events.length - 1] : null;

  function initializeTimeline() {
    if (!browser || !container) return;

    // Create a DataSet with the events
    const items = new DataSet<DataItem & { original: TimelineEvent }>(
      events.map((event) => ({
        id: event.id || String(Math.random()),
        content: event.description || '',
        start: event.start.toDate(),
        end: event.end?.toDate(),
        title: event.name,
        original: event,
      })),
    );

    // Configuration for the Timeline
    const options: TimelineOptions = {
      height: '600px',
      start: startEvent?.start.toDate(),
      // If there is no end date, use the start date
      end: endEvent?.end?.toDate() || endEvent?.start.toDate(),
      zoomable: true,
      moveable: true,
      orientation: 'top',
      showCurrentTime: false,
      showMajorLabels: true,
      showMinorLabels: true,
      zoomMin: 1000 * 60 * 60, // 1 hour
      zoomMax:
        startEvent && endEvent
          ? Math.max(
              endEvent.start.toDate().getTime() - startEvent.start.toDate().getTime(),
              1000 * 60 * 60 * 24 * 365,
            ) // At least 1 year
          : 1000 * 60 * 60 * 24 * 365 * 10, // Default to 10 years if no events
      template: (item: DataItem & { original: TimelineEvent }) => {
        return `
          <p>${item.title}</p>
          <p>${item.original.start.toString()}${
            item.original.end ? ` - ${item.original.end.toString()}` : ''
          }</p>`;
      },
    };

    // Create a Timeline
    timeline = new Timeline(container, items, options);

    // Add event listeners
    timeline.on('select', (properties: { items: number[] }) => {
      if (properties.items.length > 0) {
        const selectedId = properties.items[0];
        selectedEvent = events.find((e) => e.id === selectedId) || null;
      } else {
        selectedEvent = null;
      }
    });
  }

  function panToStart() {
    if (timeline) {
      let firstDate = startEvent?.start.toDate();

      if (firstDate !== undefined) {
        timeline.moveTo(firstDate);
        timeline.zoomOut(100);
      }
    }
  }

  function panToEnd() {
    if (timeline) {
      let lastDate = endEvent?.start.toDate();

      if (lastDate !== undefined) {
        timeline.moveTo(lastDate);
        timeline.zoomOut(100);
      }
    }
  }

  function navigateToEvent(event: TimelineEvent) {
    if (timeline) {
      selectedEvent = event;
      timeline.setSelection(String(event.id || ''));
      timeline.moveTo(event.start.toDate());
    }
  }

  function navigateToPreviousEvent() {
    if (!selectedEvent) return;
    const currentIndex = events.findIndex((e) => e.id === selectedEvent?.id);
    if (currentIndex > 0) {
      navigateToEvent(events[currentIndex - 1]);
    }
  }

  function navigateToNextEvent() {
    if (!selectedEvent) return;
    const currentIndex = events.findIndex((e) => e.id === selectedEvent?.id);
    if (currentIndex < events.length - 1) {
      navigateToEvent(events[currentIndex + 1]);
    }
  }

  onMount(() => {
    if (browser) {
      initializeTimeline();
    }
  });

  onDestroy(() => {
    if (timeline) {
      timeline.destroy();
    }
  });

  $: if (events && events.length > 0 && browser) {
    initializeTimeline();
  }
</script>

<div class="timeline-container">
  <div class="header">
    <h2>{title}</h2>
    <div class="controls">
      <button
        class="help-button"
        on:click={() => (showHelpModal = true)}
        on:keydown={(e) => e.key === 'Enter' && (showHelpModal = true)}
        title="Show timeline controls help">?</button
      >
      <a href="/timeline/{$page.params.id}/events" class="events-link">View All Events</a>
      <button
        on:click={panToStart}
        on:keydown={(e) => e.key === 'Enter' && panToStart()}
        class="reset-button">Pan to start</button
      >
      <button
        on:click={panToEnd}
        on:keydown={(e) => e.key === 'Enter' && panToEnd()}
        class="reset-button">Pan to end</button
      >
    </div>
  </div>
  <p class="description">{description}</p>
  {#if showHelpModal}
    <div
      class="modal-backdrop"
      on:click={() => (showHelpModal = false)}
      on:keydown={(e) => e.key === 'Escape' && (showHelpModal = false)}
      role="button"
      tabindex="0"
    >
      <div class="modal">
        <header>
          <h2>Timeline Controls</h2>
          <button class="close-button" on:click={() => (showHelpModal = false)}>&times;</button>
        </header>
        <div class="modal-content">
          <h3>Navigation</h3>
          <ul>
            <li><strong>Click and drag</strong> to pan the timeline</li>
            <li><strong>Scroll</strong> or <strong>pinch</strong> to zoom in/out</li>
            <li><strong>Click an event</strong> to view its details</li>
            <li>Use <strong>Previous/Next</strong> buttons to navigate between events</li>
          </ul>
          <h3>View Controls</h3>
          <ul>
            <li><strong>Back to the start</strong> button returns to the start of the timeline</li>
            <li><strong>View All Events</strong> shows a list of all timeline events</li>
          </ul>
        </div>
      </div>
    </div>
  {/if}
  <div class="timeline" bind:this={container}></div>
  {#if selectedEvent}
    <div class="event-navigation">
      <div class="nav-button-wrapper">
        <button
          class="nav-button"
          on:click={navigateToPreviousEvent}
          disabled={events.findIndex((e) => e.id === selectedEvent?.id) === 0}
        >
          ← Previous
        </button>
      </div>
      <div class="event-carousel">
        {#if events.findIndex((e) => e.id === selectedEvent?.id) > 0}
          {@const prevEvent = events[events.findIndex((e) => e.id === selectedEvent?.id) - 1]}
          <div class="carousel-event prev-event">
            <div class="subtitle-title">{prevEvent.name}</div>
            <div class="subtitle-date">
              {#if selectedEvent.start}
                <DateTimeDisplay date={selectedEvent.start} />
              {/if}
              {#if selectedEvent.end}
                &nbsp;&mdash;&nbsp;
                <DateTimeDisplay date={selectedEvent.end} />
              {/if}
            </div>
          </div>
        {/if}
        <div class="subtitle-box">
          <div class="subtitle-title">{selectedEvent.name}</div>
          <div class="subtitle-date">
            {#if selectedEvent.start}
              <DateTimeDisplay date={selectedEvent.start} />
            {/if}
            {#if selectedEvent.end}
              &nbsp;&mdash;&nbsp;
              <DateTimeDisplay date={selectedEvent.end} />
            {/if}
          </div>
          {#if selectedEvent.description}
            <div class="subtitle-description">{selectedEvent.description}</div>
          {/if}
        </div>
        {#if events.findIndex((e) => e.id === selectedEvent?.id) < events.length - 1}
          {@const nextEvent = events[events.findIndex((e) => e.id === selectedEvent?.id) + 1]}
          <div class="carousel-event next-event">
            <div class="subtitle-title">{nextEvent.name}</div>
            <div class="subtitle-date">
              {#if selectedEvent.start}
                <DateTimeDisplay date={selectedEvent.start} />
              {/if}
              {#if selectedEvent.end}
                &nbsp;&mdash;&nbsp;
                <DateTimeDisplay date={selectedEvent.end} />
              {/if}
            </div>
          </div>
        {/if}
      </div>
      <div class="nav-button-wrapper">
        <button
          class="nav-button"
          on:click={navigateToNextEvent}
          disabled={events.findIndex((e) => e.id === selectedEvent?.id) === events.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .timeline-container {
    padding: 20px;
    background: var(--color-bg-0);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  h2 {
    margin: 0;
    color: var(--color-text);
  }

  .description {
    color: var(--color-theme-1);
    margin-bottom: 20px;
  }

  .timeline {
    height: 600px;
    min-height: 0;
    width: 100%;
    border: 1px solid var(--color-theme-2);
    user-select: none;
  }

  .reset-button {
    padding: var(--input-padding);
    background: var(--color-accent-1);
    color: var(--color-bg-0);
    border: var(--border);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: inherit;
    height: var(--input-height);
  }

  .reset-button:hover {
    background: var(--color-accent-2);
  }

  .events-link {
    color: var(--color-accent-1);
    text-decoration: none;
    font-size: 16px;
    padding: var(--input-padding);
    border: var(--border);
    border-radius: var(--border-radius);
    transition: background-color 0.2s;
  }

  .events-link:hover {
    background: var(--color-accent-1);
    color: var(--color-bg-0);
  }

  .event-navigation {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-areas: 'prev carousel next';
    gap: 20px;
    margin-top: 20px;
    align-items: center;
  }

  .event-carousel {
    grid-area: carousel;
    display: grid;
    grid-template-columns: 1fr minmax(auto, 400px) 1fr;
    gap: 20px;
    perspective: 1000px;
    align-items: stretch;
  }

  .carousel-event {
    background: var(--color-bg-1);
    border: 1px solid var(--color-theme-2);
    border-radius: var(--border-radius);
    padding: 15px 25px;
    color: var(--color-text);
    max-width: 600px;
    opacity: 0.5;
    transform: scale(0.9);
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .carousel-event .subtitle-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--color-accent-1);
  }

  .carousel-event .subtitle-date {
    font-size: 14px;
    color: var(--color-theme-1);
  }

  .prev-event {
    grid-column: 1;
    transform: translateX(20px) scale(0.9) rotateY(10deg);
    height: 100%;
  }

  .next-event {
    grid-column: 3;
    transform: translateX(-20px) scale(0.9) rotateY(-10deg);
    height: 100%;
  }

  .nav-button-wrapper {
    display: grid;
    align-items: center;
    height: calc(100% - 30px);
  }

  .nav-button-wrapper:first-child {
    grid-area: prev;
  }

  .nav-button-wrapper:last-child {
    grid-area: next;
  }

  .nav-button {
    padding: 0 16px;
    background: var(--color-accent-1);
    color: var(--color-bg-0);
    border: var(--border);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
    transition: background-color 0.2s;
    min-width: 100px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-button:hover:not(:disabled) {
    background: var(--color-accent-2);
  }

  .nav-button:disabled {
    background: var(--color-bg-2);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  .subtitle-box {
    grid-column: 2;
    background: var(--color-bg-1);
    border: 1px solid var(--color-theme-2);
    border-radius: var(--border-radius);
    padding: 15px 25px;
    text-align: left;
    color: var(--color-text);
    max-width: 800px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .subtitle-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--color-accent-1);
  }

  .subtitle-date {
    font-size: 16px;
    color: var(--color-theme-1);
    margin-bottom: 8px;
  }

  .subtitle-description {
    font-size: 16px;
    line-height: 1.4;
    color: var(--color-text);
  }

  .help-button {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-accent-1);
    color: var(--color-bg-0);
    border: none;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 16px;
  }

  .help-button:hover {
    background: var(--color-accent-2);
  }

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
    max-width: 500px;
    width: 90%;
  }

  .modal header {
    padding: 16px;
    border-bottom: var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-text);
  }

  .modal h3 {
    margin: 1rem 0 0.5rem;
    color: var(--color-accent-1);
  }

  .modal ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .modal li {
    margin-bottom: 0.5rem;
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
  }
</style>
