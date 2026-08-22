Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\MANAS\.gemini\antigravity-ide\brain\9f050244-b4db-4fa8-ba51-08a757ca12f4\.user_uploaded\media_1787400289539.png"
$img = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $img.Width
$h = $img.Height

$colW = [int]($w / 3)

function Crop-And-Save($x, $y, $cropW, $cropH, $baseName) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $cropW, $cropH)
    $cropped = New-Object System.Drawing.Bitmap($cropW, $cropH)
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.DrawImage($img, [System.Drawing.Rectangle]::new(0, 0, $cropW, $cropH), $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $outDir = "c:\my all works\Dlicom\Aether Feed\public\roles"
    $cropped.Save("$outDir\$baseName.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Save("$outDir\$baseName.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $cropped.Dispose()
    Write-Host "Saved: $baseName.png & $baseName.jpg"
}

Crop-And-Save 0 0 $colW $h "dliever"
Crop-And-Save $colW 0 $colW $h "dcoded"
Crop-And-Save ($colW * 2) 0 ($w - ($colW * 2)) $h "dco"

$img.Dispose()
Write-Host "All 3 role mascots cropped and saved successfully!"
