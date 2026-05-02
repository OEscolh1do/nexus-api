
$file = "C:\Users\emeso\.gemini\antigravity\conversations\887daeee-ff55-49b5-86c0-b0dafc0a8e78.pb"
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($text -match '(file:///d:/[^" \x00-\x1F\\]+)') {
    Write-Output "Current Workspace URI: $($Matches[1])"
} else {
    Write-Output "URI not found in plain text"
}
