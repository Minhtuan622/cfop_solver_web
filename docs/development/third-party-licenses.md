# Third-party licenses

CFOP Solver Studio itself is released under the MIT License in the repository root.

The application also distributes or loads third-party components. Their upstream license terms remain applicable:

- `cubing` is dual-licensed under MPL-2.0 or GPL-3.0-or-later. The project uses its browser puzzle and scramble tooling under the terms provided by that package.
- Bootstrap, Bootstrap Icons, React, Vite, Express, Drizzle ORM, MySQL2, Three.js, Wouter and the other MIT/BSD/Apache-licensed packages retain their upstream notices in their respective package metadata.
- Pyodide is loaded from the official CDN at runtime. Its distribution and license notices are maintained by the Pyodide project.

When adding a dependency, verify its license and security status before merging. Do not replace or remove an upstream license notice to make it appear covered by the repository MIT license.
