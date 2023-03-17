<script lang="ts">
  import { DateTime } from '$lib/types/date';
  import type { Metadata, Event } from '$lib/db';
  import { range } from 'lodash';
  import Year from './Year.svelte';

  export let metadata: Metadata | undefined;
  export let events: Event[] = [];

  let yearsBetweenStartAndEnd: Year[] = [];
  $: if (metadata) {
    yearsBetweenStartAndEnd = buildYears(metadata);
  }

  interface Year {
    isDecade: boolean;
    events: Event[];
  }

  function buildYears(timeline: Metadata): Year[] {
    let startDate = DateTime.fromJSON(timeline.start);
    let endDate = DateTime.fromJSON(timeline.end);

    return range(startDate.year, endDate.year).map((i) => ({
      isDecade: i % 10 === 0,
      events: events.filter((e: Event) => e.start.year === i),
    }));
  }
</script>

<div class="timeline-container">
  <div class="boundary left" />
  <div class="line">
    {#each yearsBetweenStartAndEnd as year}
      <Year {...year} />
    {/each}
  </div>
  <div class="boundary right" />
</div>

<style lang="scss">
  .timeline-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .boundary {
    width: 5rem;
    height: 100%;
    z-index: -1;
  }

  $dark-bg: darken(#253131, 12%);

  .left {
    background: linear-gradient(90deg, $dark-bg 0%, rgba(255, 255, 255, 0) 100%);
    margin-right: -1rem;
  }

  .right {
    background: linear-gradient(-90deg, $dark-bg 0%, rgba(255, 255, 255, 0) 100%);
    margin-left: -1rem;
  }

  .line {
    flex-grow: 1;
    height: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--color-theme-1);
  }
</style>
