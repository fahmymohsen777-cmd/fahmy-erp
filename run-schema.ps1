$pat = "sbp_6721dc7285ce72dd11b53c0f42cb726adb215ab5"
$projectRef = "rzwfgxsyfddcfeaeieqk"

# Write SQL to temp file
$sql = Get-Content "d:\fahm\supabase-schema.sql" -Raw -Encoding UTF8
$tmpSqlFile = "d:\fahm\tmp_schema.sql"
[System.IO.File]::WriteAllText($tmpSqlFile, $sql, [System.Text.Encoding]::UTF8)

# Build JSON body using temp file
$tmpJsonFile = "d:\fahm\tmp_body.json"
$jsonContent = '{"query":' + ($sql | ConvertTo-Json) + '}'
[System.IO.File]::WriteAllText($tmpJsonFile, $jsonContent, [System.Text.Encoding]::UTF8)

Write-Host "Running schema against project: $projectRef"
Write-Host "JSON file size: $((Get-Item $tmpJsonFile).Length) bytes"

$result = C:\Windows\System32\curl.exe -s -X POST `
    -H "Authorization: Bearer $pat" `
    -H "Content-Type: application/json" `
    --data "@$tmpJsonFile" `
    "https://api.supabase.com/v1/projects/$projectRef/database/query"

Write-Host "Response: $result"

# Clean up
Remove-Item $tmpSqlFile -ErrorAction SilentlyContinue
Remove-Item $tmpJsonFile -ErrorAction SilentlyContinue
