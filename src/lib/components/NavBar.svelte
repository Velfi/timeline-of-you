<script lang="ts">
  import { page } from '$app/stores';
</script>

<nav class="navbar">
  <div class="nav-content">
    <a href="/" class="logo">A Timeline of Us</a>
    <div class="nav-links">
      <a href="/timelines" class:active={$page.url.pathname.startsWith('/timelines')}>Timelines</a>
      <a href="/database" class:active={$page.url.pathname.startsWith('/database')}>Database</a>
    </div>
  </div>
</nav>

<style lang="scss">
  .navbar {
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    padding: 0.5rem 1rem;
  }

  .nav-content {
    max-width: 80rem;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-weight: bold;
    text-decoration: none;
    color: inherit;
    font-size: 1.2rem;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    align-items: center;

    a {
      color: inherit;
      text-decoration: none;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--background-hover);
      }

      &.active {
        background-color: var(--background-hover);
        font-weight: 500;
      }
    }
  }
</style>
