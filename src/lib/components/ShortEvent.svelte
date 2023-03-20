<script lang="ts">
  import type { TimelineEvent } from '$lib/db';

  export let event: TimelineEvent;
</script>

<i>
  ({event.start.toString()}{#if event.end}-{event.end.toString()}{/if})
</i>
{event.name}{#if event.description}&nbsp;&mdash;&nbsp;{event.description}{/if}
