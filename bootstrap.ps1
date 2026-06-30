$Root="C:\trollmatch"

Write-Host "Creating TrollMatch structure..."

$folders=@(
"$Root\.cursor",
"$Root\.cursor\rules",
"$Root\.cursor\prompts",

"$Root\docs",
"$Root\tasks",
"$Root\prompts",

"$Root\research",
"$Root\research\manufacturers",
"$Root\research\competitors",
"$Root\research\community",
"$Root\research\species",
"$Root\research\techniques",
"$Root\research\images",

"$Root\database",
"$Root\api",
"$Root\ui",

"$Root\assets",
"$Root\assets\logos",
"$Root\assets\screenshots",
"$Root\assets\sample-images"
)

foreach($folder in $folders){
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

$files=@(

"$Root\README.md",
"$Root\LICENSE",
"$Root\.gitignore",

"$Root\docs\000_DISCOVERY.md",
"$Root\docs\001_PROJECT_CHARTER.md",
"$Root\docs\002_ENGINEERING_PRINCIPLES.md",
"$Root\docs\003_MASTER_CONTEXT.md",
"$Root\docs\004_DECISIONS.md",
"$Root\docs\005_BACKLOG.md",
"$Root\docs\006_SYSTEM_ARCHITECTURE.md",
"$Root\docs\007_DATABASE_VISION.md",
"$Root\docs\008_TECH_STACK.md",
"$Root\docs\009_ROADMAP.md",
"$Root\docs\010_CURSOR_RULES.md",
"$Root\docs\011_GLOSSARY.md",

"$Root\.cursor\rules\architecture.md",
"$Root\.cursor\rules\coding.md",
"$Root\.cursor\rules\database.md",
"$Root\.cursor\rules\performance.md",
"$Root\.cursor\rules\security.md",
"$Root\.cursor\rules\ui.md",
"$Root\.cursor\rules\ai.md"

)

foreach($file in $files){

if(!(Test-Path $file)){
New-Item -ItemType File $file | Out-Null
}

}

Set-Content "$Root\README.md" @"
# TrollMatch

Internal Repository

Public Platform

Guide.BalikOltamda.net

Status

Sprint 0
"@

Set-Content "$Root\LICENSE" @"
Private Project

Copyright © Balik Oltamda
"@

Set-Content "$Root\.gitignore" @"
node_modules
.next
dist
coverage
.env*
"@

Write-Host ""
Write-Host "Bootstrap completed."
Write-Host ""