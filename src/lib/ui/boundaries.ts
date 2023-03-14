import { fabric } from 'fabric';
import { NO_TOUCHING } from './constants';

export class GradientBoundary {
  private side: 'left' | 'right';
  private fabricElement: fabric.Rect;
  private opts: GradientBoundaryOptions;

  constructor(
    side: 'left' | 'right',
    canvasHeight: number,
    opts: GradientBoundaryOptions = DEFAULT_GRADIENT_BOUNDARY_OPTIONS
  ) {
    this.side = side;
    this.opts = opts;

    const fill = fabricGradient(side);

    this.fabricElement = new fabric.Rect({
      left: 0,
      top: 0,
      height: canvasHeight,
      width: opts.layout.boundaryWidth,
      fill,
      ...NO_TOUCHING,
    });
  }

  addToCanvas(canvas: fabric.Canvas): void {
    canvas.add(this.fabricElement);
  }

  resize(canvasHeight: number, canvasWidth: number): void {
    switch (this.side) {
      case 'left':
        this.fabricElement.set({ height: canvasHeight, left: 0 });
        break;
      case 'right':
        this.fabricElement.set({
          height: canvasHeight,
          left: canvasWidth - this.opts.layout.boundaryWidth,
        });
        break;
    }
  }
}

function fabricGradient(side: 'left' | 'right'): fabric.Gradient {
  const [x1, y1, x2, y2] = side === 'left' ? [0, 0, 1, 0] : [1, 0, 0, 0];

  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'percentage',
    coords: { x1, y1, x2, y2 },
    colorStops: [
      { offset: 0, color: '#000' },
      { offset: 1, color: '#ffffff00' },
    ],
  });
}

export interface GradientBoundaryOptions {
  layout: {
    boundaryWidth: number;
  };
}

export const DEFAULT_GRADIENT_BOUNDARY_OPTIONS: GradientBoundaryOptions = {
  layout: {
    boundaryWidth: 50,
  },
};
