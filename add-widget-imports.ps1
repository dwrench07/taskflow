# Script to add WidgetInfo imports and info icons to all remaining dashboard widgets
# This script modifies dashboard component files to include info icon popovers

$componentsDir = "c:\Users\dheer\Everything\coding\applications\taskflow\src\components"
$importLines = @"
import { WidgetInfo } from "@/components/widget-info";
import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";
"@

# Files that still need updating (checked via grep - no "WidgetInfo" present)
$filesToUpdate = @(
    "dashboard-point-of-no-return.tsx",
    "dashboard-overdue-risk.tsx",
    "dashboard-push-analytics.tsx",
    "dashboard-frog-completion.tsx",
    "dashboard-tshirt-accuracy.tsx",
    "dashboard-push-funnel.tsx",
    "dashboard-task-velocity.tsx",
    "dashboard-tag-heatmap.tsx",
    "dashboard-habit-resilience.tsx",
    "dashboard-peak-hours.tsx",
    "dashboard-energy-matrix.tsx",
    "dashboard-worry-tracker.tsx",
    "dashboard-emotion-productivity.tsx",
    "dashboard-timelimit-adherence.tsx",
    "dashboard-goal-velocity.tsx",
    "dashboard-goals.tsx",
    "dashboard-goal-coverage.tsx",
    "dashboard-pillar-balance.tsx"
)

foreach ($fileName in $filesToUpdate) {
    $filePath = Join-Path $componentsDir $fileName
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    if ($content -match 'WidgetInfo') {
        Write-Host "SKIP (already has WidgetInfo): $fileName"
        continue
    }
    
    # Find the last import line and add our imports after it
    $lines = $content -split "`n"
    $lastImportIndex = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\s*import\s') {
            $lastImportIndex = $i
        }
    }
    
    if ($lastImportIndex -ge 0) {
        $newLines = @()
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $newLines += $lines[$i]
            if ($i -eq $lastImportIndex) {
                $newLines += 'import { WidgetInfo } from "@/components/widget-info";'
                $newLines += 'import { WIDGET_DESCRIPTIONS } from "@/lib/widget-descriptions";'
            }
        }
        $newContent = $newLines -join "`n"
        Set-Content $filePath $newContent -NoNewline -Encoding UTF8
        Write-Host "UPDATED imports: $fileName"
    } else {
        Write-Host "ERROR: No imports found in $fileName"
    }
}

Write-Host "`nDone adding imports to all files."
