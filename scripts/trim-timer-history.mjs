import { readFile, writeFile } from "node:fs/promises";

const path = "/home/ubuntu/cfop_solver_web/client/src/pages/TimerLab.tsx";
const source = await readFile(path, "utf8");
const before = '<h2 className="h5 mb-0">{copy.history}</h2><div className="d-flex flex-wrap gap-2">';
const after = '<div className="d-flex flex-wrap align-items-center gap-2"><h2 className="h5 mb-0">{copy.history}</h2><Link href="/history" className="btn btn-outline-secondary btn-sm">{vi ? "Mở History" : "Open History"}</Link></div><div className="d-flex flex-wrap gap-2">';
const count = source.split(before).length - 1;
const alreadyLinked = source.includes('href="/history" className="btn btn-outline-secondary btn-sm"');
if (count !== 1 && !alreadyLinked) throw new Error(`Expected one history header, found ${count}`);
const analyticsBefore = '<details className="col-12 card card-body"><summary>{vi ? "Mở phân tích & mục tiêu"';
const analyticsCount = source.split(analyticsBefore).length - 1;
if (analyticsCount !== 1) throw new Error(`Expected one legacy analytics panel, found ${analyticsCount}`);
const next = (count === 1 ? source.replace(before, after) : source).replace("visibleEntries.slice(0, 24).map", "visibleEntries.slice(0, 5).map").replace('<details className="col-12 card card-body">', '<details className="d-none" aria-hidden="true">');
if (next === source) throw new Error("Timer history summary transform did not apply");
await writeFile(path, next);
