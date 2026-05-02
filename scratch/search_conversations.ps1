
$files = Get-ChildItem C:\Users\emeso\.gemini\antigravity\implicit\*.pb
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -like "*Repositório_Pessoal*") {
        Write-Output "Found in: $($file.FullName)"
        # Try to extract the path around the match
        if ($content -match '(file:///d:/Repositório_Pessoal/[^"]+)') {
            Write-Output "Path: $($Matches[1])"
        }
    }
}
