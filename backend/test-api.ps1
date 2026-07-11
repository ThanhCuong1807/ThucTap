# Test script for Malware Analysis API
# Run in PowerShell: powershell -ExecutionPolicy Bypass -File test-api.ps1

$API_URL = "https://uckjbtkjqk.execute-api.ap-southeast-1.amazonaws.com/dev"

Write-Host "=== Testing Upload Endpoint ===" -ForegroundColor Cyan

$body = @{
    fileName = "test.exe"
    fileSize = 1024
} | ConvertTo-Json

Write-Host "POST $($API_URL)/upload`n" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$($API_URL)/upload" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "Status: SUCCESS" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Status: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response Body: $body" -ForegroundColor Red
    }
}

Write-Host "`n=== Testing History Endpoint ===" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$($API_URL)/history" `
        -Method GET `
        -ContentType "application/json"

    Write-Host "Status: SUCCESS" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Status: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
