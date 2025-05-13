<!--
A component for displaying a decade of events. Rendered with D3, users may zoom in and out.

At higher zoom levels, The decade is broken down into years, which are in turn broken down into months,
which are in turn broken down into days. As a user zooms in, smaller and smaller units of time are revealed.
Likewise, when a user zooms out, larger units of time are revealed.

When displaying a decade, each year is display as a tick on the x-axis. When displaying a year,
each month is display as a tick on the x-axis, and so on
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { scaleLinear, scaleTime } from 'd3-scale';
  import { select } from 'd3-selection';
  import { zoom, zoomIdentity } from 'd3-zoom';
  import { axisBottom } from 'd3-axis';
  import { timeYear, timeMonth, timeDay } from 'd3-time';
  import { browser } from '$app/environment';

  const MILLISECONDS_PER_SECOND = 1000;
  const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * 60;
  const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;
  const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * 24;
  const MILLISECONDS_PER_MONTH = MILLISECONDS_PER_DAY * 30; // Approximate
  const MILLISECONDS_PER_YEAR = MILLISECONDS_PER_DAY * 365; // Approximate
  const MILLISECONDS_PER_DECADE = MILLISECONDS_PER_YEAR * 10;

  export let startYear: number;
  export let endYear: number;

  let container: HTMLDivElement;
  let width = 1000;
  let height = 400;
  let margin = { top: 20, right: 20, bottom: 100, left: 40 };
  let xScale: any;
  let yScale: any;
  let xScale2: any;
  let transform = zoomIdentity;
  let svg: any;
  let g: any;
  let xAxis: any;
  let timeUnit = 'Decades';
  const DEFAULT_TICK_COUNT = 10;

  function updateDimensions() {
    if (container && browser) {
      width = container.clientWidth;
      height = container.clientHeight;
      setupScales();
      drawComponent();
      setupZoom();
    }
  }

  function setupScales() {
    const startDate = new Date(startYear, 0, 1);
    const endDate = new Date(endYear, 11, 31);

    xScale = scaleTime()
      .domain([startDate, endDate])
      .range([margin.left, width - margin.right]);

    xScale2 = xScale.copy();

    yScale = scaleLinear()
      .domain([0, 1])
      .range([margin.top, height - margin.bottom]);
  }

  function drawComponent() {
    if (!svg) {
      svg = select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMax meet')
        .style('overflow', 'visible');

      g = svg.append('g').attr('class', 'zoomable-content');

      xAxis = svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.bottom})`);
    }

    setupScales();

    xAxis.call(
      axisBottom(xScale)
        .ticks(DEFAULT_TICK_COUNT)
        .tickFormat((d) => {
          const date = d as Date;
          return date.getFullYear().toString();
        })
    );
  }

  function setupZoom() {
    let lastTransform = zoomIdentity;

    const zoomBehavior = zoom()
      .scaleExtent([0.1, 87600])
      .on('zoom', (event) => {
        const t = event.transform;

        transform = t;
        lastTransform = transform;

        xScale = t.rescaleX(xScale2);

        g.attr('transform', `translate(${t.x},0) scale(${t.k})`);

        const visibleStart = xScale.domain()[0];
        const visibleEnd = xScale.domain()[1];
        const timeSpan = visibleEnd.getTime() - visibleStart.getTime();

        let timeInterval;
        let fontSize;
        let lineWidth;
        let tickRotation = 0;
        let dy = '0.71em'; // Default text offset

        // Update time unit based on visible time span
        if (timeSpan > MILLISECONDS_PER_DECADE) {
          timeUnit = 'Decades';
          timeInterval = timeYear;
          fontSize = 12;
          lineWidth = 1;
          tickRotation = 0;
          dy = '0.71em';
        } else if (timeSpan > MILLISECONDS_PER_YEAR) {
          timeUnit = 'Years';
          timeInterval = timeMonth;
          fontSize = 11;
          lineWidth = 1;
          tickRotation = -45;
          dy = '1.5em';
        } else if (timeSpan > MILLISECONDS_PER_MONTH) {
          timeUnit = 'Months';
          timeInterval = timeDay;
          fontSize = 10;
          lineWidth = 0.8;
          tickRotation = -45;
          dy = '1.5em';
        } else if (timeSpan > MILLISECONDS_PER_DAY) {
          timeUnit = 'Days';
          timeInterval = timeDay;
          fontSize = 9;
          lineWidth = 0.6;
          tickRotation = -45;
          dy = '2em';
        } else {
          timeUnit = 'Hours';
          timeInterval = timeDay;
          fontSize = 8;
          lineWidth = 0.4;
          tickRotation = -45;
          dy = '2em';
        }

        // Update axis styling
        xAxis
          .selectAll('text')
          .style('font-size', `${fontSize}px`)
          .attr('transform', `rotate(${tickRotation})`)
          .style('text-anchor', tickRotation === 0 ? 'middle' : 'end')
          .attr('dy', dy);

        xAxis.selectAll('line, path').style('stroke-width', lineWidth);

        // Update axis with consistent tick count and spacing
        xAxis.call(
          axisBottom(xScale)
            .ticks(timeInterval, DEFAULT_TICK_COUNT)
            .tickValues(
              xScale.ticks(timeInterval, DEFAULT_TICK_COUNT).filter((d: Date) => {
                const year = d.getFullYear();
                return year >= startYear && year <= endYear;
              })
            )
            .tickFormat((d) => {
              const date = d as Date;
              if (date < visibleStart || date > visibleEnd) {
                return '';
              }

              // Format based on visible time span
              if (timeSpan > MILLISECONDS_PER_YEAR * 5) {
                const year = date.getFullYear();
                return year.toString();
              } else if (timeSpan > MILLISECONDS_PER_YEAR) {
                return date.toLocaleString('default', {
                  month: 'short',
                  year: 'numeric',
                });
              } else if (timeSpan > MILLISECONDS_PER_MONTH) {
                return date.toLocaleString('default', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              } else if (timeSpan > MILLISECONDS_PER_DAY) {
                return date.toLocaleString('default', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                });
              } else {
                return date.toLocaleString('default', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                });
              }
            })
        );

        // Adjust tick spacing and positioning
        xAxis.selectAll('.tick').attr('transform', function (d: Date, i: number) {
          const x = xScale(d);
          return `translate(${x},0)`;
        });
      });

    svg.call(zoomBehavior);
  }

  onMount(() => {
    if (browser) {
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      drawComponent();
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('resize', updateDimensions);
    }
  });
</script>

<div class="decade-container" bind:this={container}>
  <div class="zoom-level">View: {timeUnit}</div>
  <style>
    .decade-container {
      width: 100%;
      height: 100%;
      min-height: 400px;
      background-color: var(--color-background);
      border: 1px solid var(--color-theme-2);
      border-radius: 4px;
      overflow: visible;
      position: relative;
    }

    .zoom-level {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: var(--color-background);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--color-theme-2);
      font-size: 12px;
      color: var(--color-theme-2);
      z-index: 1000;
    }

    :global(.x-axis path),
    :global(.x-axis line) {
      stroke: var(--color-theme-2);
      transition: stroke-width 0.2s ease;
    }

    :global(.x-axis text) {
      fill: var(--color-theme-2);
      font-family: system-ui, -apple-system, sans-serif;
      transition: font-size 0.2s ease, transform 0.2s ease;
    }

    :global(.x-axis .tick) {
      transition: transform 0.2s ease;
    }

    :global(svg) {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    :global(.zoomable-content) {
      transform-origin: 0 0;
    }
  </style>
</div>
