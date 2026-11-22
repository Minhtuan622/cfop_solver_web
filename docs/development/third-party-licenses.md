# Third-party licenses

CFOP Solver Studio itself is released under the MIT License in the repository root.

The application also distributes or loads third-party components. Their upstream license terms remain applicable:

- `cubing` is dual-licensed under MPL-2.0 or GPL-3.0-or-later. The project uses its browser puzzle and scramble tooling under the terms provided by that package.
- Bootstrap, Bootstrap Icons, React, Vite, Express, Drizzle ORM, MySQL2, Three.js, Wouter and the other MIT/BSD/Apache-licensed packages retain their upstream notices in their respective package metadata.
- The CFOP solver is Rust code from `packages/solver` (MIT), compiled to WebAssembly and served with the app. The third-party crates compiled into the `.wasm` file (wasm-bindgen, js-sys, serde, serde-wasm-bindgen, tsify-next and their small dependencies) are MIT and/or Apache-2.0 licensed; see `THIRD_PARTY_NOTICES.md` for the list.

When adding a dependency, verify its license and security status before merging. Do not replace or remove an upstream license notice to make it appear covered by the repository MIT license.
