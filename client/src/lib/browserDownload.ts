/** Browser-only download helpers shared by the Studio, Timer and History exports. */
export function downloadFile(name: string, type: string, value: BlobPart) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
