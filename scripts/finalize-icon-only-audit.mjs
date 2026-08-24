import { readFile, writeFile } from "node:fs/promises";

const replacements = [
  [
    "client/src/pages/TimerLab.tsx",
    '<button type="button" onClick={() => setShowMetricCubeNets((value) => !value)} className="btn btn-outline-secondary d-inline-flex align-items-center gap-1">{showMetricCubeNets ? <EyeOff className="fs-6" /> : <Eye className="fs-6" />}{showMetricCubeNets ? (vi ? "Ẩn CubeNet" : "Hide CubeNet") : (vi ? "Hiện CubeNet" : "Show CubeNet")}</button>',
    '<button type="button" onClick={() => setShowMetricCubeNets((value) => !value)} aria-label={showMetricCubeNets ? (vi ? "Ẩn CubeNet" : "Hide CubeNet") : (vi ? "Hiện CubeNet" : "Show CubeNet")} className="btn btn-outline-secondary">{showMetricCubeNets ? <EyeOff className="fs-6" /> : <Eye className="fs-6" />}</button>',
  ],
  [
    "client/src/pages/TimerLab.tsx",
    '<button type="button" onClick={() => exportAo5Image(selectedMetricDetail.entries, selectedMetricDetail.exclusions, selectedMetricDetail.value, vi)} className="btn btn-primary d-inline-flex align-items-center gap-1"><ImageDown className="fs-6" />{vi ? "Xuất ảnh Ao5" : "Export Ao5 PNG"}</button>',
    '<button type="button" onClick={() => exportAo5Image(selectedMetricDetail.entries, selectedMetricDetail.exclusions, selectedMetricDetail.value, vi)} aria-label={vi ? "Xuất ảnh Ao5" : "Export Ao5 PNG"} className="btn btn-primary"><ImageDown className="fs-6" /></button>',
  ],
  [
    "client/src/pages/TimerLab.tsx",
    '<button type="button" onClick={() => onExpand(entry)} className="btn btn-outline-secondary btn-sm" title={vi ? "Phóng to CubeNet" : "Enlarge CubeNet"}><CubeNet state={state} compact /><span className="d-block mt-2"><Maximize2 className="fs-5 me-1" />{vi ? "Phóng to" : "Enlarge"}</span></button>',
    '<button type="button" onClick={() => onExpand(entry)} aria-label={vi ? "Phóng to CubeNet" : "Enlarge CubeNet"} className="btn btn-outline-secondary btn-sm"><CubeNet state={state} compact /></button>',
  ],
  [
    "client/src/pages/TimerLab.tsx",
    '<button type="button" onClick={() => onCopy(entry)} className="btn btn-outline-secondary btn-sm"><ClipboardCheck className="fs-5 me-1" />{copied ? (vi ? "Đã chép" : "Copied") : (vi ? "Sao chép" : "Copy")}</button>',
    '<button type="button" onClick={() => onCopy(entry)} aria-label={copied ? (vi ? "Đã chép scramble" : "Scramble copied") : (vi ? "Sao chép scramble" : "Copy scramble")} className="btn btn-outline-secondary btn-sm"><ClipboardCheck className="fs-5" /></button>',
  ],
  [
    "client/src/pages/TimerLab.tsx",
    '<button type="button" onClick={() => onReplay(entry)} className="btn btn-outline-primary btn-sm"><Play className="fs-5 me-1" />{vi ? "Phát solution" : "Play solution"}</button>',
    '<button type="button" onClick={() => onReplay(entry)} aria-label={vi ? "Phát solution" : "Play solution"} className="btn btn-outline-secondary btn-sm"><Play className="fs-5" /></button>',
  ],
  [
    "client/src/pages/Home.tsx",
    '<button type="button" onClick={onRandomPractice} disabled={unmasteredCount === 0} className="btn btn-outline-primary"><Sparkles className="fs-5 me-1" />{vi ? "Luyện ngẫu nhiên" : "Random practice"}</button>',
    '<button type="button" onClick={onRandomPractice} disabled={unmasteredCount === 0} aria-label={vi ? "Luyện ngẫu nhiên" : "Random practice"} className="btn btn-outline-secondary"><Sparkles className="fs-5" /></button>',
  ],
];

for (const [relativePath, before, after] of replacements) {
  const path = new URL(`../${relativePath}`, import.meta.url);
  const source = await readFile(path, "utf8");
  if (!source.includes(before)) throw new Error(`Không tìm thấy đoạn đích trong ${relativePath}`);
  await writeFile(path, source.replace(before, after));
}
