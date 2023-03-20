<script lang="ts">
  import type { TimelineEvent } from '$lib/db';

  export let events: TimelineEvent[] = [];
  export let isDecade = false;
</script>

<div class="year" class:decade={isDecade}>
  {#each events as event}
    <div class="event">
      <p>{event.name}</p>
      <p>{event.description}</p>
    </div>
  {/each}
</div>

<style lang="scss">
  .year {
    height: 3rem;
    background-color: var(--color-theme-2);
    width: 1px;
    position: relative;

    &.decade {
      height: 4rem;
      background-color: var(--color-theme-1);
    }
  }
</style>
