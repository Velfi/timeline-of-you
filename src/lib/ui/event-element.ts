import { fabric } from 'fabric';
import type { Event } from '../types/event';
import type { Timeline } from './timeline';

interface FabricElements {
  circle: fabric.Circle;
  text?: fabric.Text;
}

export class EventElement {
  private fabricElements: FabricElements;
  private opts: EventElementOptions;
  private event: Event;

  constructor(
    event: Event,
    timeline: Timeline,
    opts: EventElementOptions = DEFAULT_EVENT_ELEMENT_OPTIONS
  ) {
    this.opts = opts;
    this.event = event;

    this.fabricElements = {
      circle: new fabric.Circle({
        name: event.id,
        radius: this.opts.layout.eventRadius,
        left: timeline.getXForDate(this.event.start),
        top: this.opts.layout.markerHeight / 2,
        fill: this.opts.colors.eventMarker,
        originX: 'center',
        originY: 'center',
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        hoverCursor: 'pointer',
      }),
    };

    this.fabricElements.circle.on('selected', this.onSelected);

    this.fabricElements.circle.on('mouseover', this.onMouseOver);

    this.fabricElements.circle.on('mouseout', this.onMouseOut);
  }

  addToCanvas(canvas: fabric.Canvas) {
    canvas.add(this.fabricElements.circle);
    if (this.fabricElements.text !== undefined) {
      canvas.add(this.fabricElements.text);
    }
  }

  removeFromCanvas(canvas: fabric.Canvas) {
    canvas.remove(this.fabricElements.circle);
    if (this.fabricElements.text !== undefined) {
      canvas.remove(this.fabricElements.text);
    }
  }

  resize(timeline: Timeline) {
    const x = timeline.getXForDate(this.event.start);
    // TODO I think I need to add or subtract the radius here
    this.fabricElements.circle.set({ top: timeline.y, left: x });
    if (this.fabricElements.text !== undefined) {
      this.fabricElements.text.set({ left: x, top: timeline.y + this.opts.layout.labelOffsetY });
    }
  }

  private onSelected(opt: fabric.IEvent) {
    const e = opt.e;
    console.log(e);
  }

  private onMouseOver(/* opt: fabric.IEvent<MouseEvent> */) {
    this.fabricElements.circle.set({ fill: this.opts.colors.hoveredEventMarker });
    this.fabricElements.circle.bringToFront();
  }

  private onMouseOut(/* opt: fabric.IEvent<MouseEvent> */) {
    this.fabricElements.circle.set({ fill: this.opts.colors.eventMarker });
  }
}

interface EventElementOptions {
  layout: {
    eventRadius: number;
    markerHeight: number;
    labelOffsetY: number;
  };
  colors: {
    eventMarker: string;
    hoveredEventMarker: string;
  };
}

export const DEFAULT_EVENT_ELEMENT_OPTIONS: EventElementOptions = {
  layout: {
    eventRadius: 20,
    markerHeight: 20,
    labelOffsetY: 20,
  },
  colors: {
    eventMarker: 'rgba(0, 0, 255, 0.5)',
    hoveredEventMarker: 'rgba(255, 0, 255, 1.0)',
  },
};
