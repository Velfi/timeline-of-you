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
  let minWidth = 6000; // Minimum width to ensure timeline is always visible
  let maxWidth = 12000; // Maximum width to prevent excessive horizontal scrolling
  let baseEventSpacing = 150; // Base spacing between events
  let minYearWidth = 500; // Minimum width per year to ensure readability

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
        .style('font-size', '14px')
        .style('fill', 'var(--color-theme-2)');
    }

    // Create nodes for force simulation
    const eventY = timelineY - bandHeight / 2 - 400;
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

    const labels = eventGroup
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

    const hoverGroup = g.append('g').attr('class', 'hover-elements');
    let activeNode: TimelineNode | null = null;

    function showNodeDetails(this: SVGCircleElement, d: TimelineNode) {
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
        .attr('y', d.y - 60)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', 'var(--color-text)')
        .text(() => {
          const event = events.find((e) => e.id === d.id);
          if (!event) return '';

          const startDate = event.start.toDate().toLocaleDateString();
          if (!event.end) return startDate;

          const endDate = event.end.toDate().toLocaleDateString();
          return `${startDate} - ${endDate}`;
        });
    }

    function hideNodeDetails() {
      if (!activeNode) {
        circles.style('opacity', 1);
        labels.selectAll('foreignObject').style('opacity', 1);
        lines.style('opacity', 0.5);
        hoverGroup.selectAll('*').remove();
      }
    }

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
    const contentHeight = height + 800; // Add extra height for events
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
</style>
