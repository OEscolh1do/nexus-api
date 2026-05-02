
$searchDir = "C:\Users\emeso\.gemini\antigravity"

$files = Get-ChildItem -Path $searchDir -Recurse -File
$results = @{}

foreach ($file in $files) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        # Search for file:/// URIs
        if ($text -match '(file:///d:/[^" \x00-\x1F]+)') {
            $uri = $Matches[1]
            if (-not $results.ContainsKey($uri)) {
                $results[$uri] = @()
            }
            $results[$uri] += $file.FullName
        }
    } catch {}
}

foreach ($uri in $results.Keys) {
    Write-Output "URI found: $uri"
    Write-Output "Files: $($results[$uri] -join ', ')"
    Write-Output "-----------------"
}
