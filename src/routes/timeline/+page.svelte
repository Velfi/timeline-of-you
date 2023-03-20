<script lang="ts">
  import * as stores from '$lib/stores';
  import TimelineElement from '$lib/components/timeline/Timeline.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import type { Timeline } from '$lib/db';

  let timeline: Timeline | undefined;
  let isLoading = true;

  stores.timeline.isLoading.subscribe((l) => {
    isLoading = l;
  });

  stores.timeline.timeline.subscribe((t) => {
    // When no timeline is loaded or loading, reroute to the timeline management page
    if (!t && !isLoading && browser) {
      goto('/manage/timelines');
    }
    timeline = t;
  });
</script>

<svelte:head>
  <title>Timeline</title>
  <meta name="description" content="A timeline of you" />
</svelte:head>

{#if timeline}
  <TimelineElement {timeline} />
{:else}
  <p>
    It looks like you haven't loaded a timeline yet.
    <a href="/manage/timelines">You can load one from the timeline management page.</a>
  </p>
{/if}
