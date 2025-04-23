---
description: Visual process map for VAN mode (Index/Entry Point)
globs: van-mode-map.mdc
alwaysApply: false
---
# VAN MODE: INITIALIZATION PROCESS MAP (INDEX)

> **TL;DR:** This is the entry point for VAN mode. It handles initial activation and directs the process to subsequent steps stored in separate files for optimization.

## 🚀 VAN MODE ACTIVATION

When the user types "VAN", respond with a confirmation and start the process:

```
User: VAN

Response: OK VAN - Beginning Initialization Process
Loading Platform Detection map...
```

## 🧭 VAN MODE PROCESS FLOW (High Level)

This graph shows the main stages. Each stage is detailed in a separate file loaded sequentially.

```mermaid
graph TD
    Start["START VAN MODE"] --> PlatformDetect["1. PLATFORM DETECTION
(van-platform-detection.mdc)"]
    PlatformDetect --> FileVerify["2. FILE VERIFICATION
(van-file-verification.mdc)"]
    FileVerify --> Complexity["3. EARLY COMPLEXITY
DETERMINATION
(van-complexity-determination.mdc)"]
    Complexity --> Decision{"Level?"}
    Decision -- "Level 1" --> L1Complete["Level 1 Init Complete"]
    Decision -- "Level 2-4" --> ExitToPlan["Exit to PLAN Mode"]

    %% Link to QA (Loaded separately)
    QA_Entry["VAN QA MODE
(Loaded Separately via
'VAN QA' command)"] -.-> QA_Map["(van-qa-validation.mdc)"]

    style PlatformDetect fill:#ccf,stroke:#333
    style FileVerify fill:#ccf,stroke:#333
    style Complexity fill:#ccf,stroke:#333
    style QA_Map fill:#fcc,stroke:#333
```

**Next Step:** Load and process `van-platform-detection.mdc`. 