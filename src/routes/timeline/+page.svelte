<script lang="ts">
  import * as stores from '$lib/stores';
  import type { Metadata, Event } from '$lib/db';
  import TimelineElement from '$lib/components/timeline/Timeline.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  let metadata: Metadata | undefined;
  let events: Event[] | undefined;
  let isLoading = true;

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
</script>

<svelte:head>
  <title>Timeline</title>
  <meta name="description" content="A timeline of you" />
</svelte:head>

{#if metadata}
  <TimelineElement {metadata} {events} />
{:else}
  <p>
    It looks like you haven't loaded a timeline yet.
    <a href="/manage/timelines">You can load one from the timeline management page.</a>
  </p>
{/if}
