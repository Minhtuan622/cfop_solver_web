declare module "bootstrap/js/dist/tooltip" {
  export default class Tooltip {
    constructor(element: Element, config?: Record<string, unknown>);
    dispose(): void;
  }
}

declare module "bootstrap/js/dist/collapse" {
  export default class Collapse {
    constructor(element: Element, config?: Record<string, unknown>);
    dispose(): void;
  }
}
