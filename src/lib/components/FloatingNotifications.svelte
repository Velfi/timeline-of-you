<script lang="ts">
  import { notifications } from '$lib/stores';
  import IconButton from './IconButton.svelte';
</script>

<div class="notifications">
  {#if $notifications.length > 1}
    <IconButton
      on:click={notifications.dismissAll}
      icon="mdi:notification-clear-all"
      text="dismiss all notifications"
      borderless
    />
  {/if}
  {#each $notifications as n}
    <div
      class="notification"
      class:success={n.type === 'success'}
      class:error={n.type === 'error'}
      class:warn={n.type === 'warn'}
    >
      <p class="message">
        {n.message}
      </p>
      <IconButton
        on:click={() => notifications.dismiss(n.id)}
        title="dismiss this notification"
        icon="ic:round-clear"
      />
    </div>
  {/each}
</div>

<style lang="scss">
  .notifications {
    position: fixed;
    top: 2rem;
    right: 0;
    z-index: 1000;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .notification {
    display: flex;
    justify-content: space-between;
    width: 22rem;
    background-color: var(--color-bg-1);
    border: var(--border);
    border-radius: var(--border-radius);
    padding: 0.5rem;
    margin-bottom: 1rem;
    align-items: flex-start;
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  .message {
    margin-bottom: 0;
    margin-right: 1rem;
    text-align: justify;
  }

  .success {
    border-color: aquamarine;
  }

  .error {
    border-color: crimson;
  }

  .warn {
    border-color: coral;
  }
</style>
