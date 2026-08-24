import { readFile, writeFile } from "node:fs/promises";

const targets = [
  {
    file: "client/src/components/BldStudyLab.tsx",
    changes: [
      [
        '<button type="button" className="btn btn-primary align-self-start" onClick={nextStep}>{vi ? "Tôi hiểu ý tưởng này" : "I understand the idea"} <ChevronRight className="h-4 w-4" /></button>',
        '<button type="button" aria-label={vi ? "Tôi hiểu ý tưởng này" : "I understand the idea"} className="btn btn-outline-secondary align-self-start" onClick={nextStep}><ChevronRight className="fs-6" /></button>',
      ],
      [
        '<button type="button" className="btn btn-primary align-self-start" onClick={nextStep}>{vi ? "Tôi sẵn sàng thử memo" : "I am ready to try a memo"} <ChevronRight className="h-4 w-4" /></button>',
        '<button type="button" aria-label={vi ? "Tôi sẵn sàng thử memo" : "I am ready to try a memo"} className="btn btn-outline-secondary align-self-start" onClick={nextStep}><ChevronRight className="fs-6" /></button>',
      ],
      [
        '<button type="button" onClick={() => void buildMemo()} disabled={loading} className="btn btn-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {loading ? (vi ? "Đang tạo" : "Building") : (vi ? "Tạo đường ghi nhớ" : "Build memory path")}</button>',
        '<button type="button" onClick={() => void buildMemo()} disabled={loading} aria-label={loading ? (vi ? "Đang tạo đường ghi nhớ" : "Building memory path") : (vi ? "Tạo đường ghi nhớ" : "Build memory path")} className="btn btn-primary">{loading ? <Loader2 className="fs-6" /> : <Sparkles className="fs-6" />}</button>',
      ],
      [
        '<button type="button" className="btn btn-primary mt-3" onClick={() => setLessonStep(3)}>{vi ? "Mở bài luyện đầu tiên" : "Open the first practice"} <ChevronRight className="h-4 w-4" /></button>',
        '<button type="button" aria-label={vi ? "Mở bài luyện đầu tiên" : "Open the first practice"} className="btn btn-outline-secondary mt-3" onClick={() => setLessonStep(3)}><ChevronRight className="fs-6" /></button>',
      ],
    ],
  },
];

for (const target of targets) {
  const path = new URL(`../${target.file}`, import.meta.url);
  let source = await readFile(path, "utf8");
  for (const [before, after] of target.changes) {
    if (!source.includes(before)) throw new Error(`Không tìm thấy đoạn đích trong ${target.file}`);
    source = source.replace(before, after);
  }
  await writeFile(path, source);
}
