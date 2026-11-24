export type CatalogExplorerCase = {
  family: string;
  id: string;
  group: string;
  algorithm: string;
  state: string;
  name?: string;
  meta?: string;
};

export type CatalogExplorerPreviewProps = {
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
  family?: string;
  algorithm?: string;
  replayToken?: number;
};

export type CatalogGroupEntry = {
  name: string;
  mastered: number;
  total: number;
  previewState: string;
  family: string | undefined;
  meta: string | undefined;
  items: CatalogExplorerCase[];
};
