# Software Engineering Lab Analysis Report
**Project:** GitLab Tracker Dashboard

This document serves as a comprehensive report of the reverse engineering, static analysis, dynamic profiling, and code duplication detection labs performed on this codebase.

---

## Lab 1 & 2: AST Analysis & Code Property Graphs (Joern)
* **Goal:** Understand the deep structural and semantic relationships within the codebase.
* **Tools Used:** Babel (AST), Joern, Neo4j
* **Key Files:** `server/lab_analysis/dump_ast.js`, `analyze_all_ast.js`
* **What was done:** 
  * Parsed the source code into an Abstract Syntax Tree (AST) to programmatically analyze code nodes (functions, variable declarations).
  * Generated a Code Property Graph (CPG) and ingested it into Neo4j to query and visualize the architectural complexity and control/data flow of the application.

---

## Lab 3: Static Dependency Graphing (Madge)
* **Goal:** Identify architectural hubs and ensure the structural integrity of the codebase.
* **Commands Run:** 
  ```bash
  npx madge --json server/src > madge-output.json
  node server/lab_analysis/madge/analyze-madge.js
  ```
* **Key Findings:**
  * **Circular Dependencies:** `0` circular dependencies were found, indicating a very healthy and well-structured import hierarchy.
  * **Architectural Hubs:** The custom analysis script revealed the most imported "hub" files in the system, specifically core files like `db/connection.ts` and `services/gitlab/gitlabClient.ts`.

---

## Lab 4: Reverse Engineering & Documentation Recovery (TypeDoc)
* **Goal:** Automatically recover and generate interactive API documentation purely from the TypeScript structure.
* **Commands Run:** 
  ```bash
  cd server
  npm install --save-dev typedoc
  npx typedoc --entryPointStrategy expand src --out docs
  ```
* **What was done:**
  * Generated a fully browsable HTML site (`server/docs/index.html`) mapping out all modules, classes, controllers, and data types (e.g., `MetricSnapshot`).
  * **Before/After Experiment:** Proved how TypeDoc utilizes JSDoc. Selected a bare function (`calculateIssueHealthScore`), added `@param` and `@returns` metadata, and regenerated the docs to show a massive transformation from a simple signature to a rich, explanatory table.

---

## Lab 5: Dynamic Performance Profiling (Clinic.js)
* **Goal:** Identify CPU-intensive bottlenecks during application runtime.
* **Commands Run:**
  ```bash
  npx clinic flame -- node dist/index.js
  ```
* **What was done:**
  * Instrumented the compiled Node.js backend to trace function execution times.
  * Overcame build-asset issues (missing `schema.sql`) to successfully generate a `.clinic/` Flamegraph.
  * **Output Meaning:** The Flamegraph visualizes the CPU time spent in every function on the call stack, allowing us to pinpoint the exact lines of code that consume the most runtime resources.

---

## Lab 6: Code Clone Detection (jscpd)
* **Goal:** Detect copy-pasted code to identify candidates for DRY (Don't Repeat Yourself) refactoring.
* **Commands Run:**
  ```bash
  npx jscpd server/src client/src --reporters html,console --output ./jscpd-report
  node fix-html.js
  ```
* **What was done:**
  * Scanned both the frontend and backend for duplicated logic.
  * Created a custom script (`fix-html.js`) to fix a known bug in `jscpd`, successfully injecting the raw duplicated source code directly into the HTML report (`jscpd-report/jscpd-report.html`).
* **Key Findings:**
  * **Total Duplication:** Found 81 clones accounting for **4.91% (594 lines)** of the codebase.
  * **The Metric Services:** Confirmed the hypothesis that the metric-gathering services are structurally identical. Massive duplication was found across:
    * *SonarQube Services:* Maintainability, Reliability, and Security services.
    * *GitLab Services:* Issue, MR, and Commit metric services.
* **Refactoring Proposal:** These identical services should be refactored using a **Generic Strategy Pattern**. A single `BaseMetricSyncService` could be created to handle the API fetching and database insertions, passing in the specific metric type (e.g., "MR", "Issue") as a configuration parameter rather than duplicating the entire class.
