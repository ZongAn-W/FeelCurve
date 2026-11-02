#!/usr/bin/env python3
"""Isolated Linux integration checks. Keeps every fixture and log for review.

Run with --script /path/update-server.sh --root /an/unused/test-output-directory.
Only mock PM2 processes created by this test are stopped; no production service is used.
"""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tarfile
import unittest


MOCK_COMMON = r'''
import json, os, pathlib, signal, subprocess, sys
case = pathlib.Path(os.environ["FEELCURVE_TEST_CASE"])
state_path = case / "state.json"
def read_state():
    return json.loads(state_path.read_text())
def write_state(state):
    state_path.write_text(json.dumps(state))
def event(value):
    with (case / "events.log").open("a") as stream:
        stream.write(value + "\n")
def build_id():
    return (case / "opt/feelcurve/packages/web/.next/BUILD_ID").read_text().strip()
'''

PM2_MOCK = MOCK_COMMON + r'''
command = sys.argv[1]
event("pm2 " + command)
state = read_state()
current = case / "opt/feelcurve"
mode = os.environ.get("FEELCURVE_TEST_MODE", "success")
if command == "jlist":
    print(json.dumps([{"name": "feelcurve-web", "pid": state["pid"], "pm2_env": {
        "status": state["status"],
        "pm_cwd": str(current / "packages/web"),
        "pm_exec_path": str(current / "node_modules/next/dist/bin/next")}}]))
elif command == "stop":
    if state["status"] == "online":
        try:
            os.kill(state["pid"], signal.SIGTERM)
        except ProcessLookupError:
            pass
    state["status"] = "stopped"
    write_state(state)
elif command == "restart":
    if mode == "restart-fail" and build_id() == "new-build" and not state.get("restart_failed"):
        state["restart_failed"] = True
        write_state(state)
        sys.exit(31)
    process = subprocess.Popen([sys.executable, "-c", "import time;time.sleep(600)"],
        cwd=current / "packages/web", stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    state["pid"] = process.pid
    state["pids"].append(process.pid)
    state["status"] = "online"
    write_state(state)
elif command == "save":
    if mode == "save-fail" and build_id() == "new-build" and not state.get("save_failed"):
        state["save_failed"] = True
        write_state(state)
        sys.exit(32)
    state["saved_build"] = build_id()
    write_state(state)
else:
    sys.exit("Unsupported mock PM2 command")
'''

NPM_MOCK = MOCK_COMMON + r'''
mode = os.environ.get("FEELCURVE_TEST_MODE", "success")
event("npm " + " ".join(sys.argv[1:]))
if sys.argv[1] == "ci" and mode == "ci-fail":
    sys.exit(33)
if sys.argv[1:3] == ["run", "build:web"]:
    if mode == "build-fail":
        sys.exit(34)
    build = pathlib.Path.cwd() / "packages/web/.next/BUILD_ID"
    build.parent.mkdir(parents=True, exist_ok=True)
    build.write_text("new-build")
'''

CURL_MOCK = MOCK_COMMON + r'''
event("curl " + sys.argv[-1])
mode = os.environ.get("FEELCURVE_TEST_MODE", "success")
if mode == "health-fail" and build_id() == "new-build":
    sys.exit(22)
sys.exit(0)
'''


class ServerUpdateTests(unittest.TestCase):
    output_root = None
    script = None
    config_bytes = None

    def setUp(self):
        self.case = self.output_root / self._testMethodName
        self.case.mkdir()
        self.deploy_root = self.case / "opt"
        self.deploy_root.mkdir()
        self.upload_root = self.case / "uploads"
        self.upload_root.mkdir()
        self.current = self.deploy_root / "feelcurve"
        (self.current / "deploy").mkdir(parents=True)
        (self.current / "deploy/ecosystem.config.cjs").write_bytes(self.config_bytes)
        (self.current / "packages/web/.next").mkdir(parents=True)
        (self.current / "packages/web/.next/BUILD_ID").write_text("old-build")
        (self.current / "packages/web/source.ts").write_text("old source")
        self.bin = self.case / "bin"
        self.bin.mkdir()
        for name, body in {"pm2": PM2_MOCK, "npm": NPM_MOCK, "curl": CURL_MOCK,
                           "sleep": "import sys; sys.exit(0)\n"}.items():
            executable = self.bin / name
            executable.write_text("#!/usr/bin/env python3\n" + body)
            executable.chmod(0o755)
        self.old_process = subprocess.Popen(
            [sys.executable, "-c", "import time;time.sleep(600)"],
            cwd=self.current / "packages/web", stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        (self.case / "state.json").write_text(json.dumps({
            "pid": self.old_process.pid, "pids": [self.old_process.pid], "status": "online"}))
        self.release_id = "test-release"
        upload = self.upload_root / self.release_id
        upload.mkdir()
        self.archive = upload / "source.tar.gz"
        self.make_archive()

    def tearDown(self):
        # Explicitly terminate only mock PIDs created by this fixture. Files are retained.
        state = json.loads((self.case / "state.json").read_text())
        for pid in state["pids"]:
            try:
                os.kill(pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
        self.old_process.wait(timeout=5)

    def make_archive(self, extra=None):
        files = {
            "package.json": b"{}", "package-lock.json": b"{}",
            "packages/web/package.json": b"{}",
            "packages/web/source.ts": b"new source",
            "deploy/ecosystem.config.cjs": self.config_bytes,
            "deploy/update-server.sh": self.script.read_bytes(),
        }
        with tarfile.open(self.archive, "w:gz") as archive:
            for name, contents in files.items():
                member = tarfile.TarInfo(name)
                member.size = len(contents)
                member.mode = 0o644
                archive.addfile(member, io.BytesIO(contents))
            if extra is not None:
                archive.addfile(extra, io.BytesIO(b"x") if extra.isfile() else None)

    def run_update(self, mode="success", wrong_sha=False):
        env = os.environ.copy()
        env.update({
            "PATH": str(self.bin) + os.pathsep + env["PATH"],
            "FEELCURVE_TEST_CASE": str(self.case),
            "FEELCURVE_TEST_MODE": mode,
            "FEELCURVE_DEPLOY_ROOT": str(self.deploy_root),
            "FEELCURVE_UPLOAD_ROOT": str(self.upload_root),
        })
        digest = "0" * 64 if wrong_sha else hashlib.sha256(self.archive.read_bytes()).hexdigest()
        result = subprocess.run(["bash", str(self.script), str(self.archive), self.release_id, digest],
            env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=45)
        (self.case / "result.log").write_text(result.stdout)
        return result

    def events(self):
        path = self.case / "events.log"
        return path.read_text() if path.exists() else ""

    def assert_old_preserved(self):
        self.assertEqual((self.current / "packages/web/.next/BUILD_ID").read_text(), "old-build")
        self.assertEqual((self.current / "packages/web/source.ts").read_text(), "old source")
        self.assertEqual(json.loads((self.case / "state.json").read_text())["status"], "online")

    def test_success(self):
        result = self.run_update()
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual((self.current / "packages/web/.next/BUILD_ID").read_text(), "new-build")
        backup = self.deploy_root / ("feelcurve-backup-" + self.release_id)
        self.assertEqual((backup / "packages/web/source.ts").read_text(), "old source")
        self.assertEqual(json.loads((self.case / "state.json").read_text())["saved_build"], "new-build")

    def test_ci_failure_keeps_old_site(self):
        result = self.run_update("ci-fail")
        self.assertNotEqual(result.returncode, 0)
        self.assert_old_preserved()
        self.assertNotIn("pm2 stop", self.events())

    def test_build_failure_keeps_old_site(self):
        result = self.run_update("build-fail")
        self.assertNotEqual(result.returncode, 0)
        self.assert_old_preserved()
        self.assertNotIn("pm2 stop", self.events())

    def test_changed_pm2_configuration_rejected_before_switch(self):
        self.config_bytes = self.config_bytes.replace(b'"feelcurve-web"', b'"unexpected-app"', 1)
        self.make_archive()
        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("PM2 configuration must keep", result.stdout)
        self.assert_old_preserved()
        self.assertNotIn("pm2 stop", self.events())

    def assert_rollback(self, mode):
        result = self.run_update(mode)
        self.assertNotEqual(result.returncode, 0)
        self.assert_old_preserved()
        failed = self.deploy_root / ("feelcurve-failed-" + self.release_id)
        self.assertEqual((failed / "packages/web/source.ts").read_text(), "new source")
        self.assertEqual(json.loads((self.case / "state.json").read_text())["saved_build"], "old-build")
        self.assertIn("Previous version restored", result.stdout)

    def test_restart_failure_rolls_back(self):
        self.assert_rollback("restart-fail")

    def test_health_failure_rolls_back(self):
        self.assert_rollback("health-fail")

    def test_save_failure_rolls_back(self):
        self.assert_rollback("save-fail")

    def test_checksum_failure_does_not_switch(self):
        result = self.run_update(wrong_sha=True)
        self.assertNotEqual(result.returncode, 0)
        self.assert_old_preserved()
        self.assertNotIn("npm ", self.events())

    def test_traversal_archive_rejected(self):
        member = tarfile.TarInfo("../escape")
        member.size = 1
        self.make_archive(member)
        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assert_old_preserved()
        self.assertNotIn("npm ", self.events())
        self.assertFalse((self.case / "escape").exists())

    def test_symlink_archive_rejected(self):
        member = tarfile.TarInfo("packages/web/link")
        member.type = tarfile.SYMTYPE
        member.linkname = "/etc/passwd"
        self.make_archive(member)
        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assert_old_preserved()
        self.assertNotIn("npm ", self.events())

    def test_hardlink_archive_rejected(self):
        member = tarfile.TarInfo("packages/web/link")
        member.type = tarfile.LNKTYPE
        member.linkname = "package.json"
        self.make_archive(member)
        result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assert_old_preserved()

    def test_concurrent_update_rejected(self):
        import fcntl
        with (self.deploy_root / ".feelcurve-update.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            result = self.run_update()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Another update is running", result.stdout)
        self.assert_old_preserved()
        self.assertNotIn("npm ", self.events())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--script", required=True, type=Path)
    parser.add_argument("--root", required=True, type=Path)
    args = parser.parse_args()
    if sys.platform != "linux":
        parser.error("Run these isolated checks on Linux")
    root = args.root.resolve()
    if root.exists() or root == Path("/") or root == Path("/opt/feelcurve"):
        parser.error("--root must be an unused explicit test-output directory")
    root.mkdir(parents=True)
    ServerUpdateTests.output_root = root
    ServerUpdateTests.script = args.script.resolve(strict=True)
    ServerUpdateTests.config_bytes = ServerUpdateTests.script.with_name("ecosystem.config.cjs").read_bytes()
    print("Retained isolated test output:", root, flush=True)
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(ServerUpdateTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
