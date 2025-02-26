<script lang="ts">
  import { onMount } from 'svelte';
  import { scaleLinear, scaleOrdinal } from 'd3-scale';
  import { zoom, zoomIdentity } from 'd3-zoom';
  import { schemeCategory10 } from 'd3-scale-chromatic';
  import { select, selectAll, pointer } from 'd3-selection';
  import { drag } from 'd3-drag';
  import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

  let d3 = {
    zoom,
    zoomIdentity,
    scaleLinear,
    scaleOrdinal,
    schemeCategory10,
    select,
    selectAll,
    pointer,
    drag,
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
  };

  type Node = {
    id: string;
    group: number;
    size: number;
    details: {
      messages: number;
    };
    x: number;
    y: number;
  };

  type Link = {
    source: string;
    target: string;
    value: number;
  };

  type Graph = {
    nodes: Node[];
    links: Link[];
  };

  export let graph: Graph = {
    nodes: [
      { id: 'Myriel', group: 1 },
      { id: 'Napoleon', group: 1 },
      { id: 'Mlle.Baptistine', group: 1 },
      { id: 'Mme.Magloire', group: 1 },
      { id: 'CountessdeLo', group: 1 },
      { id: 'Geborand', group: 1 },
      { id: 'Champtercier', group: 1 },
      { id: 'Cravatte', group: 1 },
      { id: 'Count', group: 1 },
      { id: 'OldMan', group: 1 },
      { id: 'Labarre', group: 2 },
      { id: 'Valjean', group: 2 },
      { id: 'Marguerite', group: 3 },
      { id: 'Mme.deR', group: 2 },
      { id: 'Isabeau', group: 2 },
      { id: 'Gervais', group: 2 },
      { id: 'Tholomyes', group: 3 },
      { id: 'Listolier', group: 3 },
      { id: 'Fameuil', group: 3 },
      { id: 'Blacheville', group: 3 },
      { id: 'Favourite', group: 3 },
      { id: 'Dahlia', group: 3 },
      { id: 'Zephine', group: 3 },
      { id: 'Fantine', group: 3 },
      { id: 'Mme.Thenardier', group: 4 },
      { id: 'Thenardier', group: 4 },
      { id: 'Cosette', group: 5 },
      { id: 'Javert', group: 4 },
      { id: 'Fauchelevent', group: 0 },
      { id: 'Bamatabois', group: 2 },
      { id: 'Perpetue', group: 3 },
      { id: 'Simplice', group: 2 },
      { id: 'Scaufflaire', group: 2 },
      { id: 'Woman1', group: 2 },
      { id: 'Judge', group: 2 },
      { id: 'Champmathieu', group: 2 },
      { id: 'Brevet', group: 2 },
      { id: 'Chenildieu', group: 2 },
      { id: 'Cochepaille', group: 2 },
      { id: 'Pontmercy', group: 4 },
      { id: 'Boulatruelle', group: 6 },
      { id: 'Eponine', group: 4 },
      { id: 'Anzelma', group: 4 },
      { id: 'Woman2', group: 5 },
      { id: 'MotherInnocent', group: 0 },
      { id: 'Gribier', group: 0 },
      { id: 'Jondrette', group: 7 },
      { id: 'Mme.Burgon', group: 7 },
      { id: 'Gavroche', group: 8 },
      { id: 'Gillenormand', group: 5 },
      { id: 'Magnon', group: 5 },
      { id: 'Mlle.Gillenormand', group: 5 },
      { id: 'Mme.Pontmercy', group: 5 },
      { id: 'Mlle.Vaubois', group: 5 },
      { id: 'Lt.Gillenormand', group: 5 },
      { id: 'Marius', group: 8 },
      { id: 'BaronessT', group: 5 },
      { id: 'Mabeuf', group: 8 },
      { id: 'Enjolras', group: 8 },
      { id: 'Combeferre', group: 8 },
      { id: 'Prouvaire', group: 8 },
      { id: 'Feuilly', group: 8 },
      { id: 'Courfeyrac', group: 8 },
      { id: 'Bahorel', group: 8 },
      { id: 'Bossuet', group: 8 },
      { id: 'Joly', group: 8 },
      { id: 'Grantaire', group: 8 },
      { id: 'MotherPlutarch', group: 9 },
      { id: 'Gueulemer', group: 4 },
      { id: 'Babet', group: 4 },
      { id: 'Claquesous', group: 4 },
      { id: 'Montparnasse', group: 4 },
      { id: 'Toussaint', group: 5 },
      { id: 'Child1', group: 10 },
      { id: 'Child2', group: 10 },
      { id: 'Brujon', group: 4 },
      { id: 'Mme.Hucheloup', group: 8 },
    ],
  };

  let canvas: HTMLCanvasElement | null;
  let width = 500;
  let height = 600;
  let activeNode: boolean | Node = false;

  $: nodes = graph.nodes.map(Object.create);

  let transform = d3.zoomIdentity;
  let simulation: d3.Simulation<Node, Link>;
  let context: CanvasRenderingContext2D | null | undefined;
  let dpi = 1;
  onMount(() => {
    dpi = window.devicePixelRatio || 1;
    context = canvas?.getContext('2d');
    resize();

    simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide())
      .on('tick', simulationUpdate);

    // title
    d3.select(context?.canvas).on('mousemove', (event) => {
      const d = simulation.find(
        transform.invertX(event.offsetX * dpi),
        transform.invertY(event.offsetY * dpi),
        50
      );

      if (d) activeNode = d;
      else activeNode = false;
    });

    d3.select(canvas)
      .call(
        d3
          .drag()
          .container(canvas)
          .subject(dragsubject)
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      )
      .call(
        d3
          .zoom()
          .scaleExtent([1 / 100, 8])
          .on('zoom', zoomed) as any
      );
  });

  function simulationUpdate() {
    context?.save();
    context?.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context?.translate(transform.x, transform.y);
    context?.scale(transform.k, transform.k);

    nodes.forEach((d) => {
      drawNode(d, context);
    });
    if (context) {
      context.restore();
    }
  }

  function drawNode(d: Node, context: CanvasRenderingContext2D) {
    context?.beginPath();
    context?.arc(d.x, d.y, 10, 0, 2 * Math.PI);
    if (context) {
      context.strokeStyle = 'transparent';
      context.lineWidth = 1.5;
    }
    context?.stroke();

    context?.fill();
    context.fillStyle = 'white';
    d.id
      .split(/(?=[A-Z])/)
      .forEach((word: string, index: number) =>
        context?.fillText(word, d.x - 10, d.y + 10 * index)
      );
  }

  function zoomed(currentEvent) {
    transform = currentEvent.transform;
    simulationUpdate();
  }

  // Use the d3-force simulation to locate the node
  function dragsubject(currentEvent) {
    const node = simulation.find(
      transform.invertX(currentEvent.x * dpi),
      transform.invertY(currentEvent.y * dpi),
      50
    );
    if (node) {
      node.x = transform.applyX(node.x);
      node.y = transform.applyY(node.y);
    }
    return node;
  }

  function dragstarted(currentEvent) {
    if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
    currentEvent.subject.fx = transform.invertX(currentEvent.subject.x);
    currentEvent.subject.fy = transform.invertY(currentEvent.subject.y);
  }

  function dragged(currentEvent) {
    currentEvent.subject.fx = transform.invertX(currentEvent.x);
    currentEvent.subject.fy = transform.invertY(currentEvent.y);
  }

  function dragended(currentEvent) {
    if (!currentEvent.active) simulation.alphaTarget(0);
    currentEvent.subject.fx = null;
    currentEvent.subject.fy = null;
  }

  function resize() {
    if (canvas) {
      ({ width, height } = canvas);
    }
  }

  function fitToContainer(node: any) {
    dpi = window.devicePixelRatio || 1;
    // Make it visually fill the positioned parent
    node.style.width = '100%';
    node.style.height = '100%';
    // ...then set the internal size to match
    node.width = node.offsetWidth * dpi;
    node.height = node.offsetHeight * dpi;
    width = node.offsetWidth * dpi;
    height = node.offsetHeight * dpi;
  }
</script>

<h2 style="color:white">Graph of how much you've messaged each friend</h2>
<svelte:window on:resize={resize} />

<div on:resize={resize} class="container">
  {#if activeNode}
    <breadcrumb id="nodeDetails">
      <strong>{activeNode.id.split(/(?=[A-Z])/).join(' ')}</strong>
      <br />
      {#if activeNode.details}
        {#each Object.entries(activeNode.details) as detail}
          {detail[0]}:
          {detail[1]}
          <br />
        {/each}
      {/if}
    </breadcrumb>
  {/if}
  <canvas use:fitToContainer bind:this={canvas} />
</div>

<style>
  :global(body) {
    background-color: #000;
  }
  canvas {
    float: left;
  }
  .container {
    width: 100%;
    height: 90%;
    position: relative;
  }
  #nodeDetails {
    position: absolute;
    top: 1%;
    left: 1%;
    width: unset;
    color: #eee;
  }
</style>
