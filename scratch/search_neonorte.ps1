
$searchDir = "C:\Users\emeso\.gemini\antigravity"
$query = "neonorte"

$files = Get-ChildItem -Path $searchDir -Recurse -File
foreach ($file in $files) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        # Search for the string as UTF-8 and also as simple byte sequence if needed
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        if ($text.ToLower().Contains($query.ToLower())) {
            Write-Output "Match found in: $($file.FullName) (Size: $($file.Length) bytes)"
            # Extract a snippet around the match
            $index = $text.ToLower().IndexOf($query.ToLower())
            $start = [Math]::Max(0, $index - 50)
            $len = [Math]::Min(100, $text.Length - $start)
            $snippet = $text.Substring($start, $len) -replace '[^ -~]', '.'
            Write-Output "Snippet: ...$snippet..."
        }
    } catch {
        # Skip errors for non-readable files
    }
}
