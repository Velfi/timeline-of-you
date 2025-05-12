<script lang="ts">
  export let date: Date | string;
  export let format: 'short' | 'long' | 'relative' = 'short';
  export let hasMonth: boolean = true;
  export let hasDay: boolean = true;
  export let hasTime: boolean = false;

  $: dateObj = typeof date === 'string' ? new Date(date) : date;

  $: formattedDate = (() => {
    if (format === 'relative') {
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 7) {
        return dateObj.toLocaleDateString();
      } else if (days > 0) {
        return `${days}d ago`;
      } else if (hours > 0) {
        return `${hours}h ago`;
      } else if (minutes > 0) {
        return `${minutes}m ago`;
      } else {
        return 'just now';
      }
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      ...(hasMonth && { month: format === 'long' ? 'long' : 'short' }),
      ...(hasDay && { day: 'numeric' }),
      ...(hasTime && {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    return dateObj.toLocaleDateString(undefined, options);
  })();
</script>

<span class="datetime" title={dateObj.toISOString()}>
  {formattedDate}
</span>

<style>
  .datetime {
    display: inline;
    white-space: nowrap;
    color: var(--text-color, inherit);
  }
</style>
