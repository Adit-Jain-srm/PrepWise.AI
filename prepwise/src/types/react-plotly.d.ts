// Type declarations for react-plotly.js
declare module "react-plotly.js" {
  import { Component } from "react";
  import { Data, Layout, Config } from "plotly.js";

  interface PlotParams {
    data: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: { data: Data[]; layout: Partial<Layout> }, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: { data: Data[]; layout: Partial<Layout> }, graphDiv: HTMLElement) => void;
    onPurge?: (figure: { data: Data[]; layout: Partial<Layout> }, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    debug?: boolean;
    useResizeHandler?: boolean;
    revision?: number;
  }

  export default class Plot extends Component<PlotParams> {}
}

