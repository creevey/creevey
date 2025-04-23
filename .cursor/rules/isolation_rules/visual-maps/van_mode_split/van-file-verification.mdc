---
description: Visual process map for VAN mode file verification
globs: van-file-verification.mdc
alwaysApply: false
---
# VAN MODE: FILE VERIFICATION

> **TL;DR:** Checks for the existence and basic structure of essential Memory Bank and documentation components.

## 📁 FILE VERIFICATION PROCESS

```mermaid
graph TD
    FV["File Verification"] --> CheckFiles["Check Essential Files"]
    CheckFiles --> CheckMB["Check Memory Bank<br>Structure"]
    CheckMB --> MBExists{"Memory Bank<br>Exists?"}
    
    MBExists -->|"Yes"| VerifyMB["Verify Memory Bank<br>Contents (Basic)"]
    MBExists -->|"No"| CreateMB["Create Memory Bank<br>Structure (Basic)"]
    
    CheckFiles --> CheckDocs["Check Documentation<br>Files (e.g., tasks.md)"]
    CheckDocs --> DocsExist{"Docs<br>Exist?"}
    
    DocsExist -->|"Yes"| VerifyDocs["Verify Documentation<br>Presence"]
    DocsExist -->|"No"| CreateDocs["Create Essential<br>Documentation Files"]
    
    VerifyMB & CreateMB --> MBCP["Memory Bank<br>Checkpoint"]
    VerifyDocs & CreateDocs --> DocsCP["Documentation<br>Checkpoint"]
    
    MBCP & DocsCP --> FileComplete["File Verification<br>Complete"]
    
    style FV fill:#4da6ff,stroke:#0066cc,color:white
    style FileComplete fill:#10b981,stroke:#059669,color:white
    style MBCP fill:#f6546a,stroke:#c30052,color:white
    style DocsCP fill:#f6546a,stroke:#c30052,color:white
```

## 📋 CHECKPOINT VERIFICATION TEMPLATE (Example)

```
✓ SECTION CHECKPOINT: FILE VERIFICATION
- Memory Bank Directory Exists/Created? [YES/NO]
- Essential Docs (tasks.md) Exist/Created? [YES/NO]

→ If all YES: File Verification Complete.
→ If any NO: Resolve before proceeding.
```

**Next Step:** Load and process `van-complexity-determination.mdc`. 