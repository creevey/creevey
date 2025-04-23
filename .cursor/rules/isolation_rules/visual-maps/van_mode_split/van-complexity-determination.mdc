---
description: Visual process map for VAN mode complexity determination
globs: van-complexity-determination.mdc
alwaysApply: false
---
# VAN MODE: EARLY COMPLEXITY DETERMINATION

> **TL;DR:** Analyzes the task to determine complexity level. For Level 1, VAN mode completes. For Levels 2-4, triggers a mandatory switch to PLAN mode.

## 🧩 COMPLEXITY DETERMINATION PROCESS

```mermaid
graph TD
    CD["Complexity<br>Determination"] --> AnalyzeTask["Analyze Task<br>Requirements"]
    
    AnalyzeTask --> CheckKeywords["Check Task<br>Keywords"]
    CheckKeywords --> ScopeCheck["Assess<br>Scope Impact"]
    ScopeCheck --> RiskCheck["Evaluate<br>Risk Level"]
    RiskCheck --> EffortCheck["Estimate<br>Implementation Effort"]
    
    EffortCheck --> DetermineLevel{"Determine<br>Complexity Level"}
    DetermineLevel -->|"Level 1"| L1["Level 1:<br>Quick Bug Fix"]
    DetermineLevel -->|"Level 2"| L2["Level 2:<br>Simple Enhancement"]
    DetermineLevel -->|"Level 3"| L3["Level 3:<br>Intermediate Feature"]
    DetermineLevel -->|"Level 4"| L4["Level 4:<br>Complex System"]
    
    L1 --> CDComplete["Complexity Determination<br>Complete (Level 1)"]
    L2 & L3 & L4 --> ModeSwitch["Force Mode Switch<br>to PLAN"]
    
    style CD fill:#4da6ff,stroke:#0066cc,color:white
    style CDComplete fill:#10b981,stroke:#059669,color:white
    style ModeSwitch fill:#ff0000,stroke:#990000,color:white
    style DetermineLevel fill:#f6546a,stroke:#c30052,color:white
```

## 🚨 MODE TRANSITION TRIGGER (VAN to PLAN)

If complexity is determined to be Level 2, 3, or 4:

```
🚫 LEVEL [2-4] TASK DETECTED
Implementation in VAN mode is BLOCKED
This task REQUIRES PLAN mode
You MUST switch to PLAN mode for proper documentation and planning
Type 'PLAN' to switch to planning mode
```

## 📋 CHECKPOINT VERIFICATION TEMPLATE (Example)

```
✓ SECTION CHECKPOINT: COMPLEXITY DETERMINATION
- Task Analyzed? [YES/NO]
- Complexity Level Determined? [YES/NO]

→ If Level 1: Proceed to VAN Mode Completion.
→ If Level 2-4: Trigger PLAN Mode transition.
```

**Next Step (Level 1):** Complete VAN Initialization (e.g., initialize Memory Bank if needed).
**Next Step (Level 2-4):** Exit VAN mode and initiate PLAN mode. 