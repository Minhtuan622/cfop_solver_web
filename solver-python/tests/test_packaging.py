"""Regression tests for the packaging of the solver test suite.

CI runs ``pytest tests/`` from the ``solver-python`` folder. The ``pytest``
console script does **not** put the current working directory on ``sys.path``
(unlike ``python -m pytest``), so the collection failed with
``ModuleNotFoundError: No module named 'cfop_solver'`` and the whole job went
red even though the code was fine.

These tests guard the two halves of the fix: the package resolves from the
repository (never from an installed copy) and the console script can collect
the suite.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import sysconfig
from pathlib import Path

import pytest

PACKAGE_ROOT = Path(__file__).resolve().parent.parent


def _pytest_console_script() -> str | None:
    """Locates the pytest console script the way CI invokes it."""
    candidates = [
        Path(sysconfig.get_path("scripts")) / "pytest",
        Path(sysconfig.get_path("scripts")) / "py.test",
        Path(sysconfig.get_path("scripts", scheme="posix_user")) / "pytest",
        Path(sysconfig.get_path("scripts", scheme="posix_user")) / "py.test",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return shutil.which("pytest")


def test_package_resolves_from_the_repository() -> None:
    import cfop_solver

    package_file = Path(cfop_solver.__file__).resolve()
    assert package_file.is_relative_to(PACKAGE_ROOT)
    # Never an installed copy: the tests must exercise the checked-out source.
    assert "site-packages" not in package_file.parts


def test_pytest_console_script_collects_the_suite() -> None:
    script = _pytest_console_script()
    if not script:
        pytest.skip("pytest console script is not installed in this environment")

    env = dict(os.environ)
    # The console script must not rely on an inherited PYTHONPATH.
    env.pop("PYTHONPATH", None)

    result = subprocess.run(
        [script, "tests/", "--collect-only", "-q"],
        cwd=str(PACKAGE_ROOT),
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stdout + result.stderr
    assert "ModuleNotFoundError" not in result.stdout + result.stderr
