<script lang="ts">
  import { DateTime, MONTHS } from '$lib/types/date';

  export let date: DateTime;
</script>

<span class="datetime">
  <span class="year">{date.year}</span>
  {#if date.month !== undefined && date.month > 0}
    <span class="month">{MONTHS[date.month - 1]}</span>
  {/if}
  {#if date.day !== undefined}
    <span class="day">{date.day}</span>
  {/if}
  {#if date.hour !== undefined}
    <span class="time">
      {date.hour.toString().padStart(2, '0')}
      {#if date.minute !== undefined}
        :{date.minute.toString().padStart(2, '0')}
      {/if}
    </span>
  {/if}
</span>

<style>
  .datetime {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 1rem;
  }

  .year {
    font-weight: 500;
  }

  .month {
    color: var(--text-secondary);
  }

  .day {
    color: var(--text-secondary);
  }

  .time {
    margin-left: 0.5rem;
    color: var(--text-secondary);
  }
</style>
