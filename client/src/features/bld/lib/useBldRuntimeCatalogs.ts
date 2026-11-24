import { useEffect, useState } from "react";
import { loadBldRuntimeCatalogs, type BldRuntimeCatalogs } from "./bldExecution";

export function useBldRuntimeCatalogs() {
  const [catalogs, setCatalogs] = useState<BldRuntimeCatalogs | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  useEffect(() => {
    let live = true;
    setCatalogs(null);
    setCatalogError(false);
    loadBldRuntimeCatalogs()
      .then(next => {
        if (live) setCatalogs(next);
      })
      .catch(() => {
        if (live) setCatalogError(true);
      });
    return () => {
      live = false;
    };
  }, []);
  return { catalogs, catalogError, loading: !catalogs && !catalogError };
}
