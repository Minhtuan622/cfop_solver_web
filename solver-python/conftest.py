"""Make the `cfop_solver` package importable for the test suite.

The tests import the package with an absolute import (`from cfop_solver...`).
Pytest only puts the directory of a test module on `sys.path`, which is
`solver-python/tests`, not the package root. The `pytest` console script does
not add the current working directory to `sys.path` either — unlike
`python -m pytest` — so running `pytest tests/` from `solver-python` failed
with `ModuleNotFoundError: No module named 'cfop_solver'`.

Adding this file makes pytest treat `solver-python` as the root directory and
insert it into `sys.path`, so the suite runs with any invocation style.
"""
from __future__ import annotations

import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent

if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))
