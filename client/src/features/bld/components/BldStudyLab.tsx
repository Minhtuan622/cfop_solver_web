/* Tailwind-first 3×3 BLD route: orient → formulas → memo → drill → review. */
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  Dices,
  Layers3,
  Loader2,
  Redo2,
  Sparkles,
} from "@/components/ui/Icon";
import {
  IconButton,
  SkeletonCard,
  StatusFeedback,
} from "@/components/ui/StudioUI";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { CubeNet, SOLVED_STATE } from "@/components/common/CubeNet";
import { BldMemoLab } from "@/features/bld";
import { BldProfilePanel } from "@/features/bld";
import { BldTrainingLab } from "@/features/bld";
import { BldTargetSelfCheck } from "@/features/bld";
import { BldFullAlgorithmCatalog } from "@/features/bld";
import { BldLearningTips } from "@/features/bld";
import { BldBeginnerGuide } from "@/features/bld";
import { BldStageChecklist } from "@/features/bld";
import { BldSightedCommutator } from "@/features/bld";
import { BldNextReview } from "@/features/bld";
import {
  SOLVED_FAST_STATE,
  stateFromScramble,
  traceFastMoves,
} from "@/lib/fastCube";
import {
  readBldLearningPath,
  writeBldLearningPath,
  type BldLearningPathProgress,
} from "@/features/bld";
import {
  gradeMemo,
  preferenceKey,
  readBldProfile,
  setPreferredAlgorithm,
  writeBldProfile,
} from "@/features/bld";
import { analyzeBldInBrowser, type BldResult } from "@/lib/solverRuntime";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";

type FormulaKind = "edge" | "corner" | "parity" | "flip" | "twist";
type FormulaGroup = "edge" | "corner" | "special";
export type StarterFormula = {
  group: FormulaGroup;
  kind: FormulaKind;
  key: string;
  titleVi: string;
  titleEn: string;
  algorithm: string;
  noteVi: string;
  noteEn: string;
};

const STARTER_FORMULAS: StarterFormula[] = [
  {
    group: "edge",
    kind: "edge",
    key: "ACE",
    titleVi: "Cạnh · setup với S",
    titleEn: "Edges · S-slice setup",
    algorithm: "L2 U L2 S' L2 S U' L2",
    noteVi: "Case đầu tiên để làm quen với slice S và nhịp hoàn tác.",
    noteEn: "A first case for the S slice and the undo rhythm.",
  },
  {
    group: "edge",
    kind: "edge",
    key: "ACF",
    titleVi: "Cạnh · wide l + M",
    titleEn: "Edges · wide l + M",
    algorithm: "l U L' U' M' U L U' L'",
    noteVi: "Bổ sung wide turn l và slice M sau khi ACE đã mượt.",
    noteEn: "Add the wide l turn and M slice after ACE feels smooth.",
  },
  {
    group: "edge",
    kind: "edge",
    key: "ACI",
    titleVi: "Cạnh · nhịp M đối xứng",
    titleEn: "Edges · symmetric M rhythm",
    algorithm: "M U2 M U' M' U2 M' U",
    noteVi: "Một nhịp M/U đều tay để tập quan sát setup và hoàn tác.",
    noteEn: "A steady M/U rhythm for noticing setup and undo.",
  },
  {
    group: "edge",
    kind: "edge",
    key: "ACJ",
    titleVi: "Cạnh · wide l đổi hướng",
    titleEn: "Edges · wide l direction change",
    algorithm: "l' U L U' M U L' U' L",
    noteVi: "Case cùng họ với ACF nhưng đổi hướng; học sau ACF.",
    noteEn: "Same family as ACF but reversed; learn it after ACF.",
  },
  {
    group: "edge",
    kind: "edge",
    key: "ACL",
    titleVi: "Cạnh · setup E",
    titleEn: "Edges · E-slice setup",
    algorithm: "U L' E' L U' L' E L",
    noteVi: "Mở rộng sang slice E khi bốn case cạnh đầu đã ổn định.",
    noteEn: "Expand to the E slice when the first four edge cases are steady.",
  },
  {
    group: "corner",
    kind: "corner",
    key: "ADM",
    titleVi: "Góc · commutator ngắn",
    titleEn: "Corners · short commutator",
    algorithm: "L D L' U' L D' L' U",
    noteVi: "Case góc ngắn để tập nhịp setup → tác động → hoàn tác.",
    noteEn: "A short corner case for the setup → effect → undo rhythm.",
  },
  {
    group: "corner",
    kind: "corner",
    key: "ADQ",
    titleVi: "Góc · biến thể D'",
    titleEn: "Corners · D' variation",
    algorithm: "U L' D' L U' L' D L",
    noteVi: "Đổi chiều của D để nhận biết cặp case đối xứng.",
    noteEn: "Reverse the D direction to recognize a symmetric pair.",
  },
  {
    group: "corner",
    kind: "corner",
    key: "ADS",
    titleVi: "Góc · biến thể D",
    titleEn: "Corners · D variation",
    algorithm: "U L' D L U' L' D' L",
    noteVi: "Học cùng ADQ như một cặp, không cần học đồng thời tất cả góc.",
    noteEn: "Learn it with ADQ as a pair; do not learn all corners at once.",
  },
  {
    group: "corner",
    kind: "corner",
    key: "ADT",
    titleVi: "Góc · setup D2",
    titleEn: "Corners · D2 setup",
    algorithm: "L D2 L' U' L D2 L' U",
    noteVi: "Thêm D2 sau khi hai chiều D/D' đã quen tay.",
    noteEn: "Add D2 after the D/D' directions are comfortable.",
  },
  {
    group: "corner",
    kind: "corner",
    key: "ADP",
    titleVi: "Góc · setup R/D2",
    titleEn: "Corners · R/D2 setup",
    algorithm: "U' R' D2 R U' R' D2 R U2",
    noteVi:
      "Một lựa chọn dài hơn để chuyển từ nhóm góc cơ bản sang catalog rộng hơn.",
    noteEn:
      "A longer option for moving from basic corners to the wider catalog.",
  },
  {
    group: "special",
    kind: "flip",
    key: "BD",
    titleVi: "Đặc biệt · hai cạnh lật",
    titleEn: "Special · two flipped edges",
    algorithm: "R S2 R2 S' R U R' S R2 S2 R' U'",
    noteVi: "Chỉ học sau ít nhất một công thức cạnh; sau đó ôn lại bằng Drill.",
    noteEn:
      "Learn after at least one edge formula; then reinforce it in Drill.",
  },
];
type Stage = { title: string; subtitle: string; shortTitle: string };
function initialStage() {
  if (typeof window === "undefined") return 0;
  const stage = new URLSearchParams(window.location.search).get("bldStage");
  const byQuery: Record<string, number> = {
    orientation: 0,
    formulas: 1,
    memo: 2,
    drill: 3,
    review: 4,
  };
  return stage && stage in byQuery
    ? byQuery[stage]
    : readBldLearningPath().lastStage;
}

export function BldStudyLab({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const stages: Stage[] = vi
    ? [
        {
          shortTitle: "Bắt đầu",
          title: "Hiểu một lượt BLD",
          subtitle: "Chưa cần bịt mắt",
        },
        {
          shortTitle: "Một case",
          title: "Học nhịp đầu tiên",
          subtitle: "Setup → commutator → hoàn tác",
        },
        {
          shortTitle: "Memo có nhìn",
          title: "Tạo memo đầu tiên",
          subtitle: "Viết → đọc → thực hiện",
        },
        {
          shortTitle: "Củng cố",
          title: "Tự kiểm rồi mới mở rộng",
          subtitle: "AUF → special case tùy chọn",
        },
        {
          shortTitle: "Ôn và mở rộng",
          title: "Ôn case đã học",
          subtitle: "SRS → thêm một case",
        },
      ]
    : [
        {
          shortTitle: "Start",
          title: "Understand one BLD solve",
          subtitle: "No blindfold yet",
        },
        {
          shortTitle: "One case",
          title: "Learn your first rhythm",
          subtitle: "Setup → commutator → undo",
        },
        {
          shortTitle: "Sighted memo",
          title: "Build your first memo",
          subtitle: "Write → recall → execute",
        },
        {
          shortTitle: "Consolidate",
          title: "Self-check before expanding",
          subtitle: "AUF → optional special case",
        },
        {
          shortTitle: "Review and grow",
          title: "Review a learned case",
          subtitle: "SRS → add one case",
        },
      ];
  const [sourceMode, setSourceMode] = useState<"scramble" | "state">(
    "scramble"
  );
  const [value, setValue] = useState(() => randomThreeByThreeScramble());
  const [result, setResult] = useState<BldResult | null>(null);
  const [profile, setProfile] = useState(() => readBldProfile());
  const [path, setPath] = useState<BldLearningPathProgress>(() =>
    readBldLearningPath()
  );
  const [stageIndex, setStageIndex] = useState(initialStage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formulaGroup, setFormulaGroup] = useState<FormulaGroup>("edge");
  const [selectedFormula, setSelectedFormula] = useState<StarterFormula>(
    STARTER_FORMULAS[0]
  );
  const previewState = useMemo(() => {
    if (sourceMode === "state")
      return value.trim().length === 54 ? value.trim() : SOLVED_STATE;
    try {
      return value.trim() ? stateFromScramble(value) : SOLVED_STATE;
    } catch {
      return SOLVED_STATE;
    }
  }, [sourceMode, value]);
  const edgeMemo = result?.analysis.edges.memo.join(" · ") ?? "";
  const cornerMemo = result?.analysis.corners.memo.join(" · ") ?? "";
  const stageDone = [
    path.orientationDone,
    path.sightedDone || path.formulaDone,
    path.memoDone || Boolean(result),
    path.selfCheckDone || profile.drillAttempts.length >= 3,
    path.reviewDone ||
      Object.keys(profile.memoRecords).length > 0 ||
      profile.drillAttempts.length > 0,
  ];
  const completedCount = stageDone.filter(Boolean).length;
  useEffect(() => {
    writeBldProfile(profile);
  }, [profile]);
  useEffect(() => {
    writeBldLearningPath({ ...path, lastStage: stageIndex });
  }, [path, stageIndex]);
  const moveToStage = (next: number) =>
    setStageIndex(Math.min(4, Math.max(0, next)));
  const completeOrientation = () => {
    setPath(current => ({ ...current, orientationDone: true }));
    moveToStage(1);
  };
  const chooseFormula = (formula: StarterFormula) => {
    setSelectedFormula(formula);
    setProfile(current =>
      setPreferredAlgorithm(
        current,
        preferenceKey(formula.kind, formula.key),
        formula.algorithm
      )
    );
    setPath(current => ({ ...current, formulaDone: true }));
  };
  const gradeSighted = (remembered: boolean) => {
    setProfile(current =>
      gradeMemo(
        current,
        {
          key: `formula:${selectedFormula.kind}:${selectedFormula.key}`,
          memo: selectedFormula.key,
          kind: "formula",
        },
        remembered ? "good" : "again"
      )
    );
    setPath(current => ({
      ...current,
      formulaDone: true,
      sightedDone: remembered,
    }));
  };
  const buildMemo = async () => {
    const input = value.trim();
    if (!input || (sourceMode === "state" && input.length !== 54)) {
      setError(
        vi
          ? "Nhập scramble hợp lệ hoặc đủ 54 sticker trước khi tạo đường ghi nhớ."
          : "Enter a valid scramble or all 54 stickers before building a memo."
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const next = await analyzeBldInBrowser(sourceMode, input);
      setResult(next);
      setPath(current => ({ ...current, memoDone: true }));
      moveToStage(3);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : vi
            ? "Không thể tạo đường ghi nhớ."
            : "Could not build the memory path."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
            3×3 BLD · {vi ? "LỘ TRÌNH HỌC" : "LEARNING PATH"}
          </p>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            {vi
              ? "Từ công thức đầu tiên đến nhịp ôn tập hằng ngày."
              : "From your first algorithm to a daily review routine."}
          </h2>
          <p className="text-muted mb-0">
            {vi
              ? "Không có một công thức giải hết BLD. Bạn học từng case nhỏ, rồi mở rộng thư viện của mình."
              : "There is no single formula for all BLD. Learn one small case at a time, then grow your library."}
          </p>
        </div>
        <div className="rounded-panel border px-4 py-3 text-sm border-info/20 bg-info-soft text-ink mb-0 py-2">
          <Layers3 className="text-lg mr-1" />
          <strong>{completedCount}/5</strong>{" "}
          {vi ? "giai đoạn đã có tiến độ" : "stages have progress"}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface-3 mb-6"
          aria-label={
            vi ? "Tiến độ lộ trình BLD" : "BLD learning path progress"
          }
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${completedCount * 20}%` }}
          />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 xl:col-span-4">
            <div
              className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface"
              role="tablist"
              aria-label={vi ? "Các giai đoạn học BLD" : "BLD learning stages"}
            >
              {stages.map((stage, index) => (
                <button
                  key={stage.shortTitle}
                  type="button"
                  role="tab"
                  aria-selected={stageIndex === index}
                  onClick={() => moveToStage(index)}
                  className={
                    stageIndex === index
                      ? "block px-4 py-3 text-sm transition-colors hover:bg-surface-2 bg-primary-soft font-semibold text-primary"
                      : "block px-4 py-3 text-sm transition-colors hover:bg-surface-2"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      <span className="text-sm block opacity-75">
                        {index + 1}. {stage.shortTitle}
                      </span>
                      <strong className="block">{stage.title}</strong>
                      <span className="text-sm block">{stage.subtitle}</span>
                    </span>
                    {stageDone[index] ? (
                      <Check className="text-lg shrink-0" />
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink shrink-0">
                        {index + 1}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink mt-4 mb-0">
              <BookOpenCheck className="text-base mr-1" />
              {vi
                ? "Trước khi bắt đầu: bạn đã giải được 3×3 cơ bản khi mở mắt."
                : "Before you begin: be comfortable solving a 3×3 with your eyes open."}
            </div>
          </aside>
          <section className="col-span-12 xl:col-span-8" role="tabpanel">
            <BldBeginnerGuide
              stage={stageIndex}
              language={language}
              onFormula={() => moveToStage(1)}
            />
            <BldStageChecklist
              path={path}
              onPath={setPath}
              language={language}
            />
            {stageIndex === 0 && (
              <OrientationStage
                vi={vi}
                path={path}
                onPath={setPath}
                onContinue={completeOrientation}
              />
            )}
            {stageIndex === 1 && (
              <>
                <FormulaStage
                  vi={vi}
                  profile={profile}
                  group={formulaGroup}
                  selectedFormula={selectedFormula}
                  onGroup={setFormulaGroup}
                  onSelect={chooseFormula}
                  onContinue={() => moveToStage(2)}
                />
                <BldLearningTips language={language} />
              </>
            )}
            {stageIndex === 1 && (
              <BldSightedCommutator
                formula={selectedFormula}
                language={language}
                onGrade={gradeSighted}
              />
            )}
            {stageIndex === 2 && (
              <MemoStage
                vi={vi}
                sourceMode={sourceMode}
                value={value}
                previewState={previewState}
                result={result}
                loading={loading}
                error={error}
                edgeMemo={edgeMemo}
                cornerMemo={cornerMemo}
                onSourceMode={setSourceMode}
                onValue={setValue}
                onScramble={() => {
                  setValue(randomThreeByThreeScramble());
                  setResult(null);
                  setError("");
                }}
                onBuild={() => void buildMemo()}
                onDrill={() => moveToStage(3)}
              />
            )}
            {stageIndex === 3 && (
              <section className="rounded-card border border-line/80 bg-surface shadow-soft p-5 sm:p-6 h-full">
                <p className="text-sm uppercase tracking-wide font-semibold text-muted">
                  04 · {stages[3].shortTitle}
                </p>
                <h3 className="text-lg font-semibold tracking-tight">
                  {vi
                    ? "Luyện một loại tình huống tại một thời điểm."
                    : "Practice one kind of situation at a time."}
                </h3>
                <p className="text-muted">
                  {vi
                    ? "Bạn không cần học mọi công thức ngay. Bắt đầu bằng parity, flip hoặc twist; xem đáp án rồi tự chấm mức nhớ."
                    : "You do not need every algorithm at once. Start with parity, flips, or twists; reveal the answer, then grade your recall."}
                </p>
                <BldTrainingLab
                  result={result}
                  profile={profile}
                  onProfile={setProfile}
                  language={language}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 mt-6">
                  <span className="text-sm text-muted">
                    {profile.drillAttempts.length}/3{" "}
                    {vi ? "lượt drill đầu tiên" : "first drill attempts"}
                  </span>
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => moveToStage(4)}
                  >
                    {vi ? "Sang ôn tập" : "Continue to review"}
                    <ChevronRight className="text-base ml-1" />
                  </Button>
                </div>
              </section>
            )}
            {stageIndex === 4 && (
              <section className="rounded-card border border-line/80 bg-surface shadow-soft p-5 sm:p-6 h-full">
                <p className="text-sm uppercase tracking-wide font-semibold text-muted">
                  05 · {stages[4].shortTitle}
                </p>
                <h3 className="text-lg font-semibold tracking-tight">
                  {vi
                    ? "Giữ nhịp ngắn mỗi ngày."
                    : "Keep a short daily rhythm."}
                </h3>
                <p className="text-muted">
                  {vi
                    ? "Mỗi ngày: chọn một algorithm, chạy 5 lần mở mắt, ôn một memo và tự chấm thật. SRS sẽ đặt lần gặp lại tiếp theo."
                    : "Each day: choose one algorithm, perform it five times with eyes open, review one memo, and grade honestly. SRS schedules the next encounter."}
                </p>
                <div className="grid grid-cols-12 gap-6">
                  <section className="col-span-12 lg:col-span-6">
                    <BldMemoLab
                      result={result}
                      profile={profile}
                      onProfile={setProfile}
                      language={language}
                    />
                  </section>
                  <section className="col-span-12 lg:col-span-6">
                    <BldProfilePanel
                      profile={profile}
                      onProfile={setProfile}
                      language={language}
                    />
                  </section>
                </div>
                <div className="rounded-panel border px-4 py-3 text-sm border-success/20 bg-success-soft text-ink mt-6 mb-0">
                  <Check className="text-base mr-1" />
                  {vi
                    ? "Khi có scramble mới, quay lại Memo; khi quên một formula, quay lại giai đoạn Công thức rồi Drill."
                    : "For a new scramble, return to Memo; when you forget an algorithm, return to Algorithms then Drill."}
                </div>
              </section>
            )}
            {stageIndex === 4 && (
              <BldNextReview profile={profile} language={language} />
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

function OrientationStage({
  vi,
  path,
  onPath,
  onContinue,
}: {
  vi: boolean;
  path: BldLearningPathProgress;
  onPath: React.Dispatch<React.SetStateAction<BldLearningPathProgress>>;
  onContinue: () => void;
}) {
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft p-5 sm:p-6 h-full">
      <p className="text-sm uppercase tracking-wide font-semibold text-muted">
        01 · {vi ? "Định hướng" : "Orient"}
      </p>
      <h3 className="text-lg font-semibold tracking-tight">
        {vi
          ? "Một lượt BLD luôn có ba nhịp."
          : "Every BLD solve follows three beats."}
      </h3>
      <div className="grid grid-cols-12 gap-4 mt-1">
        <PathBeat
          title={vi ? "1. Quan sát" : "1. Inspect"}
          body={
            vi
              ? "Nhìn khối và xác định các mảnh chưa ở đúng vị trí."
              : "Look at the cube and notice pieces outside their home positions."
          }
        />
        <PathBeat
          title={vi ? "2. Ghi memo" : "2. Make a memo"}
          body={
            vi
              ? "Đổi đường đi của cạnh và góc thành letter pair hoặc hình ảnh quen thuộc."
              : "Turn edge and corner paths into letter pairs or familiar images."
          }
        />
        <PathBeat
          title={vi ? "3. Thực hiện" : "3. Execute"}
          body={
            vi
              ? "Nhắm mắt, làm theo memo và dùng công thức cho từng case."
              : "Close your eyes, follow the memo, then use an algorithm for each case."
          }
        />
      </div>
      <div className="flex items-center gap-2 mt-6">
        <input
          id="bld-orientation-done"
          type="checkbox"
          checked={path.orientationDone}
          onChange={event =>
            onPath(current => ({
              ...current,
              orientationDone: event.target.checked,
            }))
          }
          className="h-4 w-4 rounded border-line accent-primary"
        />
        <label htmlFor="bld-orientation-done" className="text-sm text-ink">
          {vi
            ? "Tôi hiểu ba nhịp của một lượt BLD."
            : "I understand the three beats of a BLD solve."}
        </label>
      </div>
      <Button
        variant="primary"
        size="md"
        className="self-start mt-6"
        type="button"
        onClick={onContinue}
      >
        {vi ? "Sang học công thức" : "Continue to algorithms"}
        <ChevronRight className="text-base ml-1" />
      </Button>
    </section>
  );
}

function FormulaStage({
  vi,
  profile,
  group,
  selectedFormula,
  onGroup,
  onSelect,
  onContinue,
}: {
  vi: boolean;
  profile: ReturnType<typeof readBldProfile>;
  group: FormulaGroup;
  selectedFormula: StarterFormula;
  onGroup: (group: FormulaGroup) => void;
  onSelect: (formula: StarterFormula) => void;
  onContinue: () => void;
}) {
  const formulas = STARTER_FORMULAS.filter(formula => formula.group === group);
  const selected = selectedFormula;
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft p-5 sm:p-6 h-full">
      <p className="text-sm uppercase tracking-wide font-semibold text-muted">
        02 · {vi ? "Công thức" : "Algorithms"}
      </p>
      <h3 className="text-lg font-semibold tracking-tight">
        {vi
          ? "Học một case, không học cả thư viện cùng lúc."
          : "Learn one case, not the whole library at once."}
      </h3>
      <p className="text-muted">
        {vi
          ? "Mỗi algorithm 3-Style xử lý một 3-cycle hoặc một tình huống đặc biệt. Chọn một nhóm, xem Cube 3D, rồi dùng target scramble để tự kiểm."
          : "Each 3-Style algorithm solves one 3-cycle or special situation. Choose a group, watch it on the 3D Cube, then self-check with a target scramble."}
      </p>
      <BldTargetSelfCheck formula={selected} language={vi ? "vi" : "en"} />
      <div className="grid grid-cols-12 gap-2 mb-6">
        <NotationCard
          symbol="R / U / F"
          body={vi ? "mặt phải / trên / trước" : "right / up / front faces"}
        />
        <NotationCard
          symbol="' / 2"
          body={
            vi ? "ngược chiều / quay đôi" : "counter-clockwise / double turn"
          }
        />
        <NotationCard
          symbol="M / S / l"
          body={
            vi
              ? "slice L-R / slice U-D / quay rộng"
              : "middle slice / standing slice / wide turn"
          }
        />
      </div>
      <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink">
        <strong>
          {vi
            ? "Quy trình 4 phút cho một công thức:"
            : "Four-minute routine for one algorithm:"}
        </strong>
        <ol className="mb-0 mt-2">
          <li>
            {vi
              ? "Đọc ký hiệu, quay chậm từng nước và nói nhịp của công thức."
              : "Read the notation, turn slowly, and say the rhythm aloud."}
          </li>
          <li>
            {vi
              ? "Chạy 5 lần mở mắt; quan sát mảnh nào thay đổi."
              : "Perform it five times with eyes open; notice the pieces that change."}
          </li>
          <li>
            {vi
              ? "Che công thức, tự gọi lại một lần; sau đó mới tự kiểm bằng target scramble."
              : "Hide the formula, recall it once, then self-check with a target scramble."}
          </li>
          <li>
            {vi
              ? "Chấm “Đã nhớ” hoặc “Chưa nhớ” để SRS đặt lần ôn tiếp theo."
              : "Grade remembered/not yet so SRS schedules the next review."}
          </li>
        </ol>
      </div>
      <div
        className="inline-flex flex-wrap items-center gap-1 mb-4"
        role="group"
        aria-label={vi ? "Nhóm starter pack" : "Starter pack group"}
      >
        {(["edge", "corner", "special"] as FormulaGroup[]).map(item => (
          <Button
            variant={group === item ? "primary" : "secondary"}
            size="md"
            key={item}
            type="button"
            onClick={() => onGroup(item)}
          >
            {item === "edge"
              ? vi
                ? "Cạnh"
                : "Edges"
              : item === "corner"
                ? vi
                  ? "Góc"
                  : "Corners"
                : vi
                  ? "Đặc biệt"
                  : "Special"}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <div className="grid grid-cols-12 gap-4">
            {formulas.map(formula => {
              const preferred =
                profile.preferredAlgorithms[
                  preferenceKey(formula.kind, formula.key)
                ]?.algorithm === formula.algorithm;
              const isSelected =
                selected.key === formula.key &&
                selected.algorithm === formula.algorithm;
              return (
                <article
                  key={`${formula.kind}-${formula.key}`}
                  className="col-span-12"
                >
                  <div
                    className={
                      isSelected
                        ? "rounded-card border border-line/80 bg-surface shadow-soft border-primary"
                        : "rounded-card border border-line/80 bg-surface shadow-soft"
                    }
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                            {formula.kind.toUpperCase()} · {formula.key}
                          </span>
                          <h4 className="text-sm font-semibold tracking-tight mt-2 mb-1">
                            {vi ? formula.titleVi : formula.titleEn}
                          </h4>
                        </div>
                        <Button
                          variant={preferred ? "secondary" : "primary"}
                          size="sm"
                          className="self-start"
                          type="button"
                          onClick={() => onSelect(formula)}
                        >
                          {preferred ? (
                            <>
                              <Check className="text-base mr-1" />
                              {vi ? "Đã chọn" : "Selected"}
                            </>
                          ) : vi ? (
                            "Dùng công thức này"
                          ) : (
                            "Use this algorithm"
                          )}
                        </Button>
                      </div>
                      <p className="font-mono text-sm break-words bg-surface-2 p-2 rounded-xl mt-2 mb-2">
                        {formula.algorithm}
                      </p>
                      <p className="text-sm text-muted mb-0">
                        {vi ? formula.noteVi : formula.noteEn}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <FormulaCubeDemo formula={selected} vi={vi} />
        </div>
      </div>
      <BldFullAlgorithmCatalog
        language={vi ? "vi" : "en"}
        onChoose={onSelect}
      />
      <div className="flex flex-wrap gap-2 mt-6">
        <Button variant="primary" size="md" type="button" onClick={onContinue}>
          {vi ? "Sang tạo memo" : "Continue to memo"}
          <ChevronRight className="text-base ml-1" />
        </Button>
      </div>
    </section>
  );
}

function FormulaCubeDemo({
  formula,
  vi,
}: {
  formula: StarterFormula;
  vi: boolean;
}) {
  const [cursor, setCursor] = useState(0);
  const trace = useMemo(() => {
    try {
      return traceFastMoves(SOLVED_FAST_STATE, formula.algorithm);
    } catch {
      return null;
    }
  }, [formula.algorithm]);
  useEffect(() => setCursor(0), [formula.algorithm]);
  if (!trace)
    return (
      <section className="rounded-card border border-line/80 bg-surface shadow-soft h-full">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
            {vi ? "MINH HỌA 3D" : "3D DEMO"}
          </p>
          <h4 className="text-sm font-semibold tracking-tight mb-0">
            {formula.key}
          </h4>
        </div>
        <div className="p-5 sm:p-6">
          <div className="rounded-panel border px-4 py-3 text-sm border-warning/25 bg-warning-soft text-ink mb-0">
            {vi
              ? "Ký hiệu của biến thể này chưa được Cube 3D hỗ trợ. Công thức vẫn có thể được tra cứu trong thư viện."
              : "This variant's notation is not yet supported by the 3D Cube. The algorithm remains available in the library."}
          </div>
        </div>
      </section>
    );
  const current =
    cursor === 0
      ? {
          state: SOLVED_FAST_STATE,
          previousState: SOLVED_FAST_STATE,
          move: undefined,
        }
      : trace[cursor - 1];
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
          {vi ? "MINH HỌA 3D" : "3D DEMO"}
        </p>
        <h4 className="text-sm font-semibold tracking-tight mb-0">
          {formula.key} · {cursor}/{trace.length}
        </h4>
      </div>
      <div className="p-5 sm:p-6">
        <Cube3DGuide
          state={current.state}
          previousState={current.previousState}
          move={current.move}
          step={cursor}
          transition={cursor ? "move" : "idle"}
          transitionId={cursor}
          turnDurationMs={260}
          initialOrbit={-28}
          initialPitch={-14}
        />
        <p className="text-sm text-muted mt-4 mb-2">
          {cursor
            ? vi
              ? `Nước vừa thực hiện: ${current.move}`
              : `Last move: ${current.move}`
            : vi
              ? "Bắt đầu từ khối đã giải; bấm nước kế để xem từng layer quay."
              : "Start from a solved cube; advance to see every layer turn."}
        </p>
        <div className="flex items-center justify-between">
          <IconButton
            label={vi ? "Nước trước" : "Previous move"}
            icon={<ArrowLeft className="text-base" />}
            onClick={() =>
              setCursor(currentStep => Math.max(0, currentStep - 1))
            }
            disabled={!cursor}
            className={`${buttonClass("secondary", "md")}`}
          />
          <IconButton
            label={vi ? "Phát lại công thức" : "Replay algorithm"}
            icon={<Redo2 className="text-base" />}
            onClick={() => setCursor(0)}
            className={`${buttonClass("secondary", "md")}`}
          />
          <IconButton
            label={vi ? "Nước kế" : "Next move"}
            icon={<ArrowRight className="text-base" />}
            onClick={() =>
              setCursor(currentStep => Math.min(trace.length, currentStep + 1))
            }
            disabled={cursor >= trace.length}
            className={`${buttonClass("secondary", "md")}`}
          />
        </div>
      </div>
    </section>
  );
}

function MemoStage({
  vi,
  sourceMode,
  value,
  previewState,
  result,
  loading,
  error,
  edgeMemo,
  cornerMemo,
  onSourceMode,
  onValue,
  onScramble,
  onBuild,
  onDrill,
}: {
  vi: boolean;
  sourceMode: "scramble" | "state";
  value: string;
  previewState: string;
  result: BldResult | null;
  loading: boolean;
  error: string;
  edgeMemo: string;
  cornerMemo: string;
  onSourceMode: (value: "scramble" | "state") => void;
  onValue: (value: string) => void;
  onScramble: () => void;
  onBuild: () => void;
  onDrill: () => void;
}) {
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft p-5 sm:p-6 h-full">
      <p className="text-sm uppercase tracking-wide font-semibold text-muted">
        03 · {vi ? "Memo" : "Memo"}
      </p>
      <h3 className="text-lg font-semibold tracking-tight">
        {vi
          ? "Biến một scramble thành hai dòng memo."
          : "Turn one scramble into two memo lines."}
      </h3>
      <p className="text-muted">
        {vi
          ? "Kết quả chỉ chia thành Cạnh và Góc. Đọc mỗi cặp như một từ hoặc hình ảnh của riêng bạn."
          : "The result is split only into Edges and Corners. Read each pair as a word or image that is meaningful to you."}
      </p>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div
            className="inline-flex flex-wrap items-center gap-1"
            role="group"
            aria-label={vi ? "Nguồn memo" : "Memo source"}
          >
            <Button
              variant={sourceMode === "scramble" ? "primary" : "secondary"}
              size="md"
              type="button"
              onClick={() => onSourceMode("scramble")}
            >
              Scramble
            </Button>
            <Button
              variant={sourceMode === "state" ? "primary" : "secondary"}
              size="md"
              type="button"
              onClick={() => onSourceMode("state")}
            >
              54 sticker
            </Button>
          </div>
          <label
            htmlFor="bld-learning-source"
            className="mb-1.5 block text-sm font-medium text-ink mt-4"
          >
            {sourceMode === "scramble"
              ? vi
                ? "Scramble để tạo memo"
                : "Scramble to build a memo"
              : vi
                ? "State 54 sticker"
                : "54-sticker state"}
          </label>
          <Textarea
            id="bld-learning-source"

            rows={5}
            value={value}
            onChange={event => onValue(event.target.value)}
            placeholder={
              sourceMode === "scramble" ? "R U R' U' …" : "UUUUUUUUURRRRRRRRR…"
            }
          />
          <div className="flex gap-2 mt-4">
            <IconButton
              label={vi ? "Tạo scramble mới" : "Create a new scramble"}
              icon={<Dices className="text-base" />}
              onClick={onScramble}
              className={`${buttonClass("secondary", "md")}`}
            />
            <IconButton
              label={
                loading
                  ? vi
                    ? "Đang tạo đường ghi nhớ"
                    : "Building memory path"
                  : vi
                    ? "Tạo đường ghi nhớ"
                    : "Build memory path"
              }
              icon={
                loading ? (
                  <Loader2 className="text-base" />
                ) : (
                  <Sparkles className="text-base" />
                )
              }
              onClick={onBuild}
              disabled={loading}
              className={`${buttonClass("primary", "md")}`}
            />
          </div>
          {error ? (
            <div className="mt-4">
              <StatusFeedback
                tone="danger"
                title={vi ? "Không thể tạo memo" : "Could not build memo"}
              >
                {error}
              </StatusFeedback>
            </div>
          ) : null}
        </div>
        <aside className="col-span-12 lg:col-span-5">
          <div className="border border-line rounded-xl p-4 text-center">
            <CubeNet state={previewState} compact />
          </div>
          {loading ? (
            <SkeletonCard
              lines={4}
              className="mt-4"
              label={vi ? "Đang tạo memo" : "Building memo"}
            />
          ) : result ? (
            <div className="rounded-card border border-line/80 bg-surface shadow-soft p-5 sm:p-6 mt-4">
              <p className="text-sm text-muted mb-1">{vi ? "Cạnh" : "Edges"}</p>
              <strong className="font-mono break-words">
                {edgeMemo || "—"}
              </strong>
              <p className="text-sm text-muted mt-4 mb-1">
                {vi ? "Góc" : "Corners"}
              </p>
              <strong className="font-mono break-words">
                {cornerMemo || "—"}
              </strong>
              <Button
                variant="primary"
                size="md"
                className="mt-4"
                type="button"
                onClick={onDrill}
              >
                {vi ? "Luyện case đặc biệt" : "Practice special cases"}
                <ChevronRight className="text-base ml-1" />
              </Button>
            </div>
          ) : (
            <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink mt-4 mb-0">
              {vi
                ? "Memo sẽ xuất hiện ở đây sau khi bạn tạo từ scramble."
                : "Your memo will appear here after you build it from a scramble."}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
function PathBeat({ title, body }: { title: string; body: string }) {
  return (
    <div className="col-span-12 md:col-span-4">
      <div className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2 h-full">
        <div className="p-5 sm:p-6">
          <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
          <p className="text-sm text-muted mb-0">{body}</p>
        </div>
      </div>
    </div>
  );
}
function NotationCard({ symbol, body }: { symbol: string; body: string }) {
  return (
    <div className="col-span-12 md:col-span-4">
      <div className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2 h-full">
        <div className="p-5 sm:p-6 py-2">
          <strong className="font-mono">{symbol}</strong>
          <p className="text-sm text-muted mb-0 mt-1">{body}</p>
        </div>
      </div>
    </div>
  );
}
