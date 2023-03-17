<script lang="ts">
  import type { Event } from '$lib/db';

  export let event: Event;
</script>

<i>
  ({event.start.toString()}{#if event.end}-{event.end.toString()}{/if})
</i>
{event.name}{#if event.description}&nbsp;&mdash;&nbsp;{event.description}{/if}
