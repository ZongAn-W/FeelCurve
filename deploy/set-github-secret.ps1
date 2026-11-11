param(
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9.-]*$')]
    [string]$Server = '47.116.63.161'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$key = Join-Path $PSScriptRoot '..\.secrets\_feelcurve-ecs.pem'
if (-not (Test-Path -LiteralPath $key)) {
    throw "SSH key not found: $key"
}

$secure = Read-Host -AsSecureString 'GitHub Client Secret (input hidden)'
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $secret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

try {
    if ([string]::IsNullOrWhiteSpace($secret)) {
        throw 'Secret is empty.'
    }
    if ($secret -notmatch '^[A-Za-z0-9]+$') {
        throw 'Unexpected secret format. GitHub client secrets are normally alphanumeric.'
    }

    $remoteHost = "root@$Server"
    $remoteCommand = 'cd /opt/feelcurve-api && IFS= read -r s && sed -i "s|^GITHUB_CLIENT_SECRET=.*|GITHUB_CLIENT_SECRET=$s|" .env && pm2 restart feelcurve-api --update-env && echo UPDATED'
    $secret | ssh -o BatchMode=yes -o ConnectTimeout=10 -i $key $remoteHost $remoteCommand
    if ($LASTEXITCODE -ne 0) {
        throw "SSH failed with exit code $LASTEXITCODE."
    }

    Write-Host 'Secret written. Checking the GitHub authorization redirect...'
    $result = & ssh -o BatchMode=yes -o ConnectTimeout=10 -i $key $remoteHost "curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' 'https://feelcurve.com/api/auth/github?next=%2F'"
    if ($LASTEXITCODE -ne 0) {
        throw "Redirect check failed with exit code $LASTEXITCODE."
    }
    Write-Host $result
    if ($result -notmatch '^302 https://github\.com/login/oauth/authorize') {
        Write-Warning 'The API did not redirect to GitHub. Check GITHUB_CLIENT_ID and the PM2 environment.'
    }
    else {
        Write-Host 'GitHub authorization redirect looks correct. Complete one browser login to verify the token exchange.'
    }
}
finally {
    $secret = $null
}
