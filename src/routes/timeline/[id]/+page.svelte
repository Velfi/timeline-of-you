<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import ChronologicalTimeline from '$lib/components/ChronologicalTimeline.svelte';
  import type { Timeline } from '$lib/db';
  import { getTimelineById } from '$lib/db';

  export let data: { timelineId: number };

  let timeline: Timeline | undefined;
  let error: string | undefined;

  onMount(async () => {
    try {
      timeline = await getTimelineById(data.timelineId);
    } catch (e) {
      error = e instanceof Error ? e.message : 'An unknown error occurred';
    }
  });
</script>

{#if error}
  <div class="error-message">
    <h1>Error</h1>
    <p>We couldn't find that timeline.</p>
    <button on:click={() => goto('/manage/timelines')}>Go to the timeline management page</button>
  </div>
{:else if timeline}
  <ChronologicalTimeline
    events={timeline.events}
    startYear={timeline.metadata.start.year}
    endYear={timeline.metadata.end.year}
    title={timeline.metadata.name || ''}
    description={timeline.metadata.description || ''}
  />
{:else}
  <div class="loading-message">
    <h1>Loading...</h1>
    <p>Please wait while we load your timeline.</p>
  </div>
{/if}

<style>
  .error-message,
  .loading-message {
    text-align: center;
    padding: 2rem;
  }

  .timeline-actions {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover {
    background-color: #45a049;
  }
</style>
