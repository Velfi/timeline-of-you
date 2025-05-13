<script lang="ts">
  import { DateTime, tryToConstructDateTimeFromStrings } from '$lib/types/date';
  import * as dateFns from 'date-fns';
  import {
    DAY_INPUT_PROPS,
    HOUR_INPUT_PROPS,
    MINUTE_INPUT_PROPS,
    MONTH_INPUT_PROPS,
    YEAR_INPUT_PROPS,
    TZ_INPUT_PROPS,
  } from './inputProps';

  export let start: DateTime | undefined;
  export let end: DateTime | undefined;
  export let required = false;

  // Get timezone from current DateTime
  const currentDateTime = new DateTime(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
    new Date().getHours(),
    new Date().getMinutes(),
  );
  const localTimeZone = dateFns.format(currentDateTime.toDate(), 'XXX');

  let startYear = '';
  let startMonth = '';
  let startDay = '';
  let startHour = '';
  let startMinute = '';
  let startTimeZone = localTimeZone;

  $: {
    start = tryToConstructDateTimeFromStrings(
      startYear,
      startMonth,
      startDay,
      startHour,
      startMinute,
      startTimeZone,
    );
  }

  let endYear = '';
  let endMonth = '';
  let endDay = '';
  let endHour = '';
  let endMinute = '';
  let endTimeZone = localTimeZone;

  $: {
    end = tryToConstructDateTimeFromStrings(
      endYear,
      endMonth,
      endDay,
      endHour,
      endMinute,
      endTimeZone,
    );
  }
</script>

<div class="container">
  <div class="datetime-input-wrapper">
    <p class="start">The Beginning</p>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startYear">Year</label>
      <input name="startYear" {required} {...YEAR_INPUT_PROPS} bind:value={startYear} />
      <span aria-hidden="true" class="visual-only-label">Year</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startMonth">Month</label>
      <input name="startMonth" {...MONTH_INPUT_PROPS} bind:value={startMonth} />
      <span aria-hidden="true" class="visual-only-label">Mo.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startDay">Day</label>
      <input name="startDay" {...DAY_INPUT_PROPS} bind:value={startDay} />
      <span aria-hidden="true" class="visual-only-label">Day</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startHour">Hour</label>
      <input name="startHour" {...HOUR_INPUT_PROPS} bind:value={startHour} />
      <span aria-hidden="true" class="visual-only-label">Hr.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startMinute">Minute</label>
      <input name="startMinute" {...MINUTE_INPUT_PROPS} bind:value={startMinute} />
      <span aria-hidden="true" class="visual-only-label">Min.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startTimeZone">Time Zone</label>
      <input name="startTimeZone" {...TZ_INPUT_PROPS} bind:value={startTimeZone} />
      <span aria-hidden="true" class="visual-only-label">TZ</span>
    </div>
  </div>
  &mdash;
  <div class="datetime-input-wrapper">
    <div class="input-wrapper">
      <label class="visually-hidden" for="endYear">Year</label>
      <input name="endYear" {required} {...YEAR_INPUT_PROPS} bind:value={endYear} />
      <span aria-hidden="true" class="visual-only-label">Year</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endMonth">Month</label>
      <input name="endMonth" {...MONTH_INPUT_PROPS} bind:value={endMonth} />
      <span aria-hidden="true" class="visual-only-label">Mo.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endDay">Day</label>
      <input name="endDay" {...DAY_INPUT_PROPS} bind:value={endDay} />
      <span aria-hidden="true" class="visual-only-label">Day</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endHour">Hour</label>
      <input name="endHour" {...HOUR_INPUT_PROPS} bind:value={endHour} />
      <span aria-hidden="true" class="visual-only-label">Hr.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endMinute">Minute</label>
      <input name="endMinute" {...MINUTE_INPUT_PROPS} bind:value={endMinute} />
      <span aria-hidden="true" class="visual-only-label">Min.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endTimeZone">Time Zone</label>
      <input name="endTimeZone" {...TZ_INPUT_PROPS} bind:value={endTimeZone} />
      <span aria-hidden="true" class="visual-only-label">TZ</span>
    </div>
    <p class="end">The End</p>
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;

    p {
      font-size: 200%;
      margin-bottom: 0;
    }
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

  .datetime-input-wrapper {
    display: grid;
    grid-template-columns: repeat(7, auto);
    column-gap: 0.2rem;
    align-items: center;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .start {
    margin-right: 1rem;
  }

  .end {
    margin-left: 1rem;
  }
</style>
