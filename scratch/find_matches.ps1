
$searchDir = "C:\Users\emeso\AppData\Roaming\Antigravity"
$query = "Neonorte"

$files = Get-ChildItem -Path $searchDir -Recurse -File
foreach ($file in $files) {
    try {
        if (Select-String -Path $file.FullName -Pattern $query -Quiet) {
            Write-Output "Match found in: $($file.FullName)"
        }
    } catch {}
}
