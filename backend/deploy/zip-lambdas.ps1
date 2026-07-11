# Zip Lambda source files for manual upload to AWS Console
# Usage from backend folder:
#   powershell -ExecutionPolicy Bypass -File deploy\zip-lambdas.ps1

$ErrorActionPreference = 'Stop'
$base = Split-Path -Parent $PSScriptRoot
$out  = Join-Path $base 'dist'
if (!(Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

$functions = @(
    @{ Name = 'upload';         Source = 'src/functions/upload/app.js' },
    @{ Name = 'results';        Source = 'src/functions/results/app.js' },
    @{ Name = 'history';        Source = 'src/functions/history/app.js' },
    @{ Name = 's3Handler';      Source = 'src/functions/s3Handler/app.js' },
    @{ Name = 'processor';      Source = 'src/functions/processor/app.js' },
    @{ Name = 'validateUpload'; Source = 'src/functions/validateUpload/app.js' },
    @{ Name = 'runAnalysis';    Source = 'src/functions/runAnalysis/app.js' },
    @{ Name = 'notifyUser';     Source = 'src/functions/notifyUser/app.js' }
)

foreach ($fn in $functions) {
    $src = Join-Path $base $fn.Source
    $zip = Join-Path $out ($fn.Name + '.zip')
    if (!(Test-Path $src)) {
        Write-Host "Missing: $src" -ForegroundColor Red
        continue
    }

    $tmpDir = Join-Path $out ($fn.Name + '_tmp')
    if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tmpDir | Out-Null

    try {
        $srcDir = Split-Path $src
        Copy-Item -Path $src -Destination (Join-Path $tmpDir 'app.js') -Force
        $rootPackage = Join-Path $base 'package.json'
        if (Test-Path $rootPackage) {
            Copy-Item -Path $rootPackage -Destination (Join-Path $tmpDir 'package.json') -Force
        }
        # NOTE: Do NOT copy node_modules here.
        # Dependencies are pre-installed via Lambda Layer or AWS SDK included in runtime.
        # If you need additional dependencies, create a Lambda Layer.

        if (Test-Path $zip) { Remove-Item $zip -Force }
        Push-Location $tmpDir
        Compress-Archive -Path '*' -DestinationPath $zip -Force
        Pop-Location

        Write-Host "Created $zip" -ForegroundColor Green
    }
    finally {
        if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
    }
}

Write-Host "`nDone. Zip files are in: $out" -ForegroundColor Cyan
