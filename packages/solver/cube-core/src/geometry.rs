pub(crate) type Vec3 = [i8; 3];

pub(crate) const FACE_NORMAL: [Vec3; 6] = [
    [0, 1, 0],
    [1, 0, 0],
    [0, 0, 1],
    [0, -1, 0],
    [-1, 0, 0],
    [0, 0, -1],
];

const FACE_RIGHT: [Vec3; 6] = [
    [1, 0, 0],
    [0, 0, -1],
    [1, 0, 0],
    [1, 0, 0],
    [0, 0, 1],
    [-1, 0, 0],
];

const FACE_UP: [Vec3; 6] = [
    [0, 0, -1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
];

fn add(a: Vec3, b: Vec3) -> Vec3 {
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

fn scale(a: Vec3, k: i8) -> Vec3 {
    [a[0] * k, a[1] * k, a[2] * k]
}

fn dot(a: Vec3, b: Vec3) -> i8 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

fn cross(a: Vec3, b: Vec3) -> Vec3 {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}

fn rotate_clockwise(v: Vec3, axis: Vec3) -> Vec3 {
    add(scale(axis, dot(axis, v)), scale(cross(axis, v), -1))
}

fn sticker_key(index: usize) -> (Vec3, Vec3) {
    let face = index / 9;
    let row = (index % 9 / 3) as i8;
    let col = (index % 3) as i8;
    let n = FACE_NORMAL[face];
    let pos = add(
        n,
        add(
            scale(FACE_RIGHT[face], col - 1),
            scale(FACE_UP[face], 1 - row),
        ),
    );
    (pos, n)
}

fn index_of(key: (Vec3, Vec3)) -> usize {
    (0..54)
        .find(|&i| sticker_key(i) == key)
        .expect("rotated sticker must exist")
}

pub(crate) fn layer_permutation(axis: Vec3, layer: Option<i8>) -> [u8; 54] {
    let mut perm = [0u8; 54];
    for (source, slot) in perm.iter_mut().enumerate() {
        let (pos, normal) = sticker_key(source);
        let target = match layer {
            Some(k) if dot(pos, axis) != k => source,
            _ => index_of((rotate_clockwise(pos, axis), rotate_clockwise(normal, axis))),
        };
        *slot = target as u8;
    }
    perm
}

pub(crate) fn apply_permutation(stickers: &[u8; 54], perm: &[u8; 54]) -> [u8; 54] {
    let mut out = [0u8; 54];
    for (source, &target) in perm.iter().enumerate() {
        out[target as usize] = stickers[source];
    }
    out
}
