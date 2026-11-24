use cube_core::{parse_moves, Cube};

fn centers(s: &str) -> String {
    let c = Cube::from_moves(&parse_moves(s).unwrap());
    c.centers()
        .iter()
        .map(|&i| cube_core::FACE_CHARS[i as usize])
        .collect()
}

#[test]
fn m_moves_centers_like_l() {
    assert_eq!(centers("M"), "BRUFLD");
    assert_eq!(centers("M'"), "FRDBLU");
    assert_eq!(centers("M2"), "DRBULF");
}

#[test]
fn e_moves_centers_like_d() {
    assert_eq!(centers("E"), "UFLDBR");
    assert_eq!(centers("E'"), "UBRDFL");
    assert_eq!(centers("E2"), "ULBDRF");
}

#[test]
fn s_moves_centers_like_f() {
    assert_eq!(centers("S"), "LUFRDB");
    assert_eq!(centers("S'"), "RDFLUB");
}

#[test]
fn slice_moves_do_not_disturb_outer_layers() {
    for (mv, faces) in [("M", [1usize, 4]), ("E", [0, 3]), ("S", [2, 5])] {
        for turns in ["", "'", "2"] {
            let s = Cube::from_moves(&parse_moves(&format!("{mv}{turns}")).unwrap()).to_stickers();
            for &f in &faces {
                let face = &s[f * 9..f * 9 + 9];
                let expected = cube_core::FACE_CHARS[f].to_string().repeat(9);
                assert_eq!(face, expected, "{mv}{turns} changed face {f}");
            }
        }
    }
}

#[test]
fn face_moves_never_move_centers() {
    for m in cube_core::Move::all().filter(|m| m.base().is_face()) {
        assert_eq!(Cube::SOLVED.apply(m).centers(), &[0, 1, 2, 3, 4, 5], "{m}");
    }
}

#[test]
fn slice_sequences_restore_centers() {
    assert_eq!(centers("M U M' U'"), "URFDLB");
    assert_eq!(centers("E R E' R'"), "URFDLB");
    assert_eq!(centers("M2 E2 M2 E2"), "URFDLB");
    assert_eq!(centers("M2 U M2 U2 M2 U M2"), "URFDLB");
}
