use solver_wasm::studio::{scramble_to_stickers, solve_stickers, SolveOptions};

fn opts(cross: &str, opening: &str, ll: &str) -> SolveOptions {
    SolveOptions {
        cross_color: Some(cross.into()),
        opening: Some(opening.into()),
        last_layer: Some(ll.into()),
        ..Default::default()
    }
}

#[test]
fn result_document_is_consistent() {
    let s = scramble_to_stickers("D2 F2 U' B2 R2 B2 R2 L B' D' F D2 F B2 U' R' L F2 U2").unwrap();
    for cross in ["U", "D", "R", "F", "L", "B"] {
        for (opening, ll) in [
            ("cross", "auto"),
            ("xcross", "oll_pll"),
            ("auto", "zbll"),
            ("xxcross", "1lll"),
        ] {
            let r = solve_stickers(&s, &opts(cross, opening, ll), None, None).unwrap();
            assert_eq!(r.initial_state, s);
            assert_eq!(r.final_state, cube_core::SOLVED_STICKERS);
            let mut end = 0;
            for p in &r.phases {
                assert_eq!(p.start, end);
                assert_eq!(p.end - p.start, p.moves.len());
                end = p.end;
                assert!(p.valid_after && p.predicate_after);
            }
            assert_eq!(end, r.trace.len());
            assert_eq!(r.trace.last().unwrap().state, r.final_state);
            let first = &r.phases[0].name;
            assert!(
                first == "cross" || first.starts_with("xcross_") || first.starts_with("xx"),
                "{first}"
            );
            let last = &r.phases.last().unwrap().name;
            assert!(["pll", "zbll", "1lll"].contains(&last.as_str()), "{last}");
            if r.last_layer.achieved == "oll_pll" {
                assert!(r.last_layer.case_id.as_deref().unwrap().contains('/'));
            }
            assert_eq!(r.opening.requested, opening);
            assert_eq!(r.last_layer.requested, ll);
        }
    }
}

#[test]
fn json_field_names_match_the_client_contract() {
    let s = scramble_to_stickers("R U R' U'").unwrap();
    let r = solve_stickers(&s, &SolveOptions::default(), None, None).unwrap();
    let v = serde_json::to_value(&r).unwrap();
    for key in [
        "initial_state",
        "final_state",
        "algorithm",
        "phases",
        "trace",
        "opening",
        "last_layer",
    ] {
        assert!(v.get(key).is_some(), "{key}");
    }
    let p = &v["phases"][0];
    for key in [
        "name",
        "algorithm",
        "moves",
        "state_after",
        "valid_after",
        "predicate_after",
        "case_id",
        "start",
        "end",
    ] {
        assert!(p.get(key).is_some(), "phase.{key}");
    }
    assert!(v["trace"][0].get("move").is_some());
    assert!(v["opening"]["direct_search"].get("node_budget").is_some());
    assert_eq!(v["opening"]["requested"], "cross");
    assert_eq!(v["last_layer"]["requested"], "auto");
}

#[test]
fn structured_errors() {
    let bad = solve_stickers("UUU", &SolveOptions::default(), None, None).unwrap_err();
    assert_eq!(bad.code, "invalid_input");
    let s = scramble_to_stickers("R").unwrap();
    let o = SolveOptions {
        cross_color: Some("X".into()),
        ..Default::default()
    };
    assert_eq!(
        solve_stickers(&s, &o, None, None).unwrap_err().code,
        "invalid_option"
    );
    let o = SolveOptions {
        time_budget_sec: Some(0.0),
        ..Default::default()
    };
    let s = scramble_to_stickers("D2 F2 U' B2 R2 B2 R2 L B' D' F D2 F B2 U' R' L F2 U2").unwrap();
    assert_eq!(
        solve_stickers(&s, &o, None, None).unwrap_err().code,
        "search_limit"
    );
    assert_eq!(
        scramble_to_stickers("R Q").unwrap_err().code,
        "invalid_input"
    );
}

#[test]
fn progress_hook_can_cancel() {
    fn stop(_: &'static str, _: u64) -> bool {
        false
    }
    let s = scramble_to_stickers("D2 F2 U' B2 R2 B2 R2 L B' D' F D2 F B2 U' R' L F2 U2").unwrap();
    let err = solve_stickers(&s, &SolveOptions::default(), None, Some(stop)).unwrap_err();
    assert_eq!(err.code, "cancelled");
}
