/** Any case row the catalog knows how to show: LL (zbll/1lll) or 2×2 (cll/pbl). */
export type CatalogExplorerCase = {
  family: string;
  id: string;
  group: string;
  algorithm: string;
  state: string;
  /** Display name for humans; falls back to the id. */
  name?: string;
  /** Optional qualifier for the group tile's counter line (e.g. the case kind). */
  meta?: string;
};

export type CatalogExplorerPreviewProps = {
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
  /** The owning case family (f2l/oll/pll/cll/pbl/zbll/1lll) — previews may vary per family. */
  family?: string;
  /** The case algorithm — dialog previews use it to replay the solution in 3D. */
  algorithm?: string;
  /** Bumped by the dialog's "Xem lại" button to restart the replay. */
  replayToken?: number;
};

/** Một nhóm case trong catalog: tên, tiến độ đã thuộc và case đầu để vẽ ô nhóm. */
export type CatalogGroupEntry = {
  name: string;
  mastered: number;
  total: number;
  previewState: string;
  family: string | undefined;
  meta: string | undefined;
  items: CatalogExplorerCase[];
};
