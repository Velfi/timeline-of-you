<script lang="ts">
  import { DateTime, tryToConstructDateTimeFromStrings } from '$lib/types/date';
  import * as dateFns from 'date-fns';

  export let start: DateTime | undefined;
  export let end: DateTime | undefined;
  export let required: boolean = false;
  const localTimeZone = dateFns.format(new Date(), 'XXX');

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
      startMinute
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
      endTimeZone
    );
  }

  const yearInputProps = {
    required,
    type: 'text',
    size: 4,
    pattern: String.raw`\d{1,4}`,
    placeholder: 'YYYY',
    title: '1 to 4 digit year, B.C.E. years are unsupported',
  };

  const twoDigitInputProps = {
    type: 'text',
    maxlength: 2,
    size: 2,
  };

  const monthInputProps = {
    ...twoDigitInputProps,
    pattern: String.raw`(0?\d|1[1-2])`,
    placeholder: 'MM',
    title: '1-2 digit month',
  };
  const dayInputProps = {
    ...twoDigitInputProps,
    pattern: String.raw`([0-2]?\d|3[0-1])`,
    placeholder: 'DD',
    title: '1-2 digit day',
  };
  const hourInputProps = {
    ...twoDigitInputProps,
    placeholder: 'HH',
    pattern: String.raw`([0-1]?\d|2[0-3])`,
    title: '1-2 digit hour',
  };
  const minuteInputProps = {
    ...twoDigitInputProps,
    placeholder: 'MM',
    pattern: String.raw`([0-5]?\d)`,
    title: '1-2 digit minute',
  };
  const timeZoneInputProps = {
    maxlength: 6,
    size: 6,
    type: 'text',
    pattern: String.raw`[+-]\d\d?(:\d\d)?`,
    class: 'four-digit',
    placeholder: localTimeZone,
    title: 'GMT-relative time zone offset',
  };
</script>

<div class="container">
  <div class="datetime-input-wrapper">
    <p class="start">The Beginning</p>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startYear">Year</label>
      <input name="startYear" {...yearInputProps} bind:value={startYear} />
      <span aria-hidden class="visual-only-label">Year</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startMonth">Month</label>
      <input name="startMonth" {...monthInputProps} bind:value={startMonth} />
      <span aria-hidden class="visual-only-label">Mo.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startDay">Day</label>
      <input name="startDay" {...dayInputProps} bind:value={startDay} />
      <span aria-hidden class="visual-only-label">Day</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startHour">Hour</label>
      <input name="startHour" {...hourInputProps} bind:value={startHour} />
      <span aria-hidden class="visual-only-label">Hr.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startMinute">Minute</label>
      <input name="startMinute" {...minuteInputProps} bind:value={startMinute} />
      <span aria-hidden class="visual-only-label">Min.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="startTimeZone">Time Zone</label>
      <input name="startTimeZone" {...timeZoneInputProps} bind:value={startTimeZone} />
      <span aria-hidden class="visual-only-label">TZ</span>
    </div>
  </div>
  &mdash;
  <div class="datetime-input-wrapper">
    <div class="input-wrapper">
      <label class="visually-hidden" for="endYear">Year</label>
      <input name="endYear" {...yearInputProps} bind:value={endYear} />
      <span aria-hidden class="visual-only-label">Year</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endMonth">Month</label>
      <input name="endMonth" {...monthInputProps} bind:value={endMonth} />
      <span aria-hidden class="visual-only-label">Mo.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endDay">Day</label>
      <input name="endDay" {...dayInputProps} bind:value={endDay} />
      <span aria-hidden class="visual-only-label">Day</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endHour">Hour</label>
      <input name="endHour" {...hourInputProps} bind:value={endHour} />
      <span aria-hidden class="visual-only-label">Hr.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endMinute">Minute</label>
      <input name="endMinute" {...minuteInputProps} bind:value={endMinute} />
      <span aria-hidden class="visual-only-label">Min.</span>
    </div>
    <div class="input-wrapper">
      <label class="visually-hidden" for="endTimeZone">Time Zone</label>
      <input name="endTimeZone" {...timeZoneInputProps} bind:value={endTimeZone} />
      <span aria-hidden class="visual-only-label">TZ</span>
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
