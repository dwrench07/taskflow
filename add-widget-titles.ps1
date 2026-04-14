# Script to add WidgetInfo component next to each dashboard widget title
# For each file, find the title text and add WidgetInfo after it

$componentsDir = "c:\Users\dheer\Everything\coding\applications\taskflow\src\components"

# Map: filename -> array of @{title, key} for each CardTitle in that file
$titleMappings = @(
    @{ file="dashboard-point-of-no-return.tsx"; title="Point of No Return"; key="point-of-no-return" },
    @{ file="dashboard-overdue-risk.tsx"; title="Overdue Risk"; key="overdue-risk" },
    @{ file="dashboard-push-analytics.tsx"; title="Push Analytics"; key="push-analytics" },
    @{ file="dashboard-frog-completion.tsx"; title="Frog Completion"; key="frog-completion" },
    @{ file="dashboard-tshirt-accuracy.tsx"; title="T-Shirt Accuracy"; key="tshirt-accuracy" },
    @{ file="dashboard-push-funnel.tsx"; title="Push Pipeline"; key="push-funnel" },
    @{ file="dashboard-task-velocity.tsx"; title="Task Velocity"; key="task-velocity" },
    @{ file="dashboard-tag-heatmap.tsx"; title="Tag Performance"; key="tag-heatmap" },
    @{ file="dashboard-habit-resilience.tsx"; title="Habit Resilience"; key="habit-resilience" },
    @{ file="dashboard-peak-hours.tsx"; title="Peak Productivity Hours"; key="peak-hours" },
    @{ file="dashboard-energy-matrix.tsx"; title="Energy vs Output"; key="energy-matrix" },
    @{ file="dashboard-worry-tracker.tsx"; title="Worry Accuracy"; key="worry-accuracy" },
    @{ file="dashboard-emotion-productivity.tsx"; title="Emotion"; key="emotion-productivity" },
    @{ file="dashboard-timelimit-adherence.tsx"; title="Time Limit Adherence"; key="timelimit-adherence" },
    @{ file="dashboard-goal-velocity.tsx"; title="Goal Velocity"; key="goal-velocity" },
    @{ file="dashboard-goals.tsx"; title="Goals"; key="goals" },
    @{ file="dashboard-goal-coverage.tsx"; title="Goal Coverage"; key="goal-coverage" },
    @{ file="dashboard-pillar-balance.tsx"; title="Pillar Balance"; key="pillar-balance" }
)

foreach ($mapping in $titleMappings) {
    $filePath = Join-Path $componentsDir $mapping.file
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # Check if WidgetInfo component is already in a CardTitle
    if ($content -match 'WidgetInfo description') {
        Write-Host "SKIP (already has WidgetInfo in title): $($mapping.file)"
        continue
    }
    
    $titleText = $mapping.title
    $key = $mapping.key
    
    # Find all occurrences of the title text inside CardTitle tags and add WidgetInfo after the FIRST one
    # We use regex to find: title text followed by newline or </CardTitle> but NOT already followed by WidgetInfo
    $widgetTag = "`n" + '          <WidgetInfo description={WIDGET_DESCRIPTIONS["' + $key + '"]} />'
    
    # Simple approach: find first occurrence of the title in the file and append WidgetInfo on next line
    $lines = $content -split "`n"
    $modified = $false
    $newLines = @()
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $newLines += $lines[$i]
        
        # Only modify the first occurrence where the title appears in a CardTitle context
        if (-not $modified -and $lines[$i] -match [regex]::Escape($titleText) -and ($lines[$i] -match 'CardTitle' -or ($i -gt 0 -and $lines[$i-1] -match 'CardTitle') -or ($i -gt 1 -and $lines[$i-2] -match 'CardTitle'))) {
            # Detect indentation
            $indent = ""
            if ($lines[$i] -match '^(\s+)') {
                $indent = $Matches[1]
            }
            $newLines += "${indent}<WidgetInfo description={WIDGET_DESCRIPTIONS[`"${key}`"]} />"
            $modified = $true
        }
    }
    
    if ($modified) {
        $newContent = $newLines -join "`n"
        Set-Content $filePath $newContent -NoNewline -Encoding UTF8
        Write-Host "UPDATED title: $($mapping.file)"
    } else {
        Write-Host "WARNING: Could not find title '$titleText' in $($mapping.file)"
    }
}

Write-Host "`nDone adding WidgetInfo to all titles."
