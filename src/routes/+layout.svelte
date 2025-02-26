<script lang="ts">
  import './styles.css';
  // import { now } from '$lib/stores';
  import FloatingNotifications from '$lib/components/FloatingNotifications.svelte';
  // import FloatingMenu from '$lib/components/FloatingMenu.svelte';

  // const intlDateTimeFormat = new Intl.DateTimeFormat(undefined, {
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric',
  //   hour: 'numeric',
  //   minute: 'numeric',
  //   weekday: 'long',
  //   timeZoneName: 'short',
  // });
</script>

<div class="container">
  <FloatingNotifications />
  <!-- <FloatingMenu /> -->

  <main>
    <slot />
  </main>

  <!-- <footer>
    <p>It is currently {intlDateTimeFormat.format($now)}.</p>
    <p class="italic">Make sure this is correct or else your timeline might get out of whack.</p>
  </footer> -->
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

  // footer {
  //   align-self: flex-end;
  //   padding: 1rem;
  //   text-align: right;
  //   z-index: 1;

  //   & > p {
  //     margin: 0;
  //     font-size: 80%;
  //   }
  // }

  .container {
    display: grid;
    grid-template-rows: min-content auto min-content;
    min-height: 100vh;
  }

  // .italic {
  //   font-style: italic;
  // }
</style>
