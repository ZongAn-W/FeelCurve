#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$testId = [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$fixture = Join-Path $projectRoot "output\deploy-tests\package-$testId"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Put-FixtureFile {
    param([string]$RelativePath, [string]$Text)
    $path = Join-Path $fixture $RelativePath
    New-Item -ItemType Directory -Path (Split-Path -Parent $path) -Force | Out-Null
    [System.IO.File]::WriteAllText($path, $Text, $utf8NoBom)
}

New-Item -ItemType Directory -Path (Join-Path $fixture 'deploy') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'deploy\update.ps1') -Destination (Join-Path $fixture 'deploy\update.ps1')
Copy-Item -LiteralPath (Join-Path $projectRoot 'deploy\update-server.sh') -Destination (Join-Path $fixture 'deploy\update-server.sh')
Put-FixtureFile 'package.json' '{"private":true}'
Put-FixtureFile 'package-lock.json' '{}'
Put-FixtureFile 'packages\web\package.json' '{"name":"@feelcurve/web"}'
Put-FixtureFile 'deploy\ecosystem.config.cjs' 'module.exports = {};'
Put-FixtureFile 'packages\web\uncommitted-source.ts' 'export const savedSource = "current-working-copy";'
foreach ($privateFile in @(
    '.secrets\private.pem',
    'packages\api\.env',
    'packages\web\.env.local',
    'packages\web\.envrc',
    'packages\web\private.pem',
    'packages\web\private.key',
    'packages\web\node_modules\fake\index.js',
    'packages\web\.next\BUILD_ID',
    'packages\api\dist\main.js',
    'packages\api\prisma\dev.db',
    'packages\api\prisma\dev.db-wal'
)) {
    Put-FixtureFile $privateFile 'TEST SENTINEL - not a real secret'
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $fixture 'deploy\update.ps1') -PackageOnly
if ($LASTEXITCODE -ne 0) { throw 'Package-only test failed.' }
$archives = @(Get-ChildItem -LiteralPath (Join-Path $fixture 'output\deploy') -Filter source.tar.gz -Recurse -File)
if ($archives.Count -ne 1) { throw 'Expected one package-only output.' }
$entries = @(& tar -tzf $archives[0].FullName)
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect test archive.' }
if ($entries -notcontains 'packages/web/uncommitted-source.ts') { throw 'Saved uncommitted source was not packaged.' }
$unexpected = @($entries | Where-Object { $_ -match 'private\.(pem|key)|(^|/)\.secrets/|(^|/)\.env|/(node_modules|\.next|dist)/|dev\.db' })
if ($unexpected.Count) { throw 'Excluded fixture files were packaged.' }
$content = & tar -xOzf $archives[0].FullName packages/web/uncommitted-source.ts
if ($LASTEXITCODE -ne 0 -or $content -notmatch 'current-working-copy') { throw 'Source content was not preserved.' }
Write-Host 'PASS: saved worktree files included; environment files, keys, dependencies, builds, and databases excluded.'

# NTFS hard links need no elevated symbolic-link privilege.
New-Item -ItemType HardLink -Path (Join-Path $fixture 'packages\web\linked-source.ts') -Target (Join-Path $fixture 'packages\web\uncommitted-source.ts') | Out-Null
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $fixture 'deploy\update.ps1') -PackageOnly
if ($LASTEXITCODE -eq 0) { throw 'Hard-link source archive was unexpectedly accepted.' }
Write-Host 'PASS: archives containing hard links are rejected before upload.'
Write-Host "Test artifacts retained at: $fixture"
