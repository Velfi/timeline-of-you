<script lang="ts">
  import type { TimelineEvent } from '$lib/db';

  export let event: TimelineEvent;
</script>

<i>
  ({event.start.toString()}{#if event.end}&nbsp;&mdash;&nbsp;{event.end.toString()}{/if})
</i>
<b>{event.name}</b>{#if event.description}&nbsp;&mdash;&nbsp;{event.description}{/if}
