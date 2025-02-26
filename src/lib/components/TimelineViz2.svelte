<script lang="ts">
  import type { TimelineEvent } from '$lib/db';
  import * as d3 from 'd3';
  import { onDestroy, onMount } from 'svelte';

  export let width: number;
  export let height: number;
  export let events: TimelineEvent[];
  export let startDate: Date;
  export let endDate: Date;

  let container: HTMLElement;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  $: w = width - margin.left - margin.right;
  $: h = height - margin.top - margin.bottom;
  $: mouseX = '0';
  $: mouseY = '0';
  $: isHoveringEvent = false;
  $: tooltipText = '';

  let svg: any;
  let xScale = d3.scaleTime().domain([startDate, endDate]).range([0, w]);
  let yScale = d3.scaleLinear().domain([0, 1]).range([h, 0]);

  type Node = d3.SimulationNodeDatum & TimelineEvent;
  let sim: d3.Simulation<Node, undefined>;
  let animId = 0;

  let nodes: Node[] = events.map((e) => ({ ...e, r: 20 }));
  sim = d3
    .forceSimulation(nodes)
    .force('x', d3.forceX((e: Node) => xScale(e.start.toDate())).strength(0.5))
    .force('y', d3.forceY(() => yScale(0.5)).strength(0.4))
    .force('collide', d3.forceCollide(20))
    .on('tick', () => {
      // svg
      //   .selectAll('circle')
      //   .attr('cx', (e: Node) => e.x)
      //   .attr('cy', (e: Node) => e.y);
    });

  onMount(() => {
    const _container = d3.select(container);
    // _container.selectChildren().remove();

    svg = _container
      .append('svg')
      .attr('viewBox', `0 0 ${w + margin.left + margin.right} ${h + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    xScale = d3.scaleTime().domain([startDate, endDate]).range([0, w]);
    yScale = d3.scaleLinear().domain([0, 1]).range([h, 0]);

    for (let event of events) {
      svg
        .append('circle')
        .datum(event)
        .attr('fill', 'rgba(0,0,0,0.2)')
        .attr('stroke', 'wheat')
        .attr('stroke-width', 2)
        .attr('cx', (e: TimelineEvent) => xScale(e.start.toDate()))
        .attr('cy', yScale(0.5))
        .attr('r', 10)
        .on('mouseover', function () {
          tooltipText = event.name;
          isHoveringEvent = true;
        })
        .on('mouseout', function () {
          isHoveringEvent = false;
        });
    }

    svg.append('g').attr('transform', `translate(0, ${h})`).call(d3.axisBottom(xScale));
  });

  // Use requestAnimationFrame to tick the simulation
  function tick() {
    sim.tick();
    animId = requestAnimationFrame(tick);
  }

  onDestroy(() => {
    if (container) {
      d3.select(container).selectChildren().remove();
    }

    if (animId) {
      cancelAnimationFrame(animId);
    }
  });

  function onMouseMove(e: MouseEvent) {
    mouseX = `${e.clientX}px`;
    mouseY = `${e.clientY}px`;
  }
</script>

<svelte:window on:mousemove={onMouseMove} />

<div bind:this={container} />
{#if isHoveringEvent}
  <p class="tooltip" style:left={mouseX} style:top={mouseY}>{tooltipText}</p>
{/if}

<style>
  p.tooltip {
    position: absolute;
    text-align: center;
    padding: 0.5rem;
    background: #ffffff;
    color: #313639;
    border: 1px solid #313639;
    border-radius: 8px;
    pointer-events: none;
    font-size: 1.3rem;
  }
</style>
