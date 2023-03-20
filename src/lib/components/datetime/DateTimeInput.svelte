<script lang="ts">
  import { DateTime, tryToConstructDateTimeFromStrings } from '$lib/types/date';
  import * as stores from '$lib/stores';
  import { get } from 'svelte/store';
  import {
    DAY_INPUT_PROPS,
    HOUR_INPUT_PROPS,
    MINUTE_INPUT_PROPS,
    MONTH_INPUT_PROPS,
    YEAR_INPUT_PROPS,
    TZ_INPUT_PROPS,
  } from './inputProps';
  import { onMount } from 'svelte/internal';

  export let value: DateTime | undefined;
  export let label = '';
  export let required = false;
  let isLoading = true;

  // Form input state
  let year = '';
  let month = '';
  let day = '';
  let hour = '';
  let minute = '';
  let timeZone = get(stores.preferredEventTimezone);

  onMount(() => {
    if (value !== undefined) {
      year = value.year.toString() ?? '';
      month = value.month?.toString() ?? '';
      day = value.day?.toString() ?? '';
      hour = value.hour?.toString() ?? '';
      minute = value.minute?.toString() ?? '';
      timeZone = value.timeZone ?? '';
    }

    isLoading = false;
  });

  $: {
    // Without the `isLoading` trick, this will clobber default values
    if (!isLoading) {
      value = tryToConstructDateTimeFromStrings(year, month, day, hour, minute, timeZone);
    }
  }
</script>

<p class="label">{label}</p>
<div class="container">
  <div class="input-wrapper">
    <label class="visually-hidden" for="year">Year</label>
    <input name="year" {required} {...YEAR_INPUT_PROPS} bind:value={year} />
    <span aria-hidden>Year</span>
  </div>
  <div class="input-wrapper">
    <label class="visually-hidden" for="month">Month</label>
    <input name="month" {...MONTH_INPUT_PROPS} bind:value={month} />
    <span aria-hidden>Mo.</span>
  </div>
  <div class="input-wrapper">
    <label class="visually-hidden" for="day">Day</label>
    <input name="day" {...DAY_INPUT_PROPS} bind:value={day} />
    <span aria-hidden>Day</span>
  </div>
  <div class="input-wrapper">
    <label class="visually-hidden" for="hour">Hour</label>
    <input name="hour" {...HOUR_INPUT_PROPS} bind:value={hour} />
    <span aria-hidden>Hr.</span>
  </div>
  <div class="input-wrapper">
    <label class="visually-hidden" for="minute">Minute</label>
    <input name="minute" {...MINUTE_INPUT_PROPS} bind:value={minute} />
    <span aria-hidden>Min.</span>
  </div>
  <div class="input-wrapper">
    <label class="visually-hidden" for="timeZone">Time Zone</label>
    <input name="timeZone" {...TZ_INPUT_PROPS} bind:value={timeZone} />
    <span aria-hidden>TZ</span>
  </div>
</div>

<style lang="scss">
  .container {
    display: grid;
    grid-template-columns: repeat(6, auto);
    column-gap: 0.2rem;
    align-items: center;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .label {
    margin: 0;
  }

  input {
    border-top: 0;
    border-left: 0;
    border-right: 0;
    border-radius: 0;
    text-align: center;
    min-width: 1.8rem;

    &:invalid {
      border-bottom: 2px solid rgb(255, 68, 0);
    }
  }

  input::placeholder {
    text-align: center;
  }
</style>
