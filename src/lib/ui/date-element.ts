import { NO_TOUCHING } from './constants';
import { fabric } from 'fabric';
import type { Timeline } from './timeline';

const DATE_LABEL_OPTIONS = {
  fontSize: 16,
  originX: 'center',
  originY: 'center',
  textAlign: 'center',
  ...NO_TOUCHING,
};

interface FabricElements {
  line: fabric.Line;
  text?: fabric.Text;
}

export class DateElement {
  private fabricElements: FabricElements;
  private opts: DateElementOptions;
  private date: Date;

  constructor(
    date: Date,
    timeline: Timeline,
    text?: string,
    opts: DateElementOptions = DEFAULT_DATE_ELEMENT_OPTIONS
  ) {
    this.opts = opts;
    this.date = date;

    const x = timeline.getXForDate(this.date);
    const halfmarkerHeight = opts.layout.markerHeight / 2;

    const fabricElements: FabricElements = {
      line: new fabric.Line([x, timeline.y - halfmarkerHeight, x, timeline.y + halfmarkerHeight], {
        originX: 'center',
        originY: 'center',
        stroke: '#000',
        ...NO_TOUCHING,
      }),
    };

    if (text !== undefined) {
      fabricElements.text = new fabric.Text(text, {
        left: x,
        top: timeline.y + opts.layout.labelOffsetY,
        ...DATE_LABEL_OPTIONS,
      });
    }

    this.fabricElements = fabricElements;
  }

  addToCanvas(canvas: fabric.Canvas) {
    canvas.add(this.fabricElements.line);
    if (this.fabricElements.text !== undefined) {
      canvas.add(this.fabricElements.text);
    }
  }

  resize(timeline: Timeline) {
    const x = timeline.getXForDate(this.date);
    this.fabricElements.line.set({ x1: x, x2: x, y1: 0, y2: 0 });
    if (this.fabricElements.text !== undefined) {
      this.fabricElements.text.set({ left: x, top: timeline.y + this.opts.layout.labelOffsetY });
    }
  }
}

interface DateElementOptions {
  layout: {
    labelOffsetY: number;
    markerHeight: number;
  };
}

export const DEFAULT_DATE_ELEMENT_OPTIONS: DateElementOptions = {
  layout: {
    labelOffsetY: 20,
    markerHeight: 20,
  },
};
