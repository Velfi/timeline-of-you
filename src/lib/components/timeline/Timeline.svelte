<script lang="ts">
  import { DateTime } from '$lib/types/date';
  import type { Timeline, TimelineEvent } from '$lib/db';
  import { range } from 'lodash-es';
  import Year from './Year.svelte';
  import type { YearProps } from './Year';

  export let timeline: Timeline | undefined;

  let yearsBetweenStartAndEnd: YearProps[] = [];
  $: if (timeline) {
    yearsBetweenStartAndEnd = buildYears(timeline);
  }

  function buildYears(timeline: Timeline): YearProps[] {
    let startDate = DateTime.fromJSON(timeline.start);
    let endDate = DateTime.fromJSON(timeline.end);

    return range(startDate.year, endDate.year).map((i) => ({
      isDecade: i % 10 === 0,
      events: timeline.events.filter((e: TimelineEvent) => e.start.year === i),
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
