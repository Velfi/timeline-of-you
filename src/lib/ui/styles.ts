export interface Colors {
  markerColor: {
    year: string;
    decade: string;
    event: string;
    hoveredEvent: string;
  };
}

export const DEFAULT_COLORS: Colors = {
  markerColor: {
    year: 'rgba(0, 0, 0, 0.1)',
    decade: 'rgba(0, 0, 0, 0.3)',
    event: 'rgba(0, 0, 255, 0.5)',
    hoveredEvent: 'rgba(255, 0, 255, 1.0)',
  },
};

export interface Layout {
  boundaryWidth: number;
  labelOffsetY: number;
  markerHeight: number;
  halfmarkerHeight: number;
  yearMarkerHeight: number;
  halfyearMarkerHeight: number;
  eventRadius: number;
}

export const DEFAULT_LAYOUT: Layout = {
  boundaryWidth: 50,
  labelOffsetY: 40,
  markerHeight: 30,
  halfmarkerHeight: 15,
  yearMarkerHeight: 20,
  halfyearMarkerHeight: 10,
  eventRadius: 5,
};

export interface Styles {
  colors: Colors;
  layout: Layout;
}

export const DEFAULT_STYLES = {
  colors: DEFAULT_COLORS,
  layout: DEFAULT_LAYOUT,
};
