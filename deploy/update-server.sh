#!/usr/bin/env bash
# Invoked by update.ps1. No release, backup, or upload is automatically deleted.
set -Eeuo pipefail
umask 077

log() { printf '[FeelCurve] %s\n' "$*"; }
fail() { printf '[FeelCurve] ERROR: %s\n' "$*" >&2; exit 1; }

[[ $# -eq 3 || $# -eq 4 ]] || fail 'Expected: archive-path release-id sha256 [build-mode]'
archive=$1
release_id=$2
expected_sha=${3,,}
build_mode=${4:-source}
[[ $build_mode == source || $build_mode == prebuilt ]] || fail 'Invalid build mode.'
[[ $release_id =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$ ]] || fail 'Invalid release ID.'
[[ $release_id != . && $release_id != .. ]] || fail 'Invalid release ID.'
[[ $expected_sha =~ ^[a-f0-9]{64}$ ]] || fail 'Invalid SHA-256.'

# Overrides support isolated integration tests; normal deployments use /opt and /root.
deploy_root=${FEELCURVE_DEPLOY_ROOT:-/opt}
upload_root=${FEELCURVE_UPLOAD_ROOT:-/root/feelcurve-uploads}
[[ $deploy_root == /* && $upload_root == /* ]] || fail 'Deployment roots must be absolute.'
[[ -d $deploy_root && ! -L $deploy_root ]] || fail 'Deployment root must be an existing real directory.'
deploy_root=$(realpath -e -- "$deploy_root")
upload_root=$(realpath -e -- "$upload_root")
[[ $deploy_root != / && $upload_root != / ]] || fail 'Refusing filesystem root.'
[[ $archive == "$upload_root/$release_id/source.tar.gz" ]] || fail 'Unexpected upload path.'
[[ -f $archive && ! -L $archive ]] || fail 'Upload is missing or is a symlink.'
[[ $(realpath -e -- "$archive") == "$archive" ]] || fail 'Upload path contains a symlink.'

current="$deploy_root/feelcurve"
release="$deploy_root/feelcurve-release-$release_id"
backup="$deploy_root/feelcurve-backup-$release_id"
failed="$deploy_root/feelcurve-failed-$release_id"
app_name=feelcurve-web
npm_registry=${NPM_CONFIG_REGISTRY:-https://registry.npmmirror.com}
switch_started=0
committed=0

for tool in flock python3 sha256sum tar npm node pm2 curl mv; do
  command -v "$tool" >/dev/null || fail "Required command not found: $tool"
done

exec 9>"$deploy_root/.feelcurve-update.lock"
flock -n 9 || fail 'Another update is running. Wait for it to finish.'

[[ -d $current && ! -L $current ]] || fail 'Current deployment must be a real directory.'
[[ $(realpath -e -- "$current") == "$current" ]] || fail 'Current deployment path contains a symlink.'
for target in "$release" "$backup" "$failed"; do
  [[ ! -e $target && ! -L $target ]] || fail "Release path already exists: $target"
done
[[ -f $current/deploy/ecosystem.config.cjs ]] || fail 'Current PM2 configuration is missing.'
[[ -s $current/packages/web/.next/BUILD_ID ]] || fail 'Current build ID is missing.'
old_build_id=$(cat "$current/packages/web/.next/BUILD_ID")

# Only print the PID; the PM2 environment may contain private values.
verify_process() {
  pm2 jlist | node -e '
const fs = require("node:fs");
const path = require("node:path");
let input = "";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  try {
    const root = process.argv[1];
    const matches = JSON.parse(input).filter(app => app.name === "feelcurve-web");
    if (matches.length !== 1) throw new Error("Expected exactly one FeelCurve process");
    const app = matches[0], env = app.pm2_env;
    const cwd = path.join(root, "packages", "web");
    const script = path.join(root, "node_modules", "next", "dist", "bin", "next");
    if (env.status !== "online" || env.pm_cwd !== cwd || env.pm_exec_path !== script)
      throw new Error("PM2 process configuration does not match the deployment");
    if (!Number.isInteger(app.pid) || app.pid <= 0 || fs.realpathSync(`/proc/${app.pid}/cwd`) !== cwd)
      throw new Error("Running process is not using the current deployment directory");
    process.stdout.write(String(app.pid));
  } catch {
    console.error("[FeelCurve] PM2 process metadata or running directory could not be verified");
    process.exitCode = 1;
  }
});' "$current"
}

healthy_once() {
  local build_id=$1
  [[ -f $current/packages/web/.next/BUILD_ID ]] || return 1
  [[ $(cat "$current/packages/web/.next/BUILD_ID") == "$build_id" ]] || return 1
  curl --fail --silent --max-time 5 --output /dev/null http://127.0.0.1:3000/ || return 1
  curl --fail --silent --max-time 5 --output /dev/null http://127.0.0.1:3000/effects/magnetic-button || return 1
  verify_process >/dev/null || return 1
}

wait_healthy() {
  local build_id=$1 attempt
  for attempt in {1..12}; do
    if healthy_once "$build_id"; then return 0; fi
    sleep 1
  done
  return 1
}

rollback() {
  log 'Update failed during switching. Restoring the previous version.'
  # Detect actual directory state, including a signal between a move and its next line.
  if [[ -d $backup && ! -L $backup ]]; then
    if [[ -e $current || -L $current ]]; then
      pm2 stop "$app_name" || return 1
      [[ ! -e $failed && ! -L $failed ]] || return 1
      mv -T -- "$current" "$failed" || return 1
    fi
    mv -T -- "$backup" "$current" || return 1
  fi
  [[ -f $current/deploy/ecosystem.config.cjs ]] || return 1
  pm2 restart "$current/deploy/ecosystem.config.cjs" --update-env || return 1
  wait_healthy "$old_build_id" || return 1
  pm2 save || return 1
  log "Previous version restored. Failed release retained at: $failed"
}

finish() {
  local status=$?
  trap - EXIT INT TERM HUP
  if (( status != 0 && switch_started == 1 && committed == 0 )); then
    if ! rollback; then
      printf '[FeelCurve] ERROR: Automatic recovery was incomplete. Inspect %s and %s before changing files.\n' "$current" "$backup" >&2
    fi
  elif (( status != 0 )); then
    log 'Preparation failed. The running website was not switched.'
  fi
  exit "$status"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

verify_process >/dev/null || fail 'Current PM2 process is not healthy; no update was started.'
actual_sha=$(sha256sum -- "$archive")
[[ ${actual_sha%% *} == "$expected_sha" ]] || fail 'Upload SHA-256 does not match.'

log 'Checking package and available disk space.'
python3 - "$archive" "$deploy_root" "$build_mode" <<'PY'
import pathlib
import shutil
import sys
import tarfile

archive, root, build_mode = sys.argv[1:]
required = {"package.json", "package-lock.json", "packages/web/package.json", "deploy/ecosystem.config.cjs", "deploy/update-server.sh"}
if build_mode == "prebuilt":
    required.update({
        "packages/web/.next/BUILD_ID",
        "packages/web/.next/required-server-files.json",
    })
allowed_roots = {"package.json", "package-lock.json", ".gitignore", "README.md", "update.cmd", "packages", "deploy"}
forbidden_parts = {".git", ".secrets", "dist"}
seen = set()
regular_files = set()
total = 0
try:
    with tarfile.open(archive, "r:gz") as source:
        members = source.getmembers()
        if len(members) > 50000:
            raise ValueError("Too many archive entries")
        for member in members:
            name = member.name
            while name.startswith("./"):
                name = name[2:]
            name = name.rstrip("/")
            parts = name.split("/")
            if not name or name.startswith("/") or "\\" in name or ":" in name or any(p in {"", ".", ".."} for p in parts):
                raise ValueError("Unsafe archive path")
            is_virtual_next_modules = parts[:4] == ["packages", "web", ".next", "node_modules"]
            if parts[0] not in allowed_roots or any(p in {".git", ".secrets"} or p.startswith(".env") for p in parts):
                raise ValueError("Unexpected or private archive entry")
            if "dist" in parts and not is_virtual_next_modules:
                raise ValueError("Unexpected dist content in archive")
            if "node_modules" in parts and not is_virtual_next_modules:
                raise ValueError("Unexpected node_modules content in archive")
            if ".next" in parts:
                if build_mode != "prebuilt" or parts[:3] != ["packages", "web", ".next"]:
                    raise ValueError("Unexpected .next entry")
                if len(parts) > 3 and parts[3] in {"cache", "dev", "diagnostics", "types", "trace", "trace-build"}:
                    raise ValueError("Development .next content is not allowed")
            if pathlib.PurePosixPath(name).suffix.lower() in {".pem", ".key", ".pfx", ".p12", ".db"} or name.lower().endswith((".db-journal", ".db-wal", ".db-shm")):
                raise ValueError("Private file in archive")
            if not (member.isdir() or member.isfile()):
                raise ValueError("Archive links and special files are not allowed")
            if name in seen:
                raise ValueError("Duplicate archive entry")
            seen.add(name)
            if member.isfile():
                regular_files.add(name)
                total += member.size
            if total > 1024 ** 3:
                raise ValueError("Source archive exceeds 1 GiB")
    if not required.issubset(regular_files):
        raise ValueError("Required source files are missing")
    if shutil.disk_usage(root).free < total + 2 * 1024 ** 3:
        raise ValueError("At least 2 GiB free space plus unpacked source size is required")
except (OSError, tarfile.TarError, ValueError) as error:
    print("[FeelCurve] Package validation failed: " + str(error), file=sys.stderr)
    sys.exit(1)
PY

install_dependencies() {
  local dir=$1
  shift
  (
    cd "$dir"
    if command -v systemd-run >/dev/null 2>&1; then
      log 'Installing dependencies with a 900 MB memory cap (systemd scope).'
      systemd-run --scope --quiet \
        -p MemoryMax=900M -p MemorySwapMax=1G \
        env NEXT_TELEMETRY_DISABLED=1 npm_config_registry="$npm_registry" \
        npm ci --no-audit --no-fund --prefer-offline "$@"
    else
      log 'systemd-run is unavailable; installing dependencies without a memory cap.'
      NEXT_TELEMETRY_DISABLED=1 npm_config_registry="$npm_registry" \
        npm ci --no-audit --no-fund --prefer-offline "$@"
    fi
  )
}

log "Preparing new release: $release_id (mode: $build_mode)"
mkdir -- "$release"
tar --extract --gzip --file "$archive" --directory "$release" --no-same-owner --no-same-permissions
if [[ $build_mode == prebuilt ]]; then
  [[ -s $release/packages/web/.next/BUILD_ID ]] || fail 'Prebuilt BUILD_ID is missing.'
  [[ -d $release/packages/web/.next/server ]] || fail 'Prebuilt server output is missing.'
  [[ -d $release/packages/web/.next/static ]] || fail 'Prebuilt static output is missing.'
  log 'Installing runtime dependencies for the prebuilt release.'
  install_dependencies "$release" --omit=dev --workspace @feelcurve/web --include-workspace-root
else
  log 'Installing dependencies and building on the server.'
  install_dependencies "$release" --workspace @feelcurve/web --include-workspace-root
  (
    cd "$release"
    NEXT_TELEMETRY_DISABLED=1 npm run build:web
  )
fi
[[ -s $release/packages/web/.next/BUILD_ID ]] || fail 'New build ID is missing.'
[[ -f $release/deploy/ecosystem.config.cjs ]] || fail 'New PM2 configuration is missing.'
new_build_id=$(cat "$release/packages/web/.next/BUILD_ID")

# Keep updates on this single configured application; a new name or port requires setup.
node - "$release" <<'NODE'
const path = require("node:path");
const root = process.argv[2];
const config = require(path.join(root, "deploy", "ecosystem.config.cjs"));
const apps = config.apps;
const expectedArgs = ["start", "--hostname", "127.0.0.1", "--port", "3000"];
if (!Array.isArray(apps) || apps.length !== 1 ||
    apps[0].name !== "feelcurve-web" ||
    apps[0].cwd !== path.join(root, "packages", "web") ||
    apps[0].script !== path.join(root, "node_modules", "next", "dist", "bin", "next") ||
    apps[0].exec_mode !== "fork" || apps[0].instances !== 1 ||
    JSON.stringify(apps[0].args) !== JSON.stringify(expectedArgs)) {
  console.error("[FeelCurve] PM2 configuration must keep the existing application, paths, and port.");
  process.exitCode = 1;
}
NODE

if [[ $build_mode == prebuilt ]]; then
  log 'Prebuilt release verified. Switching the website; a short restart follows.'
else
  log 'Build succeeded. Switching the website; a short restart follows.'
fi
switch_started=1
pm2 stop "$app_name"
cd "$deploy_root"
mv -T -- "$current" "$backup"
mv -T -- "$release" "$current"
pm2 restart "$current/deploy/ecosystem.config.cjs" --update-env
wait_healthy "$new_build_id" || fail 'New version did not pass health checks.'
pm2 save
committed=1
log "Update complete. Build: $new_build_id"
log "Previous version retained at: $backup"
