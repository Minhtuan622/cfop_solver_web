import type { PracticeCase } from "./types";

import { OLL_DOT_CASES } from "./oll/dot";
import { OLL_SQUARE_SHAPE_CASES } from "./oll/square-shape";
import { OLL_SMALL_LIGHTNING_BOLT_CASES } from "./oll/small-lightning-bolt";
import { OLL_FISH_SHAPE_CASES } from "./oll/fish-shape";
import { OLL_KNIGHT_MOVE_SHAPE_CASES } from "./oll/knight-move-shape";
import { OLL_CROSS_CASES } from "./oll/cross";
import { OLL_CORNERS_ORIENTED_CASES } from "./oll/corners-oriented";
import { OLL_AWKWARD_SHAPE_CASES } from "./oll/awkward-shape";
import { OLL_P_SHAPE_CASES } from "./oll/p-shape";
import { OLL_T_SHAPE_CASES } from "./oll/t-shape";
import { OLL_C_SHAPE_CASES } from "./oll/c-shape";
import { OLL_W_SHAPE_CASES } from "./oll/w-shape";
import { OLL_BIG_LIGHTNING_BOLT_CASES } from "./oll/big-lightning-bolt";
import { OLL_SMALL_L_SHAPE_CASES } from "./oll/small-l-shape";
import { OLL_I_SHAPE_CASES } from "./oll/i-shape";

export { OLL_DOT_CASES, OLL_SQUARE_SHAPE_CASES, OLL_SMALL_LIGHTNING_BOLT_CASES, OLL_FISH_SHAPE_CASES, OLL_KNIGHT_MOVE_SHAPE_CASES, OLL_CROSS_CASES, OLL_CORNERS_ORIENTED_CASES, OLL_AWKWARD_SHAPE_CASES, OLL_P_SHAPE_CASES, OLL_T_SHAPE_CASES, OLL_C_SHAPE_CASES, OLL_W_SHAPE_CASES, OLL_BIG_LIGHTNING_BOLT_CASES, OLL_SMALL_L_SHAPE_CASES, OLL_I_SHAPE_CASES };

const OLL_CASE_ORDER = Array.from({ length: 57 }, (_, index) => String(index + 1));
const OLL_BY_ID = new Map([...OLL_DOT_CASES, ...OLL_SQUARE_SHAPE_CASES, ...OLL_SMALL_LIGHTNING_BOLT_CASES, ...OLL_FISH_SHAPE_CASES, ...OLL_KNIGHT_MOVE_SHAPE_CASES, ...OLL_CROSS_CASES, ...OLL_CORNERS_ORIENTED_CASES, ...OLL_AWKWARD_SHAPE_CASES, ...OLL_P_SHAPE_CASES, ...OLL_T_SHAPE_CASES, ...OLL_C_SHAPE_CASES, ...OLL_W_SHAPE_CASES, ...OLL_BIG_LIGHTNING_BOLT_CASES, ...OLL_SMALL_L_SHAPE_CASES, ...OLL_I_SHAPE_CASES].map((practiceCase) => [practiceCase.id, practiceCase] as const));
export const OLL_CASES: PracticeCase[] = OLL_CASE_ORDER.map((id) => OLL_BY_ID.get(id) as PracticeCase);
