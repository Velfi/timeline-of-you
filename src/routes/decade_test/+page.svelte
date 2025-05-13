<script lang="ts">
  import Decade from '$lib/components/Decade.svelte';
  const startYear = 2020;
  const endYear = 2029;
</script>

<div class="test-container">
  <h1>Decade Test</h1>
  <p>Try zooming in and out to see different time scales!</p>

  <div class="decade-container">
    <Decade {startYear} {endYear} />
  </div>
</div>

<style>
  .test-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    color: var(--color-theme-1);
    margin-bottom: 1rem;
  }

  p {
    color: var(--color-theme-2);
    margin-bottom: 2rem;
  }

  .decade-container {
    width: 100%;
    height: 400px;
    border: 1px solid var(--color-theme-2);
    border-radius: 8px;
    overflow: hidden;
  }
</style>
