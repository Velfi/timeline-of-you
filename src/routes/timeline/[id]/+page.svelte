<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import * as stores from '$lib/stores';
  import type { Timeline, Event } from '$lib/db';
  import TimelineElement from '$lib/components/timeline/Timeline.svelte';

  let timeline: Timeline | undefined;
  let events: Event[] | undefined;
  let url: URL;

  onMount(async () => {
    // TODO is there a nicer way to get the timeline ID from the URL?
    stores.timeline.loadFromDb(url.pathname.split('/')[2]);
  });

  page.subscribe((p) => {
    url = p.url;
  });

  stores.timeline.metadata.subscribe((t) => {
    timeline = t;
  });

  stores.timeline.events.subscribe((e) => {
    events = e;
  });
</script>

<svelte:head>
  <title>Timeline</title>
  <meta name="description" content="A timeline of you" />
</svelte:head>

{#if timeline}
  <TimelineElement {timeline} {events} />
{:else}
  <p>
    I couldn't find a timeline with the ID {$page.url.pathname.split('/')[2]}.
    <a href="/manage/timelines">Go back to the timeline management page?</a>
  </p>
{/if}

<style lang="scss">
</style>
