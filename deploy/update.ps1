#requires -Version 5.1
[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9.-]*$')]
    [string]$Server = '47.116.63.161',

    [ValidateRange(1, 65535)]
    [int]$Port = 22,

    [string]$KeyPath,

    [switch]$PackageOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$originalLocation = Get-Location

function Invoke-Native {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program failed (exit $LASTEXITCODE). Deployment stopped."
    }
}

function Assert-Archive {
    param([string]$ArchivePath)

    $entries = @(& tar -tzf $ArchivePath)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read the source archive.' }

    $required = @(
        'package.json',
        'package-lock.json',
        'packages/web/package.json',
        'deploy/ecosystem.config.cjs',
        'deploy/update-server.sh'
    )
    $normalized = @()
    foreach ($entry in $entries) {
        $name = $entry -replace '^\./', ''
        if ($name -match '(^/|\\|^[A-Za-z]:|(^|/)\.\.(/|$))') {
            throw "Unsafe archive path: $name"
        }
        if ($name -notmatch '^((package\.json|package-lock\.json|README\.md|\.gitignore|update\.cmd)$|packages(/|$)|deploy(/|$))') {
            throw "Unexpected archive entry: $name"
        }
        if ($name -match '(^|/)(node_modules|\.next|\.git|\.secrets|dist)(/|$)|(^|/)\.env|\.(pem|key|pfx|p12|db)(/|$)|\.db-(journal|wal|shm)(/|$)') {
            throw "Excluded file found in archive: $name"
        }
        $normalized += $name.TrimEnd('/')
    }
    foreach ($name in $required) {
        if ($normalized -notcontains $name) { throw "Required source file missing: $name" }
    }

    $details = @(& tar -tvzf $ArchivePath)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect archive entry types.' }
    foreach ($detail in $details) {
        if ($detail -notmatch '^[-d]') {
            throw 'Archive contains a link or unsupported file type.'
        }
    }
}

try {
    Set-Location -LiteralPath $projectRoot
    foreach ($program in @('tar', 'ssh', 'scp')) {
        if (-not (Get-Command $program -ErrorAction SilentlyContinue)) {
            throw "Required command not found: $program"
        }
    }

    if (-not $KeyPath) { $KeyPath = Join-Path $projectRoot '.secrets\_feelcurve-ecs.pem' }
    if (-not $PackageOnly) {
        if (-not (Test-Path -LiteralPath $KeyPath -PathType Leaf)) {
            throw "SSH private key not found: $KeyPath"
        }
        $KeyPath = (Resolve-Path -LiteralPath $KeyPath).Path
    }

    $releaseId = [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
    $outputDir = Join-Path $projectRoot "output\deploy\$releaseId"
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    $archivePath = Join-Path $outputDir 'source.tar.gz'
    $serverScript = Join-Path $projectRoot 'deploy\update-server.sh'
    if (-not (Test-Path -LiteralPath $serverScript -PathType Leaf)) {
        throw 'deploy/update-server.sh is missing.'
    }

    Write-Host '[1/4] Packaging the current saved source files (no Git commit required)...'
    $tarArguments = @(
        '-czf', $archivePath,
        '--exclude=node_modules', '--exclude=.next', '--exclude=.git',
        '--exclude=.secrets', '--exclude=.env*',
        '--exclude=dist', '--exclude=*.tsbuildinfo', '--exclude=*.log',
        '--exclude=*.db', '--exclude=*.db-journal', '--exclude=*.db-wal', '--exclude=*.db-shm',
        '--exclude=*.pem', '--exclude=*.key', '--exclude=*.pfx', '--exclude=*.p12',
        'package.json', 'package-lock.json', 'packages', 'deploy'
    )
    foreach ($optional in @('README.md', '.gitignore', 'update.cmd')) {
        if (Test-Path -LiteralPath $optional -PathType Leaf) { $tarArguments += $optional }
    }
    Invoke-Native -Program 'tar' -Arguments $tarArguments
    Assert-Archive -ArchivePath $archivePath
    $hashStream = [System.IO.File]::OpenRead($archivePath)
    $hashAlgorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        $sha256 = [System.BitConverter]::ToString($hashAlgorithm.ComputeHash($hashStream)).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $hashStream.Dispose()
        $hashAlgorithm.Dispose()
    }

    $metadata = [ordered]@{
        releaseId = $releaseId
        createdAtUtc = [DateTime]::UtcNow.ToString('o')
        archiveSha256 = $sha256
        archiveBytes = (Get-Item -LiteralPath $archivePath).Length
        server = $Server
        includesUncommittedSavedFiles = $true
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path $outputDir 'release.json'), ($metadata | ConvertTo-Json), $utf8NoBom)
    Write-Host "Archive: $archivePath"
    if ($PackageOnly) {
        Write-Host 'Package verified. No server connection was made.'
        return
    }

    $sshOptions = @(
        '-i', $KeyPath,
        '-o', 'IdentitiesOnly=yes',
        '-o', 'StrictHostKeyChecking=yes',
        '-o', 'BatchMode=yes',
        '-o', 'ConnectTimeout=15',
        '-o', 'ServerAliveInterval=15',
        '-o', 'ServerAliveCountMax=4'
    )
    $remote = "root@$Server"
    $remoteDir = "/root/feelcurve-uploads/$releaseId"
    Write-Host '[2/4] Connecting and uploading the release...'
    Invoke-Native -Program 'ssh' -Arguments ($sshOptions + @('-p', "$Port", $remote, "umask 077 && install -d -m 700 /root/feelcurve-uploads && mkdir -m 700 '$remoteDir'"))

    # Upload an LF-only, BOM-free helper even when Windows checks out CRLF files.
    $scriptText = [System.IO.File]::ReadAllText($serverScript).TrimStart([char]0xFEFF).Replace("`r`n", "`n").Replace("`r", "`n")
    $uploadScript = Join-Path $outputDir 'update-server.sh'
    [System.IO.File]::WriteAllText($uploadScript, $scriptText, $utf8NoBom)
    Invoke-Native -Program 'scp' -Arguments ($sshOptions + @('-P', "$Port", $archivePath, $uploadScript, "${remote}:$remoteDir/"))

    Write-Host '[3/4] Building on the server, then switching with automatic rollback...'
    $remoteCommand = "bash '$remoteDir/update-server.sh' '$remoteDir/source.tar.gz' '$releaseId' '$sha256'"
    Invoke-Native -Program 'ssh' -Arguments ($sshOptions + @('-p', "$Port", $remote, $remoteCommand))

    Write-Host '[4/4] Deployment complete.'
    Write-Host "Website: http://$Server/"
    Write-Host "Release: $releaseId"
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Set-Location -LiteralPath $originalLocation.Path
}
