<script lang="ts">
  import { goto } from '$app/navigation';
  import { notifications, timeline } from '$lib/stores';

  let fileList: FileList | undefined = undefined;
  let file: File | undefined = undefined;

  function handleFile() {
    if (fileList !== undefined) {
      file = fileList[0];
    }
  }

  async function handleImport() {
    if (file !== undefined) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (typeof e.target?.result === 'string') {
          const result = e.target?.result;
          try {
            await timeline.loadFromJSON(result);
            await timeline.saveToDb();
            notifications.add(
              'success',
              'Successfully imported a timeline from JSON. This timeline has been saved to your browser.'
            );
            goto('/manage/timelines');
          } catch (e) {
            console.error(e);
            notifications.add(
              'error',
              "Failed to import that timeline. Are you sure it's a valid timeline file?"
            );
          }
        }
      };
      reader.readAsText(file);
    }
  }
</script>

<!-- A svelte component allowing a user to upload a JSON file and then convert it into a timeline -->

<div class="container">
  <h1>Import a timeline</h1>

  <p>
    You can import a timeline from a JSON file. This file should be in the format of a timeline
    exported from this app.
  </p>

  <p>
    <label for="file">Select a file</label>
    <input type="file" id="file" accept=".json" bind:files={fileList} on:change={handleFile} />
  </p>

  {#if file}
    <p>
      <strong>File name:</strong>
      {file.name}
    </p>
    <p>
      <strong>File size:</strong>
      {file.size} bytes
    </p>
    <p>
      <strong>File type:</strong>
      {file.type}
    </p>
  {/if}

  <p>
    <button on:click={handleImport}>Import</button>
  </p>
</div>
