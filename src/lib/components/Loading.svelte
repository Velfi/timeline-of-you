<div class="loading-spinner">
  <div class="spinner"></div>
</div>

<style>
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }

  .spinner {
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #333;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
