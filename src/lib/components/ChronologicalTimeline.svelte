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
  let width = 800;
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
  }

  let nodes: TimelineNode[] = [];

  function updateDimensions() {
    if (container && browser) {
      width = container.clientWidth;
      height = container.clientHeight;
      setupScales();
      drawTimeline();
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

  function drawTimeline() {
    // Clear previous content
    if (svg) svg.remove();
    if (simulation) simulation.stop();

    svg = select(container).append('svg').attr('width', width).attr('height', height);

    g = svg.append('g');

    // Draw timeline band (rectangle)
    const bandHeight = 30;
    g.append('rect')
      .attr('x', margin.left)
      .attr('y', height / 2 - bandHeight / 2)
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
        .attr('y1', height / 2 - bandHeight / 2)
        .attr('x2', x)
        .attr('y2', height / 2 + bandHeight / 2)
        .attr('stroke', 'var(--color-theme-2)')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', x)
        .attr('y', height / 2 + bandHeight / 2 + 20)
        .attr('text-anchor', 'middle')
        .text(year)
        .style('font-size', '10px')
        .style('fill', 'var(--color-theme-2)');
    }

    // Create nodes for force simulation
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
          x: xScale(eventDate),
          y: height / 2,
          fx: xScale(eventDate),
          r: 5,
        };
      });

    // Create force simulation
    simulation = d3Force
      .forceSimulation<TimelineNode>(nodes)
      .force('x', d3Force.forceX<TimelineNode>((d) => d.fx).strength(1))
      .force('y', d3Force.forceY<TimelineNode>(height / 2).strength(0.1)) // Reduced y-force strength
      .force(
        'collision',
        d3Force.forceCollide<TimelineNode>().radius((d) => d.r + 30)
      )
      .force('charge', d3Force.forceManyBody().strength(-100))
      .force(
        'vertical',
        d3Force
          .forceY<TimelineNode>((d, i) => {
            // Distribute nodes vertically based on their index
            const spacing = (height - margin.top - margin.bottom) / (nodes.length + 1);
            return margin.top + spacing * (i + 1);
          })
          .strength(0.5)
      )
      .on('tick', ticked);

    // Draw events
    const eventGroup = g.append('g').attr('class', 'events');

    // Add a group for hover elements
    const hoverGroup = g.append('g').attr('class', 'hover-elements');

    const circles = eventGroup
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: TimelineNode) => d.r)
      .attr('fill', 'var(--color-accent-1)')
      .attr('cursor', 'pointer')
      .on('mouseover', function (this: SVGCircleElement, event: MouseEvent, d: TimelineNode) {
        // Fade other elements
        circles.style('opacity', 0.2);
        labels.style('opacity', 0.2);
        select(this).style('opacity', 1);
        // Find the corresponding label for this circle
        const circleIndex = nodes.findIndex((node) => node.id === d.id);
        if (circleIndex !== -1) {
          labels.filter((_: unknown, i: number) => i === circleIndex).style('opacity', 1);
        }

        // Show connecting line
        const line = hoverGroup
          .append('line')
          .attr('x1', d.x)
          .attr('y1', d.y)
          .attr('x2', d.x)
          .attr('y2', height / 2)
          .attr('stroke', 'var(--color-accent-1)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');

        // Show date
        const dateText = hoverGroup
          .append('text')
          .attr('x', d.x)
          .attr('y', height / 2 + 40)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', 'var(--color-text)')
          .text(
            events
              .find((e) => e.id === d.id)
              ?.start.toDate()
              .toLocaleDateString()
          );
      })
      .on('mouseout', function () {
        // Restore opacity
        circles.style('opacity', 1);
        labels.style('opacity', 1);

        // Remove connecting line and date
        hoverGroup.selectAll('*').remove();
      });

    const labels = eventGroup
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('dy', '0.35em')
      .text((d: TimelineNode) => d.name)
      .style('font-size', '12px')
      .style('fill', 'var(--color-text)')
      .style('pointer-events', 'none');

    function ticked() {
      circles.attr('cx', (d: TimelineNode) => d.x).attr('cy', (d: TimelineNode) => d.y);

      labels.attr('x', (d: TimelineNode) => d.x + 10).attr('y', (d: TimelineNode) => d.y);
    }
  }

  function setupZoom() {
    const zoomBehavior = zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        transform = event.transform;
        g.attr('transform', transform);
      });

    svg.call(zoomBehavior);
  }

  function resetZoom() {
    svg.transition().duration(750).call(zoom().transform, zoomIdentity);
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
