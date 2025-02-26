<script lang="ts">
  import timelineJSON from '$lib/timeline.json';
  import TimelineViz from '$lib/components/TimelineViz.svelte';
  import { DateTime } from '$lib/types/date';

  let width = 0;
  let height = 0;
  const events = timelineJSON.events.map((event) => ({
    ...event,
    createdOn: new Date(event.createdOn),
    lastModified: new Date(event.lastModified),
    start: DateTime.fromJSON(event.start),
    end: event.end ? DateTime.fromJSON(event.end) : undefined,
  }));
  const startDate = DateTime.fromJSON(timelineJSON.metadata.start).toDate();
  const endDate = DateTime.fromJSON(timelineJSON.metadata.end).toDate();
</script>

<div bind:clientHeight={height} bind:clientWidth={width}>
  <TimelineViz {height} {width} {events} {startDate} {endDate} />
</div>

<style lang="scss">
  div {
    width: calc(100vw - 2rem);
    height: calc(100vh - 2rem);
    border: 1px solid currentColor;
    box-sizing: border-box;
  }
</style>
