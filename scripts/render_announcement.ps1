Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 675
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Background: Luxury Space Navy Gradient
$pt1 = New-Object System.Drawing.Point(0, 0)
$pt2 = New-Object System.Drawing.Point($width, $height)
$c1 = [System.Drawing.Color]::FromArgb(255, 6, 11, 25)
$c2 = [System.Drawing.Color]::FromArgb(255, 13, 21, 41)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pt1, $pt2, $c1, $c2)
$g.FillRectangle($bgBrush, 0, 0, $width, $height)
$bgBrush.Dispose()

# Subtle geometric grid dots
$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 255, 255, 255))
for ($dx = 40; $dx -lt $width; $dx += 40) {
    for ($dy = 40; $dy -lt $height; $dy += 40) {
        $g.FillRectangle($dotBrush, $dx, $dy, 2, 2)
    }
}
$dotBrush.Dispose()

# Main Glass Card Container
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 14, 21, 40))
$g.FillRectangle($cardBrush, 40, 40, 1120, 595)
$cardBrush.Dispose()

$cardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45, 255, 255, 255), 1.5)
$g.DrawRectangle($cardPen, 40, 40, 1120, 595)
$cardPen.Dispose()

# Brushes
$cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$purpleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 192, 132, 252))
$grayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$slateBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 203, 213, 225))

# Top Brand Pill
$pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 56, 189, 248))
$g.FillRectangle($pillBrush, 75, 70, 125, 32)
$pillBrush.Dispose()

$pillPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 56, 189, 248), 1)
$g.DrawRectangle($pillPen, 75, 70, 125, 32)
$pillPen.Dispose()

$headerFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$g.DrawString("AETHER FEED", $headerFont, $cyanBrush, 85, 77)

$subTagFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$g.DrawString("OFFICIAL TEAM ANNOUNCEMENT", $subTagFont, $grayBrush, 220, 77)

# Title
$titleFont = New-Object System.Drawing.Font("Segoe UI", 36, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Welcome Tarun Dhal", $titleFont, $whiteBrush, 70, 122)

# Role Banner
$roleBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 168, 85, 247))
$g.FillRectangle($roleBgBrush, 75, 200, 490, 44)
$roleBgBrush.Dispose()

$rolePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 168, 85, 247), 1)
$g.DrawRectangle($rolePen, 75, 200, 490, 44)
$rolePen.Dispose()

$roleFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Lead Security & Community Moderator", $roleFont, $purpleBrush, 90, 210)

# Bullet Points
$listFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
$bulletItems = @(
    "24/7 Live Feed Moderation & Spam Elimination",
    "Strict Anti-Bot & Sybil Filtering Engine",
    "Protecting Real Creators Across Dlicom SocialFi",
    "Community Trust & Safety Guardian"
)

$curY = 275
foreach ($item in $bulletItems) {
    # Checkbox
    $chkBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 56, 189, 248))
    $g.FillRectangle($chkBg, 78, [int]($curY + 3), 20, 20)
    $chkBg.Dispose()

    $chkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 56, 189, 248), 1)
    $g.DrawRectangle($chkPen, 78, [int]($curY + 3), 20, 20)
    $chkPen.Dispose()

    # Draw checkmark symbol
    $checkFont = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
    $g.DrawString([char]0x2713, $checkFont, $cyanBrush, 80, [int]($curY + 3))
    $checkFont.Dispose()

    $g.DrawString($item, $listFont, $slateBrush, 114, [int]$curY)
    $curY += 46
}

# Footer Divider
$footerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 255, 255, 255), 1)
$g.DrawLine($footerPen, 75, 545, 680, 545)
$footerPen.Dispose()

$footerFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Powered by Dlicom SocialFi", $footerFont, $grayBrush, 75, 565)
$g.DrawString("https://aether-feed.vercel.app/", $footerFont, $cyanBrush, 430, 565)

# Right Side: Avatar Card
$avatarPath = 'c:\my all works\Dlicom\Aether Feed\public\tarun_avatar.png'
if (Test-Path $avatarPath) {
    $avImg = [System.Drawing.Image]::FromFile($avatarPath)
    
    $boxX = 720
    $boxY = 80
    $boxW = 390
    $boxH = 505

    $avCardBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 18, 36))
    $g.FillRectangle($avCardBg, $boxX, $boxY, $boxW, $boxH)
    $avCardBg.Dispose()

    $avCardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 168, 85, 247), 1.5)
    $g.DrawRectangle($avCardPen, $boxX, $boxY, $boxW, $boxH)
    $avCardPen.Dispose()

    # Image
    $imgX = $boxX + 16
    $imgY = $boxY + 16
    $imgW = $boxW - 32
    $imgH = 385

    $g.DrawImage($avImg, $imgX, $imgY, $imgW, $imgH)
    $avImg.Dispose()

    $imgBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), 1)
    $g.DrawRectangle($imgBorderPen, $imgX, $imgY, $imgW, $imgH)
    $imgBorderPen.Dispose()

    # Bottom Meta Bar
    $metaY = $boxY + 418
    $metaH = 68
    $metaBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 24, 48))
    $g.FillRectangle($metaBg, $imgX, $metaY, $imgW, $metaH)
    $metaBg.Dispose()

    $metaPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), 1)
    $g.DrawRectangle($metaPen, $imgX, $metaY, $imgW, $metaH)
    $metaPen.Dispose()

    $nameFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
    $handleFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $subTitleFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)

    $g.DrawString("Tarun Dhal", $nameFont, $whiteBrush, ($boxX + 28), ($boxY + 428))
    $g.DrawString("Lead Security Moderator", $subTitleFont, $grayBrush, ($boxX + 28), ($boxY + 454))
    $g.DrawString("@SecurityLead", $handleFont, $purpleBrush, ($boxX + 245), ($boxY + 440))

    $nameFont.Dispose()
    $handleFont.Dispose()
    $subTitleFont.Dispose()
}

# Cleanup
$headerFont.Dispose()
$subTagFont.Dispose()
$titleFont.Dispose()
$roleFont.Dispose()
$listFont.Dispose()
$footerFont.Dispose()
$cyanBrush.Dispose()
$whiteBrush.Dispose()
$purpleBrush.Dispose()
$grayBrush.Dispose()
$slateBrush.Dispose()
$g.Dispose()

$outputPath = 'C:\Users\MANAS\.gemini\antigravity-ide\brain\289065c9-b609-4b8e-9481-d973359a4064\tarun_dhal_official_graphic_card.png'
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save('c:\my all works\Dlicom\Aether Feed\public\tarun_dhal_announcement.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Generated graphic card at $outputPath"
