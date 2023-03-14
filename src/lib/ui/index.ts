import { fabric } from 'fabric';
import type { State } from '../state';
import { DEFAULT_TIMELINE_OPTIONS, Timeline } from './timeline';
import { DEFAULT_GRADIENT_BOUNDARY_OPTIONS, GradientBoundary } from './boundaries';
import { DEFAULT_DATE_ELEMENT_OPTIONS } from './date-element';

interface UIOptions {
  layout: {
    yearMarkerHeight: number;
    boundaryWidth: number;
    labelOffsetY: number;
    markerHeight: number;
  };
  colors: {
    yearMarker: string;
    decadeMarker: string;
  };
}

const DEFAULT_UI_OPTIONS: UIOptions = {
  layout: {
    ...DEFAULT_GRADIENT_BOUNDARY_OPTIONS.layout,
    ...DEFAULT_TIMELINE_OPTIONS.layout,
    ...DEFAULT_DATE_ELEMENT_OPTIONS.layout,
  },
  colors: {
    ...DEFAULT_TIMELINE_OPTIONS.colors,
  },
};

export class FabricUI {
  private canvas: fabric.Canvas;
  private timeline: Timeline;
  private boundaries: [GradientBoundary, GradientBoundary];
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;
  private opts: UIOptions;

  constructor(
    canvasElementName: string,
    [height, width]: [number, number],
    dateRange: [Date, Date],
    opts: UIOptions = DEFAULT_UI_OPTIONS
  ) {
    this.opts = opts;

    // Initialize the fabric.Canvas
    this.canvas = new fabric.Canvas(canvasElementName, {
      selection: false,
      // We control re-rendering from state changes, so this would just
      // be wasted effort.
      renderOnAddRemove: false,
      height,
      width,
    });
    this.enablePanAndZoom();
    // TODO do I need to do this or can I rely on the svelte page to call resize?
    // const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    // const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    // this.resize(height, width);

    // Initialize UI elements
    this.timeline = new Timeline(
      height / 2,
      width,
      this.opts.layout.boundaryWidth,
      dateRange,
      this.opts
    );
    this.boundaries = [
      new GradientBoundary('left', height, this.opts),
      new GradientBoundary('right', height, this.opts),
    ];

    // Add UI elements to canvas
    this.timeline.addToCanvas(this.canvas);
    this.boundaries.forEach((boundary) => boundary.addToCanvas(this.canvas));
  }

  update(state: State) {
    this.timeline.update(state, this.canvas);
  }

  resize(height: number, width: number) {
    this.canvas.setHeight(height);
    this.canvas.setWidth(width);

    this.timeline.resize(height, width);
    this.boundaries.forEach((boundary) => boundary.resize(height, width));
  }

  destroy() {
    this.canvas.dispose();
  }

  get centerY(): number {
    const { top } = this.canvas.getCenter();
    return top;
  }

  get width(): number {
    return this.canvas.width || 0;
  }

  get height(): number {
    return this.canvas.height || 0;
  }

  private enablePanAndZoom() {
    this.canvas.on('mouse:wheel', this.onMouseWheel);
    this.canvas.on('mouse:down', this.onMouseDown);
    this.canvas.on('mouse:move', this.onMouseMove);
    this.canvas.on('mouse:up', this.onMouseUp);
  }

  private onMouseWheel(opt: fabric.IEvent<WheelEvent>) {
    const delta = -opt.e.deltaY;
    let zoom = this.canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 1) zoom = 1;
    this.canvas.setZoom(zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();

    if (this.canvas.viewportTransform !== undefined) {
      restrictPanningToCanvasBounds(this.canvas.viewportTransform, this.canvas);
    }
  }

  private onMouseDown(opt: fabric.IEvent<MouseEvent>) {
    this.isDragging = true;
    this.lastPosX = opt.e.clientX;
    this.lastPosY = opt.e.clientY;
  }

  private onMouseMove(opt: fabric.IEvent<MouseEvent>) {
    console.log(this.canvas);

    if (this.isDragging) {
      const e = opt.e;
      const vpt = this.canvas.viewportTransform;
      if (vpt !== undefined) {
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;

        // prevent panning off the left side
        restrictPanningToCanvasBounds(vpt, this.canvas);
      }

      this.canvas.requestRenderAll();
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  }

  private onMouseUp() {
    // on mouse up we want to recalculate new interaction
    // for all objects, so we call setViewportTransform
    if (this.canvas.viewportTransform !== undefined) {
      this.canvas.setViewportTransform(this.canvas.viewportTransform);
    }
    this.isDragging = false;
  }
}

function restrictPanningToCanvasBounds(vpt: number[], canvas: fabric.Canvas) {
  if (vpt[4] > 0) {
    vpt[4] = 0;
  }

  // prevent panning off the bottom
  if (vpt[5] > 0) {
    vpt[5] = 0;
  }

  // prevent panning off the right side
  if (vpt[4] < canvas.getWidth() - canvas.getWidth() * canvas.getZoom()) {
    vpt[4] = canvas.getWidth() - canvas.getWidth() * canvas.getZoom();
  }

  // prevent panning off the top
  if (vpt[5] < canvas.getHeight() - canvas.getHeight() * canvas.getZoom()) {
    vpt[5] = canvas.getHeight() - canvas.getHeight() * canvas.getZoom();
  }
}
