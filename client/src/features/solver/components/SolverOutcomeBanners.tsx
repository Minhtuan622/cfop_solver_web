import { CheckCircleFill } from "@/components/ui/Icon";
import { Banner } from "@/components/ui/DesignSystem";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SolverResult } from "@/lib/solverRuntime";
import { lastLayerCaseLabel, lastLayerModeLabel } from "../lib/solverPresentation";
import type { OpeningOutcome } from "../lib/solutionView";

export function OpeningOutcomeBanner({
  outcome,
  telemetry,
}: {
  outcome: OpeningOutcome;
  telemetry: SolverResult["opening"] | undefined;
}) {
  const { t } = useLanguage();
  return (
    <Banner
      tone={telemetry?.did_fallback ? "warning" : "success"}
      icon={<CheckCircleFill aria-hidden="true" />}
    >
      <strong>{t("home.firstSteps")}</strong>{" "}
      {t("home.turns", { count: outcome.moves })}
      {telemetry?.did_fallback ? ` · ${t("home.autoFallback")}` : ""}
    </Banner>
  );
}

export function LastLayerOutcomeBanner({
  telemetry,
}: {
  telemetry: SolverResult["last_layer"];
}) {
  const { language, t } = useLanguage();
  return (
    <Banner
      className="mt-4"
      tone={telemetry.did_fallback ? "warning" : "success"}
      icon={<CheckCircleFill aria-hidden="true" />}
    >
      <strong>{t("home.finalPart")}</strong>{" "}
      {lastLayerModeLabel(telemetry.achieved, language)}
      {lastLayerCaseLabel(telemetry.case_id) ? (
        <span className="font-semibold tabular-nums text-muted">
          {" "}
          · {lastLayerCaseLabel(telemetry.case_id)}
        </span>
      ) : null}
    </Banner>
  );
}
