<script>
  import './styles.css';
</script>

<svelte:head>
  <title>Timeline</title>
  <meta name="description" content="A timeline of you" />
</svelte:head>

<div class="ui-grid">
  <div class="text-column">
    <h1>A Timeline of You</h1>

    <p>
      A tool for creating a persistent timeline of your life, ending with your likely date of death.
      You can add events in the past and future, filter events based on labels, and search for
      specific events too.
    </p>

    <p>
      The timeline can be panned and zoomed, and works on desktop or on mobile. You can export your
      timeline for safekeeping or to share it with someone.
    </p>

    <p>
      This software is free and the source code is viewable on GitHub. You are free to host your own
      timeline on your own website. If you have feature requests, bug reports, or other comments,
      please submit them through GitHub.
    </p>
  </div>
  <div class="text-column">
    <p>
      This is a new timeline. Start by entering your date of birth and the date you <a
        href="https://www.death-clock.org/">expect to die</a
      >.
    </p>
    <h2>Adding events to the timeline:</h2>
    <ol>
      <li>Decide on a life event that you want to add to the timeline.</li>
      <li>
        Click the date in the timeline where you want to add the event. You can change the date
        after creating the event, so don't worry if the date is slightly off.
      </li>
      <li>Enter that event's information and click "confirm"</li>
    </ol>
    <h2>Deleting events from the timeline:</h2>
    <p>
      Select an event and click the "delete" button. Then, confirm you want to delete the event.
    </p>
  </div>
  <div class="text-column">
    <ul class="tabs">
      <li>File</li>
      <li>Edit</li>
      <li>Event</li>
      <li>Profile</li>
    </ul>
  </div>
</div>
