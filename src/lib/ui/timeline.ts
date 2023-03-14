import type { State } from '$lib/state';
import { differenceInDays } from 'date-fns';
import { fabric } from 'fabric';
import { NO_TOUCHING } from './constants';
import { DateElement } from './date-element';
import { EventElement } from './event-element';

interface FabricElements {
  timeline: fabric.Line;
  yearLines: fabric.Line[];
}

export class Timeline {
  private readonly fabricElements: FabricElements;
  private readonly dateElements: DateElement[];
  private eventElements: EventElement[] = [];
  private readonly opts: TimelineOptions;
  private readonly startDate: Date;
  private readonly endDate: Date;

  constructor(
    centerY: number,
    canvasWidth: number,
    edgeOffset: number,
    dateRange: [Date, Date],
    opts: TimelineOptions = DEFAULT_TIMELINE_OPTIONS
  ) {
    this.opts = opts;
    this.startDate = dateRange[0];
    this.endDate = dateRange[1];

    const timeline = newTimelineElement(centerY, canvasWidth, edgeOffset);
    if (timeline.width === undefined || timeline.left === undefined) {
      // I'm 99% sure this is unreachable
      throw new Error('Timeline width and left must be defined');
    }

    this.fabricElements = {
      timeline,
      yearLines: [],
    };

    // Initializing this here instead of in the statement above makes the
    // code to determine x-position on the timeline easier to understand.
    this.fabricElements.yearLines = this.newYearLineElements(centerY);

    const start = this.newStartDateElement();
    const end = this.newEndDateElement();
    const todaysDate = this.newTodaysDateElement();
    this.dateElements = [start, end, todaysDate];
  }

  get y() {
    return this.fabricElements.timeline.y1 ?? 0;
  }

  get width() {
    return this.fabricElements.timeline.width ?? 0;
  }

  get left() {
    return this.fabricElements.timeline.left ?? 0;
  }

  /**
   * Update timeline UI elements after a change in state. The caller must call
   * `canvas.renderAll()` after updating elements in order to render the changes.
   */
  update(state: State, canvas: fabric.Canvas) {
    this.eventElements.forEach((eventElement) => eventElement.removeFromCanvas(canvas));
    this.eventElements = state.events.map((event) => {
      // TODO thread style options through
      return new EventElement(event, this);
    });
    this.eventElements.forEach((eventElement) => eventElement.addToCanvas(canvas));
  }

  addToCanvas(canvas: fabric.Canvas) {
    // The order of these matters. Later elements are drawn on top of earlier elements.
    canvas.add(this.fabricElements.timeline);
    this.fabricElements.yearLines.forEach((line) => canvas.add(line));
    this.dateElements.forEach((dateElement) => dateElement.addToCanvas(canvas));
    this.eventElements.forEach((eventElement) => eventElement.addToCanvas(canvas));
  }

  resize(canvasHeight: number, canvasWidth: number) {
    const centerY = canvasHeight / 2;
    const halfyearMarkerHeight = this.opts.layout.yearMarkerHeight / 2;

    // Update Timeline
    this.fabricElements.timeline.set({
      x1: this.opts.layout.boundaryWidth,
      y1: centerY,
      x2: canvasWidth - this.opts.layout.boundaryWidth,
      y2: centerY,
    });

    // Update child elements
    this.dateElements.forEach((dateElement) => dateElement.resize(this));
    this.eventElements.forEach((eventElement) => eventElement.resize(this));

    // TODO I'm not confident I got this right. If this doesn't work, I should just consider removing
    // the lines and rebuilding them from scratch.
    // Update Year Lines
    this.fabricElements.yearLines.forEach((line, index) => {
      const year = this.startDate.getFullYear() + index + 1;
      const x = this.getXForDate(new Date(year, 0, 1));

      line.set({
        left: x,
        top: centerY - halfyearMarkerHeight,
        width: 0,
        height: this.opts.layout.yearMarkerHeight,
      });
    });
  }

  // TODO this should perhaps move to the state class
  getXForDate(date: Date): number {
    const t = getTForDateInRange(date, [this.startDate, this.endDate]);
    if (this.width === undefined || this.left === undefined)
      throw new Error('Timeline width and left must be defined before calling getXForDate');

    return t * this.width + this.left;
  }

  private newStartDateElement(): DateElement {
    const text = dateLabel(this.startDate, 'Birth');
    const dateElement = new DateElement(this.startDate, this, text);

    return dateElement;
  }

  private newTodaysDateElement(): DateElement {
    const today = new Date();
    const text = dateLabel(today, 'Today');
    const dateElement = new DateElement(today, this, text);

    return dateElement;
  }

  private newEndDateElement(): DateElement {
    const text = dateLabel(this.endDate, 'Death');
    const dateElement = new DateElement(this.startDate, this, text);

    return dateElement;
  }

  private newYearLineElements(centerY: number): fabric.Line[] {
    const yearsBetweenStartAndEnd = [];
    for (let i = this.startDate.getFullYear() + 1; i <= this.endDate.getFullYear(); i++) {
      yearsBetweenStartAndEnd.push(i);
    }

    const halfyearMarkerHeight = this.opts.layout.yearMarkerHeight / 2;
    const { yearMarker, decadeMarker } = this.opts.colors;
    const yearLines = [];
    for (const year of yearsBetweenStartAndEnd) {
      const x = this.getXForDate(new Date(year, 0, 1));
      const isDecade = year % 10 === 0;

      const yearLine = new fabric.Line(
        [x, centerY - halfyearMarkerHeight, x, centerY + halfyearMarkerHeight],
        {
          originX: 'center',
          originY: 'center',
          stroke: isDecade ? decadeMarker : yearMarker,
          ...NO_TOUCHING,
        }
      );

      yearLines.push(yearLine);
    }

    return yearLines;
  }
}

function dateLabel(date: Date, label: string) {
  return `${date.toLocaleDateString('en-US', { timeZone: 'UTC' })}\n(${label})`;
}

function getTForDateInRange(date: Date, timelineRange: [Date, Date]): number {
  const [startDate, endDate] = timelineRange;
  const lengthOfTimelineInDays = differenceInDays(endDate, startDate);
  const daysSinceStart = differenceInDays(startDate, date);

  return daysSinceStart / lengthOfTimelineInDays;
}

function newTimelineElement(centerY: number, canvasWidth: number, edgeOffset: number): fabric.Line {
  return new fabric.Line([edgeOffset, centerY, canvasWidth - edgeOffset, centerY], {
    fill: '#000',
    stroke: '#000',
    ...NO_TOUCHING,
  });
}

export interface TimelineOptions {
  layout: {
    yearMarkerHeight: number;
    boundaryWidth: number;
  };
  colors: {
    yearMarker: string;
    decadeMarker: string;
  };
}

export const DEFAULT_TIMELINE_OPTIONS: TimelineOptions = {
  layout: {
    yearMarkerHeight: 20,
    boundaryWidth: 50,
  },
  colors: {
    yearMarker: 'rgba(0, 0, 0, 0.1)',
    decadeMarker: 'rgba(0, 0, 0, 0.3)',
  },
};
