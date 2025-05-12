<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { scaleLinear } from 'd3-scale';
  import { select } from 'd3-selection';
  import { zoom, zoomIdentity } from 'd3-zoom';
  import * as d3Force from 'd3-force';
  import type { TimelineEvent } from '$lib/db';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  export let events: TimelineEvent[] = [];
  export let startYear: number;
  export let endYear: number;
  export let title: string;
  export let description: string;

  let container: HTMLDivElement;
  let width = 6000;
  let height = 400;
  let margin = { top: 20, right: 200, bottom: 40, left: 200 };
  let widthMultiplier = 1; // New variable for width adjustment

  let xScale: any;
  let transform = zoomIdentity;
  let svg: any;
  let g: any;
  let simulation: any;

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

  function updateDimensions() {
    if (container && browser) {
      width = Math.max(container.clientWidth, 6000 * widthMultiplier);
      height = container.clientHeight;
      setupScales();
      drawTimeline();
      setupZoom();
    }
  }

  function handleWidthChange(event: Event) {
    const target = event.target as HTMLInputElement;
    widthMultiplier = parseFloat(target.value);

    // Recalculate node positions based on new width
    if (nodes.length > 0) {
      const newWidth = Math.max(container.clientWidth, 6000 * widthMultiplier);
      const contentWidth = newWidth - margin.left - margin.right;
      const labelSpacing = contentWidth / (nodes.length + 1);
      const startX = margin.left + labelSpacing;

      nodes.forEach((node, i) => {
        node.fx = startX + i * labelSpacing;
      });

      // Restart simulation with new positions
      if (simulation) {
        simulation.alpha(1).restart();
      }
    }

    updateDimensions();
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
      .style('touch-action', 'none'); // Prevent default touch actions

    g = svg.append('g');

    // Draw timeline band (rectangle)
    const bandHeight = 30;
    const timelineY = height / 2;
    g.append('rect')
      .attr('x', margin.left)
      .attr('y', timelineY - bandHeight / 2)
      .attr('width', width - margin.left - margin.right)
      .attr('height', bandHeight)
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
        .attr('y1', timelineY - bandHeight / 2)
        .attr('x2', x)
        .attr('y2', timelineY + bandHeight / 2)
        .attr('stroke', 'var(--color-theme-2)')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', x)
        .attr('y', timelineY + bandHeight / 2 + 20)
        .attr('text-anchor', 'middle')
        .text(year)
        .style('font-size', '10px')
        .style('fill', 'var(--color-theme-2)');
    }

    // Create nodes for force simulation
    const eventY = timelineY - bandHeight / 2 - 400; // Increased from -250 to -400 for more vertical space
    const labelSpacing = 150; // Space between labels
    const startX = margin.left + 50; // Start position for labels

    nodes = events
      .sort((a, b) => {
        // Sort by full date
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
          y: eventY + (Math.random() * 600 - 300), // Increased vertical randomness from 400 to 600
          fx: startX + i * labelSpacing,
          timelineX: xScale(eventDate),
          r: 12,
        };
      });

    // Setup the simulation with balanced forces
    simulation = d3Force
      .forceSimulation(nodes)
      .force('x', d3Force.forceX((d: TimelineNode) => d.fx).strength(0.05))
      .force('y', d3Force.forceY(eventY).strength(0.02))
      .force('charge', d3Force.forceManyBody().strength(-300)) // Increased from -200 to -300
      .force(
        'collision',
        d3Force
          .forceCollide<TimelineNode>()
          .radius((d: TimelineNode) => d.r + 100) // Increased from 80 to 100
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
              // Increased from 200 to 250
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

    // Run simulation to settle positions
    for (let i = 0; i < 1000; i++) {
      simulation.tick();
    }
    simulation.stop();

    // Now create the visualization groups with updated node positions
    const eventGroup = g.append('g').attr('class', 'events');

    // First layer: paths (bottom layer)
    const lines = eventGroup
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
      .attr('opacity', 0.5);

    // Second layer: labels (middle layer)
    const labels = eventGroup
      .append('g')
      .attr('class', 'event-labels')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d: TimelineNode) => `translate(${d.x},${d.y - 20})`);

    // Add foreignObject for HTML text wrapping
    labels
      .append('foreignObject')
      .attr('width', 200)
      .attr('height', 100)
      .attr('x', -100) // Center the text
      .attr('y', -40)
      .append('xhtml:div')
      .style('text-align', 'center')
      .style('font-size', '14px')
      .style('color', 'var(--color-text)')
      .style('pointer-events', 'none')
      .style('word-wrap', 'break-word')
      .style('width', '200px')
      .text((d: TimelineNode) => d.name);

    // Third layer: circles (top layer)
    const circles = eventGroup
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
      .attr('cy', (d: TimelineNode) => d.y);

    // Add hover group for interactive elements
    const hoverGroup = g.append('g').attr('class', 'hover-elements');

    // Add mouseover events to circles
    circles
      .on('mouseover', function (this: SVGCircleElement, event: MouseEvent, d: TimelineNode) {
        circles.style('opacity', 0.2);
        labels.selectAll('foreignObject').style('opacity', 0.2);
        lines.style('opacity', 0.1);
        select(this).style('opacity', 1);

        const circleIndex = nodes.findIndex((node) => node.id === d.id);
        if (circleIndex !== -1) {
          labels
            .filter((_: unknown, i: number) => i === circleIndex)
            .selectAll('foreignObject')
            .style('opacity', 1);
          lines.filter((_: unknown, i: number) => i === circleIndex).style('opacity', 0.8);
        }

        // Show connecting line (highlighted)
        hoverGroup
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
          .attr('opacity', 1);

        // Show date
        hoverGroup
          .append('text')
          .attr('x', d.x)
          .attr('y', d.y - 60) // Moved up to accommodate wrapped text
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', 'var(--color-text)')
          .text(() => {
            const event = events.find((e) => e.id === d.id);
            if (!event) return '';

            const startDate = event.start.toDate().toLocaleDateString();
            if (!event.end) return startDate;

            const endDate = event.end.toDate().toLocaleDateString();
            return `${startDate} - ${endDate}`;
          });
      })
      .on('mouseout', function () {
        circles.style('opacity', 1);
        labels.selectAll('foreignObject').style('opacity', 1);
        lines.style('opacity', 0.5);
        hoverGroup.selectAll('*').remove();
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
    transform = zoomIdentity.scale(initialScale).translate(width * 0.1, height * 0.1);

    const zoomBehavior = zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        // Constrain panning to keep content visible
        const newTransform = event.transform;
        const xMin = -width * 0.5;
        const xMax = width * 0.5;
        const yMin = -height * 0.5;
        const yMax = height * 0.5;

        newTransform.x = Math.min(Math.max(newTransform.x, xMin), xMax);
        newTransform.y = Math.min(Math.max(newTransform.y, yMin), yMax);

        transform = newTransform;
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
    transform = zoomIdentity;
    svg.transition().duration(750).call(zoom().transform, zoomIdentity);
    g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
  }
</script>

<div class="timeline-container">
  <div class="header">
    <h2>{title}</h2>
    <div class="controls">
      <a href="/timeline/{$page.params.id}/events" class="events-link">View All Events</a>
      <div class="width-control">
        <label for="width-slider">Timeline Scale:</label>
        <input
          type="range"
          id="width-slider"
          min="0.1"
          max="3"
          step="0.1"
          value={widthMultiplier}
          on:input={handleWidthChange}
        />
        <span class="width-value">{Math.round(widthMultiplier * 100)}%</span>
      </div>
      <button on:click={resetZoom} class="reset-button">Reset View</button>
    </div>
  </div>
  <p class="description">{description}</p>
  <div class="timeline" bind:this={container} />
</div>

<style>
  .timeline-container {
    padding: 20px;
    background: var(--color-bg-0);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    min-height: 90vh;
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

  .width-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .width-control label {
    color: var(--color-text);
    font-size: 14px;
  }

  .width-control input[type='range'] {
    width: 150px;
    cursor: pointer;
  }

  .width-value {
    color: var(--color-text);
    font-size: 14px;
    min-width: 50px;
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
    flex: 1;
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
    font-size: 14px;
    padding: var(--input-padding);
    border: var(--border);
    border-radius: var(--border-radius);
    transition: background-color 0.2s;
  }

  .events-link:hover {
    background: var(--color-accent-1);
    color: var(--color-bg-0);
  }
</style>
