<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { scaleLinear } from 'd3-scale';
  import { select } from 'd3-selection';
  import { zoom, zoomIdentity } from 'd3-zoom';
  import * as d3Force from 'd3-force';
  import type { TimelineEvent } from '$lib/db';
  import { browser } from '$app/environment';

  export let events: TimelineEvent[] = [];
  export let startYear: number;
  export let endYear: number;
  export let title: string;
  export let description: string;

  let container: HTMLDivElement;
  let width = 2000;
  let height = 400;
  let margin = { top: 20, right: 20, bottom: 40, left: 20 };

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
      width = Math.max(container.clientWidth, 2000);
      height = container.clientHeight;
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
    const eventY = timelineY - bandHeight / 2 - 250; // Increased from -120 to -250 for much more vertical space
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
          y: eventY + (Math.random() * 400 - 200), // Increased vertical randomness from 200 to 400
          fx: startX + i * labelSpacing,
          timelineX: xScale(eventDate),
          r: 12,
        };
      });

    // Setup the simulation with balanced forces
    simulation = d3Force
      .forceSimulation(nodes)
      .force('x', d3Force.forceX((d: TimelineNode) => d.fx).strength(0.05)) // Reduced from 0.1 to 0.05
      .force('y', d3Force.forceY(eventY).strength(0.02)) // Reduced from 0.05 to 0.02
      .force('charge', d3Force.forceManyBody().strength(-200)) // Increased from -150 to -200
      .force(
        'collision',
        d3Force
          .forceCollide<TimelineNode>()
          .radius((d: TimelineNode) => d.r + 80) // Increased from 60 to 80
          .strength(0.9)
      )
      .force('horizontalRepulsion', (alpha: number) => {
        nodes.forEach((node, i) => {
          nodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 200) {
              // Increased from 150 to 200
              const force = (200 - distance) * 0.1;
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
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', (d: TimelineNode) => d.x)
      .attr('y', (d: TimelineNode) => d.y - 20)
      .attr('text-anchor', 'middle')
      .text((d: TimelineNode) => d.name)
      .style('font-size', '14px')
      .style('fill', 'var(--color-text)')
      .style('pointer-events', 'none');

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
        labels.style('opacity', 0.2);
        lines.style('opacity', 0.1);
        select(this).style('opacity', 1);

        const circleIndex = nodes.findIndex((node) => node.id === d.id);
        if (circleIndex !== -1) {
          labels.filter((_: unknown, i: number) => i === circleIndex).style('opacity', 1);
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
          .attr('y', d.y - 40)
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
        labels.style('opacity', 1);
        lines.style('opacity', 0.5);
        hoverGroup.selectAll('*').remove();
      });

    // Setup zoom after drawing everything
    setupZoom();
  }

  function setupZoom() {
    // Initialize with identity transform
    transform = zoomIdentity;

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
    <button on:click={resetZoom} class="reset-button">Reset View</button>
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
    overflow: hidden; /* Changed from overflow-x: auto to prevent scrollbars */
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
</style>
