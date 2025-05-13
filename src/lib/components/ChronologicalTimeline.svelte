<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { scaleLinear } from 'd3-scale';
  import { select } from 'd3-selection';
  import { zoom, zoomIdentity } from 'd3-zoom';
  import * as d3Force from 'd3-force';
  import type { TimelineEvent } from '$lib/db';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import DateTime from './DateTime.svelte';
  import { DateTime as DateTimeType, MONTHS } from '$lib/types/date';

  export let events: TimelineEvent[] = [];
  export let startYear: number;
  export let endYear: number;
  export let title: string;
  export let description: string;

  let container: HTMLDivElement;
  let width = 6000;
  const TIMELINE_HEIGHT = 600; // Main timeline height
  const BAND_HEIGHT = 30; // Height of the timeline band
  const EVENT_VERTICAL_SPREAD = 400; // How far events can spread vertically from the timeline
  let height = TIMELINE_HEIGHT;
  let margin = { top: 20, right: 200, bottom: 40, left: 200 };
  let minWidth = 6000; // Minimum width to ensure timeline is always visible
  let maxWidth = 12000; // Maximum width to prevent excessive horizontal scrolling
  let baseEventSpacing = 150; // Base spacing between events
  let minYearWidth = 500; // Minimum width per year to ensure readability
  let selectedEvent: TimelineEvent | null = null;

  let xScale: any;
  let transform = zoomIdentity;
  let svg: any;
  let g: any;
  let simulation: any;
  let circles: any;
  let labels: any;
  let lines: any;
  let hoverGroup: any;
  let activeNode: TimelineNode | null = null;
  let timelineY: number;

  interface TimelineNode extends d3Force.SimulationNodeDatum {
    id: number;
    name: string;
    x: number;
    y: number;
    fx: number;
    r: number;
    timelineX: number;
  }

  let nodes: TimelineNode[] = [];

  function showNodeDetails(this: SVGCircleElement, d: TimelineNode) {
    // Fade out all elements
    circles.style('opacity', 0.2);
    labels.selectAll('foreignObject').style('opacity', 0.2);
    lines.style('opacity', 0.1);
    select(this).style('opacity', 1);

    const circleIndex = nodes.findIndex((node) => node.id === d.id);
    if (circleIndex !== -1) {
      // Highlight selected elements
      labels
        .filter((_: unknown, i: number) => i === circleIndex)
        .selectAll('foreignObject')
        .style('opacity', 1);
      lines.filter((_: unknown, i: number) => i === circleIndex).style('opacity', 0.9);
    }

    // Clear any existing hover elements
    hoverGroup.selectAll('*').remove();

    // Create hover elements in the correct order
    // First, create the connecting line
    const hoverLine = hoverGroup
      .append('path')
      .attr('d', () => {
        const controlPoint1Y = d.y + (timelineY - d.y) * 0.2;
        const controlPoint2Y = d.y + (timelineY - d.y) * 0.8;
        const controlPoint1X = d.timelineX - 20;
        const controlPoint2X = d.timelineX + 20;
        return `M${d.x},${d.y} C${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${d.timelineX},${timelineY}`;
      })
      .attr('stroke', 'var(--color-accent-2)')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('opacity', 1)
      .style('mix-blend-mode', 'normal'); // Change to normal blend mode for better visibility

    // Move the hover line to be under the circles
    hoverLine.lower();

    // Create a foreignObject for the date display
    const event = events.find((e) => e.id === d.id);
    if (event) {
      const dateGroup = hoverGroup.append('g').attr('transform', `translate(${d.x},${d.y + 40})`);

      const foreignObject = dateGroup
        .append('foreignObject')
        .attr('width', 400)
        .attr('height', 30)
        .attr('x', -200)
        .attr('y', -15);

      HoverDate.mount(foreignObject.node(), event);
    }

    // Update selected event
    selectedEvent = events.find((e) => e.id === d.id) || null;
  }

  function hideNodeDetails() {
    if (!activeNode) {
      // Restore all elements to full opacity
      circles.style('opacity', 1);
      labels.selectAll('foreignObject').style('opacity', 1);
      lines.style('opacity', 0.5);
      hoverGroup.selectAll('*').remove();
      selectedEvent = null;
    }
  }

  // Create a component for the hover text
  const HoverDate = new (class {
    mount(container: HTMLElement, event: TimelineEvent) {
      const div = document.createElement('div');
      div.style.textAlign = 'center';
      div.style.fontSize = '16px';
      div.style.color = 'var(--color-text)';
      div.style.pointerEvents = 'none';
      div.style.display = 'flex';
      div.style.justifyContent = 'center';
      div.style.alignItems = 'center';
      div.style.gap = '0.5em';

      const startDate = event.start.toDate();
      const startDiv = document.createElement('div');
      startDiv.className = 'datetime';
      startDiv.style.display = 'inline-block';
      startDiv.textContent = this.formatDate(startDate);
      div.appendChild(startDiv);

      if (event.end) {
        const dash = document.createElement('span');
        dash.textContent = '-';
        div.appendChild(dash);

        const endDate = event.end.toDate();
        const endDiv = document.createElement('div');
        endDiv.className = 'datetime';
        endDiv.style.display = 'inline-block';
        endDiv.textContent = this.formatDate(endDate);
        div.appendChild(endDiv);
      }

      container.appendChild(div);
    }

    private formatDate(date: Date): string {
      const dateTime = new DateTimeType(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes()
      );

      const parts: string[] = [];

      // Always show year
      parts.push(dateTime.year.toString());

      // Only add month if it's not January
      if (dateTime.month !== undefined && dateTime.month !== 1) {
        parts.push(MONTHS[dateTime.month - 1]);
      }

      // Only add day if it's not the 1st
      if (dateTime.day !== undefined && dateTime.day !== 1) {
        parts.push(dateTime.day.toString());
      }

      // Only add time if it's not midnight
      if (
        (dateTime.hour !== undefined && dateTime.hour !== 0) ||
        (dateTime.minute !== undefined && dateTime.minute !== 0)
      ) {
        const timeStr = `${(dateTime.hour || 0).toString().padStart(2, '0')}:${(
          dateTime.minute || 0
        )
          .toString()
          .padStart(2, '0')}`;
        parts.push(timeStr);
      }

      return parts.join(' ');
    }
  })();

  function updateDimensions() {
    if (container && browser) {
      // Calculate events per year
      const years = endYear - startYear;
      const eventsPerYear = events.length / years;

      // Calculate width based on both events per year and minimum year width
      const eventsBasedWidth = events.length * baseEventSpacing + margin.left + margin.right;
      const yearsBasedWidth = years * minYearWidth + margin.left + margin.right;

      // Use the larger of the two widths to ensure both criteria are met
      const optimalWidth = Math.max(
        minWidth,
        Math.min(maxWidth, Math.max(eventsBasedWidth, yearsBasedWidth))
      );

      width = optimalWidth;
      height = TIMELINE_HEIGHT; // Use the constant instead of hardcoded value
      setupScales();
      drawTimeline();
      setupZoom();
    }
  }

  onMount(() => {
    if (browser) {
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('resize', updateDimensions);
      if (simulation) {
        simulation.stop();
      }
    }
  });

  function setupScales() {
    // Convert start and end years to timestamps
    const startDate = new Date(startYear, 0, 1).getTime();
    const endDate = new Date(endYear, 11, 31).getTime();

    xScale = scaleLinear()
      .domain([startDate, endDate])
      .range([margin.left, width - margin.right]);
  }

  $: if (events && events.length > 0) {
    if (simulation) {
      simulation.stop();
    }
    drawTimeline();
  }

  function drawTimeline() {
    // Clear previous content
    if (svg) svg.remove();
    if (simulation) simulation.stop();

    // Setup scales first
    setupScales();

    svg = select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('overflow', 'visible')
      .style('touch-action', 'none') // Prevent default touch actions
      .attr('color-interpolation-filters', 'sRGB'); // Enable premultiplied alpha

    g = svg.append('g');

    // Draw timeline band (rectangle)
    timelineY = height / 2;
    g.append('rect')
      .attr('x', margin.left)
      .attr('y', timelineY - BAND_HEIGHT / 2)
      .attr('width', width - margin.left - margin.right)
      .attr('height', BAND_HEIGHT)
      .attr('fill', 'var(--color-bg-1)')
      .attr('stroke', 'var(--color-theme-2)')
      .attr('stroke-width', 1);

    // Add year ticks
    const yearStep = Math.max(1, Math.ceil((endYear - startYear) / 20));
    for (let year = startYear; year <= endYear; year += yearStep) {
      const date = new Date(year, 0, 1).getTime();
      const x = xScale(date);
      g.append('line')
        .attr('x1', x)
        .attr('y1', timelineY - BAND_HEIGHT / 2)
        .attr('x2', x)
        .attr('y2', timelineY + BAND_HEIGHT / 2)
        .attr('stroke', 'var(--color-theme-2)')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', x)
        .attr('y', timelineY + BAND_HEIGHT / 2 + 20)
        .attr('text-anchor', 'middle')
        .text(year)
        .style('font-size', '14px')
        .style('fill', 'var(--color-theme-2)');
    }

    // Create nodes for force simulation
    const eventY = timelineY - BAND_HEIGHT / 2 - EVENT_VERTICAL_SPREAD;
    const labelSpacing = 150;
    const startX = margin.left + 50;

    nodes = events
      .sort((a, b) => {
        const dateA = a.start.toDate().getTime();
        const dateB = b.start.toDate().getTime();
        return dateA - dateB;
      })
      .map((event, i) => {
        const eventDate = event.start.toDate().getTime();
        return {
          id: event.id || i,
          name: event.name,
          x: startX + i * labelSpacing,
          y: eventY + (Math.random() * 600 - 300),
          fx: startX + i * labelSpacing,
          timelineX: xScale(eventDate),
          r: 12,
        };
      });

    simulation = d3Force
      .forceSimulation(nodes)
      .force('x', d3Force.forceX((d: TimelineNode) => d.fx).strength(0.2))
      .force('y', d3Force.forceY(eventY).strength(0.02))
      .force('charge', d3Force.forceManyBody().strength(-100))
      .force(
        'collision',
        d3Force
          .forceCollide<TimelineNode>()
          .radius((d: TimelineNode) => d.r + 100)
          .strength(0.9)
      )
      .force('horizontalRepulsion', (alpha: number) => {
        nodes.forEach((node, i) => {
          nodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 250) {
              const force = (250 - distance) * 0.1;
              const angle = Math.atan2(dy, dx);
              node.x += Math.cos(angle) * force * alpha;
              other.x -= Math.cos(angle) * force * alpha;
              node.y += Math.sin(angle) * force * alpha;
              other.y -= Math.sin(angle) * force * alpha;
            }
          });
        });
      });

    for (let i = 0; i < 1000; i++) {
      simulation.tick();
    }
    simulation.stop();

    const eventGroup = g.append('g').attr('class', 'events');

    // Create lines first so they appear under other elements
    lines = eventGroup
      .append('g')
      .attr('class', 'connecting-lines')
      .selectAll('path')
      .data(nodes)
      .enter()
      .append('path')
      .attr('d', (d: TimelineNode) => {
        const controlPoint1Y = d.y + (timelineY - d.y) * 0.2;
        const controlPoint2Y = d.y + (timelineY - d.y) * 0.8;
        const controlPoint1X = d.timelineX - 20;
        const controlPoint2X = d.timelineX + 20;
        return `M${d.x},${d.y} C${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${d.timelineX},${timelineY}`;
      })
      .attr('stroke', 'var(--color-accent-1)')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7)
      .style('mix-blend-mode', 'normal'); // Change to normal blend mode for better visibility

    // Create circles after lines
    circles = eventGroup
      .append('g')
      .attr('class', 'event-circles')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: TimelineNode) => d.r)
      .attr('fill', 'var(--color-accent-1)')
      .attr('cursor', 'pointer')
      .attr('cx', (d: TimelineNode) => d.x)
      .attr('cy', (d: TimelineNode) => d.y)
      .style('mix-blend-mode', 'normal');

    // Create labels last so they appear on top
    labels = eventGroup
      .append('g')
      .attr('class', 'event-labels')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d: TimelineNode) => `translate(${d.x},${d.y - 20})`);

    labels
      .append('foreignObject')
      .attr('width', 400)
      .attr('height', 100)
      .attr('x', -200)
      .attr('y', -40)
      .append('xhtml:div')
      .style('text-align', 'center')
      .style('font-size', '18px')
      .style('color', 'var(--color-text)')
      .style('pointer-events', 'none')
      .style('word-wrap', 'break-word')
      .style('width', '400px')
      .style('white-space', 'normal')
      .text((d: TimelineNode) => d.name);

    hoverGroup = g.append('g').attr('class', 'hover-elements');

    // Add mouseover and click events to circles
    circles
      .on('mouseover', function (this: SVGCircleElement, event: MouseEvent, d: TimelineNode) {
        if (!activeNode) {
          showNodeDetails.call(this, d);
        }
      })
      .on('mouseout', function () {
        if (!activeNode) {
          hideNodeDetails();
        }
      })
      .on('click', function (this: SVGCircleElement, event: MouseEvent, d: TimelineNode) {
        event.stopPropagation();
        if (activeNode && activeNode.id === d.id) {
          // If clicking the same node, deselect it
          activeNode = null;
          hideNodeDetails();
        } else {
          // Select the new node
          activeNode = d;
          showNodeDetails.call(this, d);
        }
      });

    // Add click handler to the SVG to deselect when clicking outside
    svg.on('click', () => {
      activeNode = null;
      hideNodeDetails();
    });

    // Setup zoom after drawing everything
    setupZoom();
  }

  function setupZoom() {
    // Calculate initial zoom level to fit the entire timeline
    const contentWidth = width - margin.left - margin.right;
    const contentHeight = height - margin.top - margin.bottom;
    const scaleX = contentWidth / width;
    const scaleY = contentHeight / height;
    const initialScale = Math.min(scaleX, scaleY);

    // Initialize with calculated transform
    transform = zoomIdentity.scale(initialScale);

    const zoomBehavior = zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        transform = event.transform;
        g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
      });

    // Apply initial transform
    g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);

    // Apply zoom behavior to the SVG
    svg.call(zoomBehavior);

    // Add visual feedback for panning
    svg
      .on('mousedown', () => {
        container.style.cursor = 'grabbing';
      })
      .on('mouseup', () => {
        container.style.cursor = 'grab';
      })
      .on('mouseleave', () => {
        container.style.cursor = 'grab';
      });
  }

  function resetZoom() {
    // Calculate the scale needed to fit the timeline in view
    const contentWidth = width - margin.left - margin.right;
    // Add extra padding for events above and below the timeline
    const contentHeight = height + EVENT_VERTICAL_SPREAD * 2; // Use the constant for consistency
    const scaleX = contentWidth / width;
    const scaleY = contentHeight / height;
    const initialScale = Math.min(scaleX, scaleY);

    // Calculate the translation needed to center the timeline
    const translateX = (container.clientWidth - width * initialScale) / 2;
    const translateY = (container.clientHeight - height * initialScale) / 2;

    // Create and apply the transform
    transform = zoomIdentity.translate(translateX, translateY).scale(initialScale);
    svg.transition().duration(750).call(zoom().transform, transform);
    g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
  }

  function navigateToEvent(event: TimelineEvent) {
    // Reset highlighting first
    circles.style('opacity', 1);
    labels.selectAll('foreignObject').style('opacity', 1);
    lines.style('opacity', 0.5);
    hoverGroup.selectAll('*').remove();

    selectedEvent = event;
    const node = nodes.find((n) => n.id === event.id);
    if (node) {
      // Find the circle element for this node
      const circle = g
        .select('.event-circles')
        .selectAll('circle')
        .filter((d: TimelineNode) => d.id === event.id);
      if (!circle.empty()) {
        // Update activeNode before showing details
        activeNode = node;

        // Show details directly instead of triggering click
        showNodeDetails.call(circle.node(), node);

        // Calculate the center position of the node
        const nodeX = node.x;
        const nodeY = node.y;

        // Calculate the current viewport dimensions
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        // Calculate the transform needed to center the node
        const scale = transform.k;
        const translateX = viewportWidth / 2 - nodeX * scale;
        const translateY = viewportHeight / 2 - nodeY * scale;

        // Apply the transform with animation
        transform = zoomIdentity.translate(translateX, translateY).scale(scale);
        svg.transition().duration(750).call(zoom().transform, transform);
        g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
      }
    }
  }

  function navigateToPreviousEvent() {
    if (!selectedEvent) return;
    const currentIndex = events.findIndex((e) => e.id === selectedEvent?.id);
    if (currentIndex > 0) {
      navigateToEvent(events[currentIndex - 1]);
    }
  }

  function navigateToNextEvent() {
    if (!selectedEvent) return;
    const currentIndex = events.findIndex((e) => e.id === selectedEvent?.id);
    if (currentIndex < events.length - 1) {
      navigateToEvent(events[currentIndex + 1]);
    }
  }

  function hasTime(date: Date): boolean {
    return date.getHours() !== 0 || date.getMinutes() !== 0;
  }

  function hasDay(date: Date): boolean {
    return date.getDate() !== 1;
  }

  function hasMonth(date: Date): boolean {
    return date.getMonth() !== 0;
  }

  function dateToDateTime(date: Date): DateTimeType {
    return new DateTimeType(
      date.getFullYear(),
      date.getMonth() + 1, // Convert from 0-based to 1-based month
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    );
  }
</script>

<div class="timeline-container">
  <div class="header">
    <h2>{title}</h2>
    <div class="controls">
      <a href="/timeline/{$page.params.id}/events" class="events-link">View All Events</a>
      <button on:click={resetZoom} class="reset-button">Reset View</button>
    </div>
  </div>
  <p class="description">{description}</p>
  <div class="timeline" bind:this={container} />
  {#if selectedEvent}
    <div class="event-navigation">
      <div class="nav-button-wrapper">
        <button
          class="nav-button"
          on:click={navigateToPreviousEvent}
          disabled={events.findIndex((e) => e.id === selectedEvent?.id) === 0}
        >
          ← Previous
        </button>
      </div>
      <div class="event-carousel">
        {#if events.findIndex((e) => e.id === selectedEvent?.id) > 0}
          {@const prevEvent = events[events.findIndex((e) => e.id === selectedEvent?.id) - 1]}
          <div class="carousel-event prev-event">
            <div class="subtitle-title">{prevEvent.name}</div>
            <div class="subtitle-date">
              {#if selectedEvent.start}
                <DateTime date={selectedEvent.start} />
              {/if}
              {#if selectedEvent.end}
                &nbsp;&mdash;&nbsp;
                <DateTime date={selectedEvent.end} />
              {/if}
            </div>
          </div>
        {/if}
        <div class="subtitle-box">
          <div class="subtitle-title">{selectedEvent.name}</div>
          <div class="subtitle-date">
            {#if selectedEvent.start}
              <DateTime date={selectedEvent.start} />
            {/if}
            {#if selectedEvent.end}
              &nbsp;&mdash;&nbsp;
              <DateTime date={selectedEvent.end} />
            {/if}
          </div>
          {#if selectedEvent.description}
            <div class="subtitle-description">{selectedEvent.description}</div>
          {/if}
        </div>
        {#if events.findIndex((e) => e.id === selectedEvent?.id) < events.length - 1}
          {@const nextEvent = events[events.findIndex((e) => e.id === selectedEvent?.id) + 1]}
          <div class="carousel-event next-event">
            <div class="subtitle-title">{nextEvent.name}</div>
            <div class="subtitle-date">
              {#if selectedEvent.start}
                <DateTime date={selectedEvent.start} />
              {/if}
              {#if selectedEvent.end}
                &nbsp;&mdash;&nbsp;
                <DateTime date={selectedEvent.end} />
              {/if}
            </div>
          </div>
        {/if}
      </div>
      <div class="nav-button-wrapper">
        <button
          class="nav-button"
          on:click={navigateToNextEvent}
          disabled={events.findIndex((e) => e.id === selectedEvent?.id) === events.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .timeline-container {
    padding: 20px;
    background: var(--color-bg-0);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  h2 {
    margin: 0;
    color: var(--color-text);
  }

  .description {
    color: var(--color-theme-1);
    margin-bottom: 20px;
  }

  .timeline {
    height: 600px; /* Match TIMELINE_HEIGHT constant */
    min-height: 0;
    cursor: grab;
    overflow: hidden;
    width: 100%;
    white-space: nowrap;
    position: relative;
    border: 1px solid var(--color-theme-2);
    user-select: none;
  }

  .timeline:active {
    cursor: grabbing;
  }

  .reset-button {
    padding: var(--input-padding);
    background: var(--color-accent-1);
    color: var(--color-bg-0);
    border: var(--border);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: inherit;
    height: var(--input-height);
  }

  .reset-button:hover {
    background: var(--color-accent-2);
  }

  .events-link {
    color: var(--color-accent-1);
    text-decoration: none;
    font-size: 16px;
    padding: var(--input-padding);
    border: var(--border);
    border-radius: var(--border-radius);
    transition: background-color 0.2s;
  }

  .events-link:hover {
    background: var(--color-accent-1);
    color: var(--color-bg-0);
  }

  .event-navigation {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-areas: 'prev carousel next';
    gap: 20px;
    margin-top: 20px;
    align-items: center;
  }

  .event-carousel {
    grid-area: carousel;
    display: grid;
    grid-template-columns: 1fr minmax(auto, 400px) 1fr;
    gap: 20px;
    perspective: 1000px;
    align-items: stretch;
  }

  .carousel-event {
    background: var(--color-bg-1);
    border: 1px solid var(--color-theme-2);
    border-radius: var(--border-radius);
    padding: 15px 25px;
    color: var(--color-text);
    max-width: 600px;
    opacity: 0.5;
    transform: scale(0.9);
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .carousel-event .subtitle-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--color-accent-1);
  }

  .carousel-event .subtitle-date {
    font-size: 14px;
    color: var(--color-theme-1);
  }

  .prev-event {
    grid-column: 1;
    transform: translateX(20px) scale(0.9) rotateY(10deg);
    height: 100%;
  }

  .next-event {
    grid-column: 3;
    transform: translateX(-20px) scale(0.9) rotateY(-10deg);
    height: 100%;
  }

  .nav-button-wrapper {
    display: grid;
    align-items: center;
    height: calc(100% - 30px); /* Account for subtitle-box padding (15px top + 15px bottom) */
  }

  .nav-button-wrapper:first-child {
    grid-area: prev;
  }

  .nav-button-wrapper:last-child {
    grid-area: next;
  }

  .nav-button {
    padding: 0 16px;
    background: var(--color-accent-1);
    color: var(--color-bg-0);
    border: var(--border);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
    transition: background-color 0.2s;
    min-width: 100px;
    height: 40px; /* Fixed height for buttons */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-button:hover:not(:disabled) {
    background: var(--color-accent-2);
  }

  .nav-button:disabled {
    background: var(--color-bg-2);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  .subtitle-box {
    grid-column: 2;
    background: var(--color-bg-1);
    border: 1px solid var(--color-theme-2);
    border-radius: var(--border-radius);
    padding: 15px 25px;
    text-align: left;
    color: var(--color-text);
    max-width: 800px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .subtitle-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--color-accent-1);
  }

  .subtitle-date {
    font-size: 16px;
    color: var(--color-theme-1);
    margin-bottom: 8px;
  }

  .subtitle-description {
    font-size: 16px;
    line-height: 1.4;
    color: var(--color-text);
  }
</style>
