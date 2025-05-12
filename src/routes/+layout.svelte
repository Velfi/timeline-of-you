<script lang="ts">
  import './styles.css';
  import { now } from '$lib/stores';
  import FloatingNotifications from '$lib/components/FloatingNotifications.svelte';
  // import FloatingMenu from '$lib/components/FloatingMenu.svelte';

  const intlDateTimeFormat = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'long',
    timeZoneName: 'short',
  });
</script>

<div class="container">
  <FloatingNotifications />
  <!-- <FloatingMenu /> -->

  <main>
    <slot />
  </main>

  <footer>
    <nav>
      <p>Manage:</p>
      <a href="/timelines">Timelines</a> |
      <a href="/database">Database</a>
    </nav>
    <p>It is currently {intlDateTimeFormat.format($now)}.</p>
    <p class="italic">Make sure this is correct or else your timeline might get out of whack.</p>
  </footer>
</div>

<style lang="scss">
  main {
    padding: 1rem;
    // max-width: 80rem;
    // margin: 0 auto;

    // .floating-menu-spacer {
    //   float: left;
    //   width: 7rem;
    //   height: 6rem;
    // }
  }

  footer {
    align-self: flex-end;
    padding: 1rem;
    text-align: right;
    z-index: 1;

    & > p {
      margin: 0;
      font-size: 80%;
    }

    nav {
      margin-top: 0.5rem;
      font-size: 80%;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;

      a {
        color: inherit;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .container {
    display: grid;
    grid-template-rows: min-content auto min-content;
    min-height: 100vh;
  }

  // .italic {
  //   font-style: italic;
  // }
</style>
