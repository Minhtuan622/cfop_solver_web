export type Fto2LookL3tFamily = "l3t2";
export type Fto2LookL3tGroup = "PF" | "TCP A" | "TCP B" | "TCP C";

export type Fto2LookL3tCaseRow = {
  id: string;
  family: Fto2LookL3tFamily;
  group: Fto2LookL3tGroup;
  name: string;
  algorithm: string;
  caseState?: string;
};

export const FTO_2_LOOK_L3T_CASES: readonly Fto2LookL3tCaseRow[] = [
  { id: "PF-1",  family: "l3t2", group: "PF", name: "PF 1",  algorithm: "{L,U} S F", caseState: "001005150110111101233222332332344344444243242555550550666666666777777777" },
  { id: "PF-2",  family: "l3t2", group: "PF", name: "PF 2",  algorithm: "{L,U} S' F' R U' R' U F", caseState: "506000650110111111322222222334332333444443444555551550066666066777777777" },
  { id: "PF-3",  family: "l3t2", group: "PF", name: "PF 3",  algorithm: "{L,U} S' F' S' F", caseState: "000000150116111161424222222332332333344443444555551550566666066777777777" },
  { id: "PF-4",  family: "l3t2", group: "PF", name: "PF 4",  algorithm: "{L,U} S' F' S' F'", caseState: "600005100111111151432222332333344344244243242555550556066666066777777777" },
  { id: "PF-5",  family: "l3t2", group: "PF", name: "PF 5",  algorithm: "{L,U} S F'", caseState: "000000100115111101343222442334324322244342343555556556166666566777777777" },
  { id: "PF-6",  family: "l3t2", group: "PF", name: "PF 6",  algorithm: "{L,U} S' F", caseState: "005006006110111101334222332333342344244244242555550551166666566777777777" },
  { id: "PF-8",  family: "l3t2", group: "PF", name: "PF 8",  algorithm: "{L,U} S' F'", caseState: "500001005116111161344222442332323322444342343555550551066666066777777777" },
  { id: "PF-9",  family: "l3t2", group: "PF", name: "PF 9",  algorithm: "{L,U} S' F' U' R U R' F'", caseState: "006001615110111101432222332334343344344242242555550550566666066777777777" },
  { id: "PF-10", family: "l3t2", group: "PF", name: "PF 10", algorithm: "{L,U} S' F' S' F' R U' R' U F", caseState: "001005006110111101243222442332324322444343343555550551666666566777777777" },

  { id: "TCP-A1",   family: "l3t2", group: "TCP A", name: "TCP A1",   algorithm: "{L,U} R U' R' U", caseState: "500001501116111161324222222332333333444442444555550550066666066777777777" },
  { id: "TCP-A1-2", family: "l3t2", group: "TCP A", name: "TCP A1 (2)", algorithm: "{L,U} U' R U R'", caseState: "005006056110111101324222222333332333244444444555550550166666166777777777" },
  { id: "TCP-A2",   family: "l3t2", group: "TCP A", name: "TCP A2",   algorithm: "{L,U} {U,BL} R' U R' D' R U' R' D R U R U' {U,BR}", caseState: "500001501116111101324222222332333333444442444555550556066666066777777777" },
  { id: "TCP-A2-2", family: "l3t2", group: "TCP A", name: "TCP A2 (2)", algorithm: "{L,U} {U,BL} U R' U' R' D' R U R' D R U' R {U,BR}", caseState: "005006061110111101324222222333332333244444444555550550166666566777777777" },
  { id: "TCP-A3",   family: "l3t2", group: "TCP A", name: "TCP A3",   algorithm: "{L,U} {L,F} R' D' R U' R' D' R' U R D' R {R,F}", caseState: "500001105116111101324222222332333333444442444555550556066666066777777777" },
  { id: "TCP-A3-2", family: "l3t2", group: "TCP A", name: "TCP A3 (2)", algorithm: "{L,U} {L,F} R' D R' U' R D R U R' D R {R,F}", caseState: "005006016110111101324222222333332333244444444555550550166666566777777777" },
  { id: "TCP-A4",   family: "l3t2", group: "TCP A", name: "TCP A4",   algorithm: "{L,U} {L,D} R' U R U' {B,BL} D' R U R' D U' {B,D}", caseState: "006001061110111110422222222334333333344442444555550550566666566777777777" },
  { id: "TCP-A4-2", family: "l3t2", group: "TCP A", name: "TCP A4 (2)", algorithm: "{L,U} {B,D} U D' R U' R' D {R,D} U R' U' R {B,BR}", caseState: "001000010116115156222223222237333333444444444055555055666661661377777777" },
  { id: "TCP-A5",   family: "l3t2", group: "TCP A", name: "TCP A5",   algorithm: "{L,U} {B,D} R' U R2 r' U' R' U r U' {B,D}", caseState: "005000010611110610223222222237333333444444444155555555666661661777773777" },
  { id: "TCP-A5-2", family: "l3t2", group: "TCP A", name: "TCP A5 (2)", algorithm: "{L,U} {B,D} U r' U' R U r R2' U' R {B,D}", caseState: "001000010116115160222223222237333333444444444055555555666661661377777777" },
  { id: "TCP-A6",   family: "l3t2", group: "TCP A", name: "TCP A6",   algorithm: "{L,U} {B,D} U' r' R U' R' U R' r U R {B,D}", caseState: "005000010611110610223222222237333333444444444155555555666661661777773777" },
  { id: "TCP-A6-2", family: "l3t2", group: "TCP A", name: "TCP A6 (2)", algorithm: "{L,U} {B,D} R' U' r' R U' R U R' r U {B,D}", caseState: "001000010116115106222223222237333333444444444055555555666661661377777777" },

  { id: "TCP-B1",   family: "l3t2", group: "TCP B", name: "TCP B1",   algorithm: "{L,U} {L,F} U' R U R' {R,F}", caseState: "105000150110111101224222222333334333344442444555556556066666066777777777" },
  { id: "TCP-B1-2", family: "l3t2", group: "TCP B", name: "TCP B1 (2)", algorithm: "{L,U} {L,F} R U' R' U {R,F}", caseState: "006001061110111101422222222334333333344442444555550550566666566777777777" },
  { id: "TCP-B2",   family: "l3t2", group: "TCP B", name: "TCP B2",   algorithm: "{L,U} R U' R D R' U R D' R' U' R' U", caseState: "105000150110111161224222222333334333344442444555556550066666066777777777" },
  { id: "TCP-B2-2", family: "l3t2", group: "TCP B", name: "TCP B2 (2)", algorithm: "{L,U} U' R U R D R' U' R D' R' U R'", caseState: "006001056110111101422222222334333333344442444555550550566666166777777777" },
  { id: "TCP-B3",   family: "l3t2", group: "TCP B", name: "TCP B3",   algorithm: "{L,U} R' D R' U' R D R U R' D R F", caseState: "500001105116111161334222332332343344444242242555550550066666066777777777" },
  { id: "TCP-B3-2", family: "l3t2", group: "TCP B", name: "TCP B3 (2)", algorithm: "{L,U} F' R' D' R U' R' D' R' U R D' R", caseState: "005006065110111101344222442333322322244344343555550550166666166777777777" },
  { id: "TCP-B4",   family: "l3t2", group: "TCP B", name: "TCP B4",   algorithm: "{L,U} {B,D} U R' U' R {B,BR} D R' U' R D' U {R,F}", caseState: "001000100016111061222227222337333333444444444155555155666665665277773777" },
  { id: "TCP-B4-2", family: "l3t2", group: "TCP B", name: "TCP B4 (2)", algorithm: "{L,U} {L,F} U' D R' U R D' {L,D} R' U R U' {B,D}", caseState: "006001016110111101422222222334333333344442444555550550566666566777777777" },
  { id: "TCP-B5",   family: "l3t2", group: "TCP B", name: "TCP B5",   algorithm: "{L,U} {L,F} R U' R r U R U' r' U {R,F}", caseState: "105000150110111101224222222333334333344442444555556550066666666777777777" },
  { id: "TCP-B5-2", family: "l3t2", group: "TCP B", name: "TCP B5 (2)", algorithm: "{L,U} {L,F} U' r U R' U' r2 R' U R' {R,F}", caseState: "006001051110111101422222222334333333344442444555550550566666666777777777" },
  { id: "TCP-B6",   family: "l3t2", group: "TCP B", name: "TCP B6",   algorithm: "{L,U} {L,F} U r R' U R U' r' R U' R' {R,F}", caseState: "105000150110111101224222222333334333344442444555556550066666666777777777" },
  { id: "TCP-B6-2", family: "l3t2", group: "TCP B", name: "TCP B6 (2)", algorithm: "{L,U} {L,F} R U R' r U R' U' R r' U' {R,F}", caseState: "006001015110111101422222222334333333344442444555550550566666666777777777" },

  { id: "TCP-C1",   family: "l3t2", group: "TCP C", name: "TCP C1",   algorithm: "{L,U} R' D R' U' R D' R U", caseState: "001005015110111161223222222332334333444443444555550550666666066777777777" },
  { id: "TCP-C1-2", family: "l3t2", group: "TCP C", name: "TCP C1 (2)", algorithm: "{L,U} U' R' D R' U R D' R", caseState: "001005056110111101223222222332334333444443444555550550666666166777777777" },
  { id: "TCP-C2",   family: "l3t2", group: "TCP C", name: "TCP C2",   algorithm: "{L,U} {U,BL} R D' R U R' D R' U' {U,BR}", caseState: "001005015110111101223222222332334333444443444555550556666666066777777777" },
  { id: "TCP-C2-2", family: "l3t2", group: "TCP C", name: "TCP C2 (2)", algorithm: "{L,U} {U,BL} U R D' R U' R' D R' {U,BR}", caseState: "001005061110111101223222222332334333444443444555550550666666566777777777" },
  { id: "TCP-C3",   family: "l3t2", group: "TCP C", name: "TCP C3",   algorithm: "{L,U} {R,F} R' L R2 BR R' L' R BR' R' F' {L,F}", caseState: "500001105116111101344222442332323322444342343555550556066666066777777777" },
  { id: "TCP-C3-2", family: "l3t2", group: "TCP C", name: "TCP C3 (2)", algorithm: "{L,U} {R,F} F R BR R' L R BR' R2' L' R {L,F}", caseState: "005006016110111101334222332333342344244244242555550550166666566777777777" },
  { id: "TCP-C4",   family: "l3t2", group: "TCP C", name: "TCP C4",   algorithm: "{L,U} R U' R D' R U R' D R F", caseState: "105000510110111161234222332333344344344242242555556550066666066777777777" },
  { id: "TCP-C4-2", family: "l3t2", group: "TCP C", name: "TCP C4 (2)", algorithm: "{L,U} F' R' D' R U' R' D R2 U R'", caseState: "006001065110111101442222442334323322344342343555550550566666166777777777" },
  { id: "TCP-C5",   family: "l3t2", group: "TCP C", name: "TCP C5",   algorithm: "{L,U} {U,BR} R' U R D' R U R' D R' U R {U,BL}", caseState: "001005015110111101223222222332334333444443444555550505666666666777777777" },
  { id: "TCP-C5-2", family: "l3t2", group: "TCP C", name: "TCP C5 (2)", algorithm: "{L,U} {U,BR} R' U' R D' R U' R' D R' U' R {U,BL}", caseState: "001005051110111101223222222332334333444443444555550550666666666777777777" },
  { id: "TCP-C6",   family: "l3t2", group: "TCP C", name: "TCP C6",   algorithm: "{L,U} {L,D} U R' U' R {B,BR} U' R U R'", caseState: "001005015110111101223222222332334333444443444555550550666666666777777777" },
];

export const FTO_2_LOOK_L3T_GROUPS: readonly Fto2LookL3tGroup[] = ["PF", "TCP A", "TCP B", "TCP C"];

export const FTO_2_LOOK_L3T_COUNTS = {
  l3t2: FTO_2_LOOK_L3T_CASES.length,
  all: FTO_2_LOOK_L3T_CASES.length,
  PF: FTO_2_LOOK_L3T_CASES.filter(row => row.group === "PF").length,
  "TCP A": FTO_2_LOOK_L3T_CASES.filter(row => row.group === "TCP A").length,
  "TCP B": FTO_2_LOOK_L3T_CASES.filter(row => row.group === "TCP B").length,
  "TCP C": FTO_2_LOOK_L3T_CASES.filter(row => row.group === "TCP C").length,
} as const;
