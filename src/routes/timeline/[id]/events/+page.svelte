<script lang="ts">
  import { onMount } from 'svelte';
  import { timeline } from '$lib/stores/timeline';
  import { type TimelineEvent } from '$lib/db';
  import EventEditor from '$lib/components/EventEditor.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import { notifications } from '$lib/stores/notifications';
  import { DateTime } from '$lib/types/date';
  import DateTimeComponent from '$lib/components/DateTime.svelte';

  export let data: { timelineId: number };

  let timelineData: any = null;
  let isLoading = true;
  let events: TimelineEvent[] = [];
  let filteredEvents: TimelineEvent[] = [];
  let searchTerm = '';
  let selectedEvent: TimelineEvent | null = null;
  let showEventEditor = false;
  let isNewEvent = false;
  let gridLayout = 1; // 1, 2, or 3 columns

  // Group events by year, month, day
  let groupedEvents: Map<number, Map<number, Map<number, TimelineEvent[]>>> = new Map();

  onMount(async () => {
    try {
      // Load timeline from store
      await timeline.loadFromDb(data.timelineId);

      // Subscribe to timeline changes
      const unsubscribe = timeline.timeline.subscribe((loadedTimeline) => {
        if (loadedTimeline) {
          timelineData = loadedTimeline;
          events = loadedTimeline.events;
          filterEvents();
        }
      });

      // Cleanup subscription on component destroy
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Failed to load timeline:', error);
      notifications.add('error', 'Failed to load timeline. Please try again.');
    } finally {
      isLoading = false;
    }
  });

  function filterEvents() {
    // Filter events based on search term
    if (searchTerm.trim() === '') {
      filteredEvents = [...events];
    } else {
      const term = searchTerm.toLowerCase().trim();
      filteredEvents = events.filter(
        (event) =>
          event.name.toLowerCase().includes(term) ||
          (event.description && event.description.toLowerCase().includes(term))
      );
    }

    groupEvents();
  }

  function groupEvents() {
    groupedEvents = new Map();

    // Group events by year, month, day
    for (const event of filteredEvents) {
      const date = event.start.toDate();
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      if (!groupedEvents.has(year)) {
        groupedEvents.set(year, new Map());
      }

      const yearMap = groupedEvents.get(year)!;

      // Handle fuzzy dates (no specific month)
      if (event.start.month === undefined) {
        if (!yearMap.has(-1)) {
          yearMap.set(-1, new Map());
        }
        const fuzzyMonthMap = yearMap.get(-1)!;
        if (!fuzzyMonthMap.has(-1)) {
          fuzzyMonthMap.set(-1, []);
        }
        fuzzyMonthMap.get(-1)!.push(event);
        continue;
      }

      if (!yearMap.has(month)) {
        yearMap.set(month, new Map());
      }

      const monthMap = yearMap.get(month)!;

      // Handle fuzzy dates (no specific day)
      if (event.start.day === undefined) {
        if (!monthMap.has(-1)) {
          monthMap.set(-1, []);
        }
        monthMap.get(-1)!.push(event);
        continue;
      }

      if (!monthMap.has(day)) {
        monthMap.set(day, []);
      }

      monthMap.get(day)!.push(event);
    }
  }

  function handleEventClick(event: TimelineEvent) {
    selectedEvent = event;
    showEventEditor = true;
  }

  function handleAddEvent() {
    // Create a new event with default values
    const now = new Date();
    selectedEvent = {
      name: '',
      description: '',
      start: new DateTime(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      tagIds: [],
      createdOn: now,
      lastModified: now,
    };
    isNewEvent = true;
    showEventEditor = true;
  }

  async function handleEventUpdated(event: CustomEvent<{ event: TimelineEvent }>) {
    if (isNewEvent) {
      // Add new event to the events array
      events = [...events, event.detail.event];
    } else {
      // Find and update the event in the events array
      const index = events.findIndex((e) => e.id === event.detail.event.id);
      if (index !== -1) {
        events[index] = event.detail.event;
      }
    }

    // Update in the store
    await timeline.saveToDb();
    filterEvents();
    showEventEditor = false;
    isNewEvent = false;
  }

  // Update filtered events when search term changes
  $: {
    console.log('Reactive statement triggered');
    if (events.length > 0) {
      filterEvents();
    }
  }

  function toggleGridLayout() {
    gridLayout = gridLayout === 3 ? 1 : gridLayout + 1;
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
</script>

<div class="events-page">
  <header>
    <h1>Events in {timelineData?.name || 'Timeline'}</h1>

    <div class="search-controls">
      <input
        type="text"
        placeholder="Search events..."
        bind:value={searchTerm}
        on:input={() => filterEvents()}
        aria-label="Search events"
      />

      <button class="add-event-button" on:click={handleAddEvent} aria-label="Add new event">
        Add Event
      </button>

      <a
        href="/timeline/{data.timelineId}/quick-add-events"
        class="quick-add-button"
        aria-label="Quick add events"
      >
        Quick Add
      </a>

      <button class="layout-button" on:click={toggleGridLayout} aria-label="Toggle grid layout">
        <span class="layout-icon">
          {#if gridLayout === 1}
            ▣
          {:else if gridLayout === 2}
            ▣ ▣
          {:else}
            ▣ ▣ ▣
          {/if}
        </span>
        <span class="layout-text">{gridLayout} Column{gridLayout > 1 ? 's' : ''}</span>
      </button>
    </div>
  </header>

  {#if isLoading}
    <div class="loading-container">
      <Loading />
    </div>
  {:else if !timelineData}
    <div class="error-message">
      <p>No timeline data available. Please select a timeline from the management page.</p>
      <a href="/manage/timelines">Go to Timelines</a>
    </div>
  {:else if filteredEvents.length === 0}
    <div class="empty-state">
      <p>No events found{searchTerm ? ' matching your search' : ''}.</p>
      {#if searchTerm}
        <button
          on:click={() => {
            searchTerm = '';
          }}>Clear Search</button
        >
      {/if}
    </div>
  {:else}
    <div class="events-list">
      {#each [...groupedEvents.entries()] as [year, monthMap]}
        <div class="year-group">
          <h2>{year}</h2>

          {#each [...monthMap.entries()].sort(([a], [b]) => a - b) as [month, dayMap]}
            <div class="month-group">
              {#if month !== -1}
                <h3>{months[month]}</h3>
              {/if}

              {#each [...dayMap.entries()].sort(([a], [b]) => a - b) as [day, dayEvents]}
                <div class="day-group">
                  {#if day !== -1}
                    <h4>{day}</h4>
                  {/if}

                  <ul
                    class="event-cards {gridLayout === 1
                      ? 'grid-1'
                      : gridLayout === 2
                      ? 'grid-2'
                      : 'grid-3'}"
                  >
                    {#each dayEvents as event}
                      <div
                        class="event-card"
                        on:click={() => handleEventClick(event)}
                        on:keydown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleEventClick(event);
                            e.preventDefault();
                          }
                        }}
                        tabindex="0"
                        role="button"
                        aria-label={`Edit event: ${event.name}`}
                      >
                        <div class="event-header">
                          <h5>{event.name}</h5>
                          <div class="event-meta">
                            <p class="event-times">
                              <DateTimeComponent
                                date={event.start.toDate()}
                                format="short"
                                hasMonth={event.start.month !== undefined}
                                hasDay={event.start.day !== undefined}
                                hasTime={event.start.hour !== undefined}
                              />
                              {#if event.end}
                                <span class="time-separator"> to </span>
                                <DateTimeComponent
                                  date={event.end.toDate()}
                                  format="short"
                                  hasMonth={event.end.month !== undefined}
                                  hasDay={event.end.day !== undefined}
                                  hasTime={event.end.hour !== undefined}
                                />
                              {/if}
                            </p>
                          </div>
                        </div>

                        {#if event.description}
                          <p class="event-description">{event.description}</p>
                        {/if}
                      </div>
                    {/each}
                  </ul>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  {#if showEventEditor && selectedEvent}
    <EventEditor
      event={selectedEvent}
      isOpen={showEventEditor}
      on:close={() => {
        showEventEditor = false;
        isNewEvent = false;
      }}
      on:save={handleEventUpdated}
    />
  {/if}
</div>

<style>
  .events-page {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  header {
    margin-bottom: 20px;
  }

  h1 {
    margin: 0 0 16px;
  }

  .search-controls {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 20px;
  }

  input[type='text'] {
    flex: 1;
    min-width: 0;
    padding: var(--input-padding);
    border: var(--border);
    border-radius: var(--border-radius);
    font-size: inherit;
    background: var(--color-bg-1);
  }

  .year-group {
    margin-bottom: 32px;
  }

  .month-group {
    margin-left: 20px;
    margin-bottom: 24px;
  }

  .day-group {
    margin-left: 20px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 28px;
    border-bottom: 2px solid var(--color-accent-1);
    padding-bottom: 6px;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 22px;
    color: var(--color-theme-2);
    margin-bottom: 12px;
  }

  h4 {
    font-size: 18px;
    color: var(--color-theme-2);
    margin-bottom: 10px;
  }

  .event-cards {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 16px;
  }

  .grid-1 {
    grid-template-columns: 1fr;
  }

  .grid-2 {
    grid-template-columns: 1fr 1fr;
  }

  .grid-3 {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .event-card {
    background: var(--color-bg-1);
    border: var(--border);
    border-radius: var(--border-radius);
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .event-card:hover,
  .event-card:focus {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    outline: 2px solid var(--color-accent-1);
  }

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .event-header h5 {
    margin: 0;
    font-size: 18px;
  }

  .event-times {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-theme-2);
    font-size: 14px;
  }

  .time-separator {
    color: var(--color-theme-2);
    opacity: 0.7;
  }

  .event-description {
    color: var(--color-theme-2);
    margin-bottom: 12px;
    font-size: 15px;
  }

  .loading-container,
  .error-message,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    text-align: center;
  }

  .error-message a,
  .empty-state button {
    margin-top: 16px;
    padding: var(--input-padding);
    background: var(--color-accent-1);
    color: var(--color-bg-0);
    text-decoration: none;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
  }

  .error-message a:hover,
  .empty-state button:hover {
    background: var(--color-accent-2);
  }

  .add-event-button,
  .quick-add-button {
    flex: 1;
    min-width: 0;
    background: var(--color-accent-1);
    color: var(--color-bg-0);
    text-decoration: none;
    padding: var(--input-padding);
    border-radius: var(--border-radius);
    font-size: inherit;
    transition: background-color 0.2s;
    border: none;
    cursor: pointer;
    text-align: center;
  }

  .add-event-button:hover,
  .quick-add-button:hover {
    background: var(--color-accent-2);
  }

  .layout-button {
    flex: 1;
    min-width: 0;
    background: var(--color-bg-1);
    color: var(--color-theme-2);
    padding: var(--input-padding);
    border-radius: var(--border-radius);
    font-size: inherit;
    transition: background-color 0.2s;
    border: var(--border);
    cursor: pointer;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .layout-button:hover {
    background: var(--color-bg-2);
  }

  .layout-icon {
    font-size: 1.2em;
    letter-spacing: 4px;
  }

  .layout-text {
    font-size: 0.9em;
  }

  .event-meta {
    margin-top: 8px;
    font-size: 0.9em;
    color: var(--text-color-secondary, #666);
  }

  .event-dates {
    margin-top: 4px;
  }
</style>
