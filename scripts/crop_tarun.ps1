Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\MANAS\.gemini\antigravity-ide\brain\289065c9-b609-4b8e-9481-d973359a4064\.user_uploaded\media_1787578516949.png'
$outPath = 'c:\my all works\Dlicom\Aether Feed\public\tarun_avatar.png'

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
# Center square in 1024x576 WhatsApp preview
$x = 341
$y = 142
$w = 342
$h = 342

$cropRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
$target = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($target)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$g.DrawImage($src, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$target.Dispose()
$src.Dispose()

Write-Output "Avatar cropped to $outPath"
