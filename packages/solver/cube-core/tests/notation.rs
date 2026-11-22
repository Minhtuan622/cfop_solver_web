use cube_core::{format_moves, invert_moves, parse_moves, Move, MoveBase, ParseErrorKind};

#[test]
fn parse_and_format_round_trip() {
    let text = "R U R' U' M2 E S' x y2 z' u d' f2 b l r'";
    let moves = parse_moves(text).unwrap();
    assert_eq!(moves.len(), 16);
    assert_eq!(format_moves(&moves), text);
}

#[test]
fn every_move_formats_and_parses() {
    for m in Move::all() {
        assert_eq!(m.to_string().parse::<Move>().unwrap(), m);
    }
}

#[test]
fn accepts_alternate_spellings() {
    let a = parse_moves("Rw Uw' (R U3) R2' F’ X Y Z").unwrap();
    let b = parse_moves("r u' R U' R2 F' x y z").unwrap();
    assert_eq!(a, b);
    assert_eq!(parse_moves("  R,U\tF\n").unwrap().len(), 3);
    assert!(parse_moves("").unwrap().is_empty());
}

#[test]
fn reports_unknown_move_with_position() {
    let err = parse_moves("R U Q R'").unwrap_err();
    assert_eq!(err.token, "Q");
    assert_eq!(err.token_index, 2);
    assert_eq!(err.byte_offset, 4);
    assert_eq!(err.kind, ParseErrorKind::UnknownMove);
    let msg = err.to_string();
    assert!(msg.contains("'Q'") && msg.contains("token 3"), "{msg}");
}

#[test]
fn reports_invalid_suffix() {
    let err = parse_moves("R U4").unwrap_err();
    assert_eq!(err.token, "U4");
    assert_eq!(err.kind, ParseErrorKind::InvalidSuffix("4".into()));
    for bad in ["R''", "Rx", "rw", "U2''", "’"] {
        assert!(parse_moves(bad).is_err(), "{bad} should fail");
    }
}

#[test]
fn inverse_sequence() {
    let m = parse_moves("R U2 F'").unwrap();
    assert_eq!(format_moves(&invert_moves(&m)), "F U2 R'");
    assert_eq!(Move::new(MoveBase::R, 4), None);
}
