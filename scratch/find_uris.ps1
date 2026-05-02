
$files = Get-ChildItem C:\Users\emeso\.gemini\antigravity\implicit\*.pb
foreach ($file in $files) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        $cleanText = $text -replace '[^ -~]', ''
        if ($cleanText -match 'file:///([^ ]+)') {
            Write-Output "$($file.Name): Found URI: $($Matches[0])"
        }
    } catch {
        # Skip errors
    }
}
