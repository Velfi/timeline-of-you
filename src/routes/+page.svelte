<h1>Welcome to A Timeline of Us</h1>

<div class="container">
  <p class="warning">
    WARNING: This app is under heavy development right now. Don't use it unless you're OK with
    things breaking and data being lost. I'll remove this banner when it's ready for prime time. If
    you do try out the app anyways and encounter any bugs, please let me know by <a
      href="https://github.com/Velfi/timeline-of-you/issues/new">filing an issue on GitHub</a
    >.
  </p>

  <p>
    This is a personal project that I'm working on to make it easier for me (and others like me) to
    keep track of when significant events in our lives happen. This app is free and open-source. No
    data is stored on my server. It's all stored in your browser or in JSON files.
  </p>

  <p>
    If you're interested in having a look around, click the Robot in the upper-left corner to open
    the menu.
  </p>

  <h2>🤞Currently Functioning Features🤞</h2>
  <ul>
    <li>
      <strong>Creating timelines</strong> - You can create timelines by navigating to the
      <a href="/new/timeline">new timeline</a> page.
    </li>
    <li>
      <strong>Adding events</strong> - You can add events to your timeline by navigating to the
      "quick-add events" page from the <a href="/manage/timelines">timeline management</a> page.
    </li>
    <li>
      <strong>Exporting timelines</strong> - You can export your timeline as a JSON file by clicking
      the "export timeline" link from the <a href="/manage/timelines">timeline management</a> page.
    </li>
    <li>
      <strong>Importing timelines</strong> - You can import previously-exported timelines from a
      JSON file by navigating to the <a href="/import/json">import JSON</a> page. That is, unless I broke
      imports by changing around the data structures again. 😅
    </li>
    <li>
      <strong>Viewing a timeline</strong> - Load a timeline from
      <a href="/manage/timelines">timeline management</a> page by clicking on its name. Currently, the
      timeline is not looking so good. I'm still working on how to present things.
    </li>
  </ul>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    max-width: 40rem;
    text-align: justify;
  }

  .warning {
    color: gold;
  }
</style>
