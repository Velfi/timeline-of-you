<script lang="ts">
  import './styles.css';
  import { now } from '$lib/stores';
  import FloatingNotifications from '$lib/components/FloatingNotifications.svelte';
  import DateTimeDisplay from '$lib/components/datetime/DateTimeDisplay.svelte';
  import NavBar from '$lib/components/NavBar.svelte';

  $: currentDateTime = $now;
</script>

<div class="container">
  <NavBar />
  <FloatingNotifications />
  <!-- <FloatingMenu /> -->

  <main>
    <slot />
  </main>

  <footer>
    <p>It is currently <DateTimeDisplay date={currentDateTime} />.</p>
    <p class="italic">Make sure this is correct or else your timeline might get out of whack.</p>
  </footer>
</div>

<style lang="scss">
  main {
    padding: 1rem;
    max-width: 80rem;
    margin: 0 auto;
    width: 100%;
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
  }

  .container {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
  }

  // .italic {
  //   font-style: italic;
  // }
</style>
