<script lang="ts">
  import type { TimelineEvent } from '$lib/db';

  export let event: TimelineEvent;

  console.log('event', event);
</script>

<i>
  ({event.start.toString()}{#if event.end}&nbsp;&mdash;&nbsp;{event.end.toString()}{/if})
</i>
{event.name}{#if event.description}&nbsp;&mdash;&nbsp;{event.description}{/if}
