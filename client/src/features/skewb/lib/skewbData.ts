export type SkewbFamily = "sarah-intermediate" | "sarah-advanced";

export type SkewbCaseRow = {
  id: string;
  family: SkewbFamily;
  group: string;
  name: string;
  algorithm: string;
};

export const SARAH_INTERMEDIATE_CASES_SOURCE: readonly SkewbCaseRow[] = [
  { id: "SI-Sledgehammer", family: "sarah-intermediate", group: "1T", name: "Sarah Int · Sledgehammer", algorithm: "R' F R F'" },
  { id: "SI-Hedgeslammer", family: "sarah-intermediate", group: "1T", name: "Sarah Int · Hedgeslammer", algorithm: "F R' F' R" },
  { id: "SI-Double-Sledge", family: "sarah-intermediate", group: "2T", name: "Sarah Int · Double Sledge", algorithm: "(R' F R F') (R' F R F')" },
  { id: "SI-Sledge-y-Sledge", family: "sarah-intermediate", group: "2T", name: "Sarah Int · Sledge y Sledge", algorithm: "(R' F R F') y (R' F R F')" },
  { id: "SI-Sledge-y-Sledge'", family: "sarah-intermediate", group: "2T", name: "Sarah Int · Sledge y' Sledge", algorithm: "(R' F R F') y' (R' F R F')" },
  { id: "SI-Hedge-y-Hedge", family: "sarah-intermediate", group: "2T", name: "Sarah Int · Hedge y Hedge", algorithm: "(F R' F' R) y (F R' F' R)" },
  { id: "SI-Hedge-y-Hedge'", family: "sarah-intermediate", group: "2T", name: "Sarah Int · Hedge y' Hedge", algorithm: "(F R' F' R) y' (F R' F' R)" },
  { id: "SI-Sledge-y-Hedge-y-Hedge", family: "sarah-intermediate", group: "3T", name: "Sarah Int · Sledge y Hedge y Hedge", algorithm: "(R' F R F') y (F R' F' R) y (F R' F' R)" },
  { id: "SI-Sledge-y-Hedge-y-Hedge'", family: "sarah-intermediate", group: "3T", name: "Sarah Int · Sledge y Hedge y' Hedge", algorithm: "(R' F R F') y (F R' F' R) y' (F R' F' R)" },
  { id: "SI-Sledge-y'-Hedge-y-Hedge", family: "sarah-intermediate", group: "3T", name: "Sarah Int · Sledge y' Hedge y Hedge", algorithm: "(R' F R F') y' (F R' F' R) y (F R' F' R)" },
];

export const SARAH_ADVANCED_CASES_SOURCE: readonly SkewbCaseRow[] = [
  { id: "SA-PiV-1", family: "sarah-advanced", group: "PiV", name: "Sarah Adv · Sledge y Sledge y2 Sledge", algorithm: "R' F R F' y R' F R F' y2 R' F R F'" },
  { id: "SA-PiV-2", family: "sarah-advanced", group: "PiV", name: "Sarah Adv · Sledge y' Sledge y2 Sledge", algorithm: "R' F R F' y' R' F R F' y2 R' F R F'" },
  { id: "SA-PiV-3", family: "sarah-advanced", group: "PiV", name: "Sarah Adv · Hedge y' Sledge y2 Sledge", algorithm: "F R' F' R y' R' F R F' y2 R' F R F'" },
  { id: "SA-PiV-4", family: "sarah-advanced", group: "PiV", name: "Sarah Adv · Hedge y Sledge y2 Sledge", algorithm: "F R' F' R y R' F R F' y2 R' F R F'" },
  { id: "SA-PiV-5", family: "sarah-advanced", group: "PiV", name: "Sarah Adv · Sledge y2 Sledge y2 Sledge", algorithm: "R' F R F' y2 R' F R F' y2 R' F R F'" },
  { id: "SA-PiC-1", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Sledge z Sledge y2 Sledge z", algorithm: "R' F R F' z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiC-2", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Sledge y z Sledge y2 Sledge z", algorithm: "R' F R F' y z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiC-3", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Sledge y' z Sledge y2 Sledge z", algorithm: "R' F R F' y' z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiC-4", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Sledge y2 z Sledge y2 Sledge z", algorithm: "R' F R F' y2 z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiC-5", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Hedge z Sledge y2 Sledge z", algorithm: "F R' F' R z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiC-6", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Hedge y z Sledge y2 Sledge z", algorithm: "F R' F' R y z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiC-7", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Hedge y' z Sledge y2 Sledge z", algorithm: "F R' F' R y' z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiC-8", family: "sarah-advanced", group: "PiC", name: "Sarah Adv · Hedge y2 z Sledge y2 Sledge z", algorithm: "F R' F' R y2 z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiCC-1", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Sledge z' Sledge y2 Sledge z'", algorithm: "R' F R F' z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiCC-2", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Sledge y z' Sledge y2 Sledge z'", algorithm: "R' F R F' y z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiCC-3", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Sledge y' z' Sledge y2 Sledge z'", algorithm: "R' F R F' y' z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiCC-4", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Sledge y2 z' Sledge y2 Sledge z'", algorithm: "R' F R F' y2 z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiCC-5", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Hedge z' Sledge y2 Sledge z'", algorithm: "F R' F' R z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiCC-6", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Hedge y z' Sledge y2 Sledge z'", algorithm: "F R' F' R y z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiCC-7", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Hedge y' z' Sledge y2 Sledge z'", algorithm: "F R' F' R y' z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiCC-8", family: "sarah-advanced", group: "PiCC", name: "Sarah Adv · Hedge y2 z' Sledge y2 Sledge z'", algorithm: "F R' F' R y2 z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiT-1", family: "sarah-advanced", group: "PiT", name: "Sarah Adv · Sledge y Sledge Sledge Sledge", algorithm: "(R' F R F') y (R' F R F') (R' F R F') (R' F R F')" },
  { id: "SA-PiT-2", family: "sarah-advanced", group: "PiT", name: "Sarah Adv · Sledge y' Sledge Sledge Sledge", algorithm: "(R' F R F') y' (R' F R F') (R' F R F') (R' F R F')" },
  { id: "SA-PiT-3", family: "sarah-advanced", group: "PiT", name: "Sarah Adv · Hedge y' Sledge Sledge Sledge", algorithm: "(F R' F' R) y' (R' F R F') (R' F R F') (R' F R F')" },
  { id: "SA-PiT-4", family: "sarah-advanced", group: "PiT", name: "Sarah Adv · Hedge y Sledge Sledge Sledge", algorithm: "(F R' F' R) y (R' F R F') (R' F R F') (R' F R F')" },
  { id: "SA-PiU-1", family: "sarah-advanced", group: "PiU", name: "Sarah Adv · Sledge y Sledge y Sledge", algorithm: "R' F R F' y R' F R F' y R' F R F'" },
  { id: "SA-PiU-2", family: "sarah-advanced", group: "PiU", name: "Sarah Adv · Sledge y' Sledge y' Sledge", algorithm: "R' F R F' y' R' F R F' y' R' F R F'" },
  { id: "SA-PiU-3", family: "sarah-advanced", group: "PiU", name: "Sarah Adv · Hedge y' Hedge y' Hedge", algorithm: "F R' F' R y' F R' F' R y' F R' F' R" },
  { id: "SA-PiU-4", family: "sarah-advanced", group: "PiU", name: "Sarah Adv · Hedge y Hedge y Hedge", algorithm: "F R' F' R y F R' F' R y F R' F' R" },
  { id: "SA-PiZ-1", family: "sarah-advanced", group: "PiZ", name: "Sarah Adv · Sledge y' Sledge y Hedge", algorithm: "R' F R F' y' R' F R F' y F R' F' R" },
  { id: "SA-PiZ-2", family: "sarah-advanced", group: "PiZ", name: "Sarah Adv · Sledge y Sledge y' Hedge", algorithm: "R' F R F' y R' F R F' y' F R' F' R" },
  { id: "SA-PiZ-3", family: "sarah-advanced", group: "PiZ", name: "Sarah Adv · Sledge y Hedge y' Hedge", algorithm: "R' F R F' y F R' F' R y' F R' F' R" },
  { id: "SA-PiZ-4", family: "sarah-advanced", group: "PiZ", name: "Sarah Adv · Sledge y' Hedge y Hedge", algorithm: "R' F R F' y' F R' F' R y F R' F' R" },
  { id: "SA-PiSw-1", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Sledge y Sledge y' Sledge y Hedge", algorithm: "R' F R F' y R' F R F' y' R' F R F' y F R' F' R" },
  { id: "SA-PiSw-2", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Sledge y' Sledge y Sledge y' Hedge", algorithm: "R' F R F' y' R' F R F' y R' F R F' y' F R' F' R" },
  { id: "SA-PiSw-3", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Hedge y' Hedge y Hedge y' Sledge", algorithm: "F R' F' R y' F R' F' R y F R' F' R y' R' F R F'" },
  { id: "SA-PiSw-4", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Hedge y Hedge y' Hedge y Sledge", algorithm: "F R' F' R y F R' F' R y' F R' F' R y R' F R F'" },
  { id: "SA-PiSw-5", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Sledge y Sledge y' Hedge y Sledge", algorithm: "R' F R F' y R' F R F' y' F R' F' R y R' F R F'" },
  { id: "SA-PiSw-6", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Sledge y' Sledge y Hedge y' Sledge", algorithm: "R' F R F' y' R' F R F' y F R' F' R y' R' F R F'" },
  { id: "SA-PiSw-7", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Hedge y' Hedge y Sledge y' Hedge", algorithm: "F R' F' R y' F R' F' R y R' F R F' y' F R' F' R" },
  { id: "SA-PiSw-8", family: "sarah-advanced", group: "PiSw", name: "Sarah Adv · Hedge y Hedge y' Sledge y Hedge", algorithm: "F R' F' R y F R' F' R y' R' F R F' y F R' F' R" },
  { id: "SA-PiW-1", family: "sarah-advanced", group: "PiW", name: "Sarah Adv · Sledge y2 Hedge y Sledge y Sledge", algorithm: "R' F R F' y2 F R' F' R y R' F R F' y R' F R F'" },
  { id: "SA-PiW-2", family: "sarah-advanced", group: "PiW", name: "Sarah Adv · Sledge y2 Hedge y' Sledge y' Sledge", algorithm: "R' F R F' y2 F R' F' R y' R' F R F' y' R' F R F'" },
  { id: "SA-PiW-3", family: "sarah-advanced", group: "PiW", name: "Sarah Adv · Hedge y2 Sledge y' Hedge y' Hedge", algorithm: "F R' F' R y2 R' F R F' y' F R' F' R y' F R' F' R" },
  { id: "SA-PiW-4", family: "sarah-advanced", group: "PiW", name: "Sarah Adv · Hedge y2 Sledge y Hedge y Hedge", algorithm: "F R' F' R y2 R' F R F' y F R' F' R y F R' F' R" },
  { id: "SA-PiPU-1", family: "sarah-advanced", group: "PiPU", name: "Sarah Adv · Sledge Sledge y2 z Sledge y2 Sledge z", algorithm: "R' F R F' R' F R F' y2 z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiPU-2", family: "sarah-advanced", group: "PiPU", name: "Sarah Adv · Sledge Sledge z' Sledge y2 Sledge z'", algorithm: "R' F R F' R' F R F' z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiPU-3", family: "sarah-advanced", group: "PiPU", name: "Sarah Adv · Sledge Sledge z Sledge y2 Sledge z", algorithm: "R' F R F' R' F R F' z R' F R F' y2 R' F R F' z" },
  { id: "SA-PiPU-4", family: "sarah-advanced", group: "PiPU", name: "Sarah Adv · Sledge Sledge y2 z' Sledge y2 Sledge z'", algorithm: "R' F R F' R' F R F' y2 z' R' F R F' y2 R' F R F' z'" },
  { id: "SA-PiPU-5", family: "sarah-advanced", group: "PiPU", name: "Sarah Adv · Sledge Sledge y Sledge y2 Sledge", algorithm: "R' F R F' R' F R F' y R' F R F' y2 R' F R F'" },
  { id: "SA-PiPU-6", family: "sarah-advanced", group: "PiPU", name: "Sarah Adv · Sledge Sledge y' Sledge y2 Sledge", algorithm: "R' F R F' R' F R F' y' R' F R F' y2 R' F R F'" },
  { id: "SA-Peanut-1", family: "sarah-advanced", group: "Peanut", name: "Sarah Adv · Sledge y Sledge Sledge", algorithm: "(R' F R F') y (R' F R F') (R' F R F')" },
  { id: "SA-Peanut-2", family: "sarah-advanced", group: "Peanut", name: "Sarah Adv · Sledge y' Sledge Sledge", algorithm: "(R' F R F') y' (R' F R F') (R' F R F')" },
  { id: "SA-Peanut-3", family: "sarah-advanced", group: "Peanut", name: "Sarah Adv · Hedge y' Sledge Sledge", algorithm: "(F R' F' R) y' (R' F R F') (R' F R F')" },
  { id: "SA-Peanut-4", family: "sarah-advanced", group: "Peanut", name: "Sarah Adv · Hedge y Sledge Sledge", algorithm: "(F R' F' R) y (R' F R F') (R' F R F')" },
  { id: "SA-PePi-1", family: "sarah-advanced", group: "PePi", name: "Sarah Adv · Sledge y2 Hedge y Sledge Sledge", algorithm: "(R' F R F') y2 (F R' F' R) y (R' F R F') (R' F R F')" },
  { id: "SA-PePi-2", family: "sarah-advanced", group: "PePi", name: "Sarah Adv · Sledge y2 Hedge y' Sledge Sledge", algorithm: "(R' F R F') y2 (F R' F' R) y' (R' F R F') (R' F R F')" },
  { id: "SA-PePi-3", family: "sarah-advanced", group: "PePi", name: "Sarah Adv · Hedge y2 Sledge y' Sledge Sledge", algorithm: "(F R' F' R) y2 (R' F R F') y' (R' F R F') (R' F R F')" },
  { id: "SA-PePi-4", family: "sarah-advanced", group: "PePi", name: "Sarah Adv · Hedge y2 Sledge y Sledge Sledge", algorithm: "(F R' F' R) y2 (R' F R F') y (R' F R F') (R' F R F')" },
  { id: "SA-PeU-1", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Sledge y Sledge y Hedge", algorithm: "R' F R F' y R' F R F' y F R' F' R" },
  { id: "SA-PeU-2", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Sledge y' Sledge y' Hedge", algorithm: "R' F R F' y' R' F R F' y' F R' F' R" },
  { id: "SA-PeU-3", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Sledge y Hedge y Hedge", algorithm: "R' F R F' y F R' F' R y F R' F' R" },
  { id: "SA-PeU-4", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Sledge y' Hedge y' Hedge", algorithm: "R' F R F' y' F R' F' R y' F R' F' R" },
  { id: "SA-PeU-5", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Hedge y' Hedge y' Sledge", algorithm: "F R' F' R y' F R' F' R y' R' F R F'" },
  { id: "SA-PeU-6", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Hedge y Hedge y Sledge", algorithm: "F R' F' R y F R' F' R y R' F R F'" },
  { id: "SA-PeU-7", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Hedge y' Sledge y' Sledge", algorithm: "F R' F' R y' R' F R F' y' R' F R F'" },
  { id: "SA-PeU-8", family: "sarah-advanced", group: "PeU", name: "Sarah Adv · Hedge y Sledge y Sledge", algorithm: "F R' F' R y R' F R F' y R' F R F'" },
  { id: "SA-PeZ-1", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Sledge y Sledge y2 Hedge", algorithm: "R' F R F' y R' F R F' y2 F R' F' R" },
  { id: "SA-PeZ-2", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Sledge y' Sledge y2 Hedge", algorithm: "R' F R F' y' R' F R F' y2 F R' F' R" },
  { id: "SA-PeZ-3", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Sledge y Hedge y2 Sledge", algorithm: "R' F R F' y F R' F' R y2 R' F R F'" },
  { id: "SA-PeZ-4", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Sledge y' Hedge y2 Sledge", algorithm: "R' F R F' y' F R' F' R y2 R' F R F'" },
  { id: "SA-PeZ-5", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Hedge y Hedge y2 Sledge", algorithm: "F R' F' R y F R' F' R y2 R' F R F'" },
  { id: "SA-PeZ-6", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Hedge y' Hedge y2 Sledge", algorithm: "F R' F' R y' F R' F' R y2 R' F R F'" },
  { id: "SA-PeZ-7", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Hedge y Sledge y2 Hedge", algorithm: "F R' F' R y R' F R F' y2 F R' F' R" },
  { id: "SA-PeZ-8", family: "sarah-advanced", group: "PeZ", name: "Sarah Adv · Hedge y' Sledge y2 Hedge", algorithm: "F R' F' R y' R' F R F' y2 F R' F' R" },
  { id: "SA-PeW-1", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y Sledge y Sledge", algorithm: "R' F R F' y2 R' F R F' y R' F R F' y R' F R F'" },
  { id: "SA-PeW-2", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y' Sledge y' Sledge", algorithm: "R' F R F' y2 R' F R F' y' R' F R F' y' R' F R F'" },
  { id: "SA-PeW-3", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y' Hedge y Hedge", algorithm: "R' F R F' y2 R' F R F' y' F R' F' R y F R' F' R" },
  { id: "SA-PeW-4", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y Hedge y Hedge", algorithm: "R' F R F' y2 R' F R F' y F R' F' R y F R' F' R" },
  { id: "SA-PeW-5", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y Sledge y Hedge", algorithm: "R' F R F' y2 R' F R F' y R' F R F' y F R' F' R" },
  { id: "SA-PeW-6", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y' Sledge y' Hedge", algorithm: "R' F R F' y2 R' F R F' y' R' F R F' y' F R' F' R" },
  { id: "SA-PeW-7", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y Hedge y Sledge", algorithm: "R' F R F' y2 R' F R F' y F R' F' R y R' F R F'" },
  { id: "SA-PeW-8", family: "sarah-advanced", group: "PeW", name: "Sarah Adv · Sledge y2 Sledge y' Hedge y' Sledge", algorithm: "R' F R F' y2 R' F R F' y' F R' F' R y' R' F R F'" },
  { id: "SA-PeSw-1", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Sledge y Sledge y' Sledge y Sledge", algorithm: "R' F R F' y R' F R F' y' R' F R F' y R' F R F'" },
  { id: "SA-PeSw-2", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Sledge y' Sledge y Sledge y' Sledge", algorithm: "R' F R F' y' R' F R F' y R' F R F' y' R' F R F'" },
  { id: "SA-PeSw-3", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Hedge y' Hedge y Hedge y' Hedge", algorithm: "F R' F' R y' F R' F' R y F R' F' R y' F R' F' R" },
  { id: "SA-PeSw-4", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Hedge y Hedge y' Hedge y Hedge", algorithm: "F R' F' R y F R' F' R y' F R' F' R y F R' F' R" },
  { id: "SA-PeSw-5", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Sledge y Hedge y' Sledge y Hedge", algorithm: "R' F R F' y F R' F' R y' R' F R F' y F R' F' R" },
  { id: "SA-PeSw-6", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Sledge y' Hedge y Sledge y' Hedge", algorithm: "R' F R F' y' F R' F' R y R' F R F' y' F R' F' R" },
  { id: "SA-PeSw-7", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Hedge y' Sledge y Hedge y' Sledge", algorithm: "F R' F' R y' R' F R F' y F R' F' R y' R' F R F'" },
  { id: "SA-PeSw-8", family: "sarah-advanced", group: "PeSw", name: "Sarah Adv · Hedge y Sledge y' Hedge y Sledge", algorithm: "F R' F' R y R' F R F' y' F R' F' R y R' F R F'" },
  { id: "SA-Misc-1", family: "sarah-advanced", group: "Misc", name: "Sarah Adv · Sledge Sledge y' Sledge Sledge", algorithm: "(R' F R F') (R' F R F') y' (R' F R F') (R' F R F')" },
  { id: "SA-Misc-2", family: "sarah-advanced", group: "Misc", name: "Sarah Adv · Sledge Sledge Sledge", algorithm: "R' F R F' R' F R F' R' F R F'" },
];

export const SKEWB_CATALOG: readonly SkewbCaseRow[] = [
  ...SARAH_INTERMEDIATE_CASES_SOURCE,
  ...SARAH_ADVANCED_CASES_SOURCE,
];

export const SKEWB_INTERMEDIATE_GROUPS = ["1T", "2T", "3T"] as const;
export const SKEWB_ADVANCED_GROUPS = [
  "PiV", "PiC", "PiCC", "PiT", "PiU", "PiZ", "PiSw", "PiW", "PiPU",
  "Peanut", "PePi", "PeU", "PeZ", "PeW", "PeSw", "Misc",
] as const;
export const SKEWB_GROUPS_BY_SET: Record<SkewbFamily | "all", readonly string[]> = {
  "sarah-intermediate": SKEWB_INTERMEDIATE_GROUPS,
  "sarah-advanced": SKEWB_ADVANCED_GROUPS,
  all: [...SKEWB_INTERMEDIATE_GROUPS, ...SKEWB_ADVANCED_GROUPS],
};
export const SKEWB_COUNTS = {
  "sarah-intermediate": SARAH_INTERMEDIATE_CASES_SOURCE.length,
  "sarah-advanced": SARAH_ADVANCED_CASES_SOURCE.length,
  all:
    SARAH_INTERMEDIATE_CASES_SOURCE.length +
    SARAH_ADVANCED_CASES_SOURCE.length,
} as const;
