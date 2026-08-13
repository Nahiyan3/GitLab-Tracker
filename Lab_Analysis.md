# Lab 1: Abstract Syntax Tree (AST) Analysis

## What Was Done
In this lab, a custom Node.js script (`server/lab_analysis/analyze_all_ast.js`) was created to perform deep static analysis on the backend TypeScript codebase. 

The script utilized the `typescript` compiler API to:
1. Recursively crawl through all `.ts` files in the backend `server/src` directory.
2. Parse each file's source code into an **Abstract Syntax Tree (AST)**.
3. Traverse the nodes of each AST to extract quantitative code metrics, specifically:
   * **Lines of Code (LOC)**
   * **Total AST Nodes**
   * **Variable Declarations**
   * **Function Definitions**
   * **Cyclomatic Complexity** (calculated by counting branching nodes like `if`, `for`, `while`, `&&`, `||`, etc.)
   * **Type Safety Usage** (counting the usage of the TypeScript `any` keyword)
4. Export the aggregated results into a structured JSON file (`backend_ast_analysis.json`) for further review.

## Outputs
The script successfully analyzed the entire backend and generated a summary output in the console and the JSON file.

**High-Level Metric Summary:**
*   **Total Files Analyzed:** Over 50 backend modules
*   **Total Backend Lines of Code:** ~9,000+ lines scanned
*   **Total Variables Declared:** ~1,000+ variables tracked
*   **Average Cyclomatic Complexity:** ~13.5 per file

## Key Findings
Based on the generated `backend_ast_analysis.json` output, the analysis revealed several critical architectural insights:

1. **Extreme Cyclomatic Complexity (Refactoring Candidate):** 
   The file `utils/healthScoreCalculator.ts` is the most complex file in the backend, scoring a cyclomatic complexity of **101** across just 285 lines of code. This indicates an extremely high density of `if/else` branching or calculation logic, making it difficult to test and maintain. It should be refactored into smaller, more manageable functions.

2. **Controller Bloat:** 
   The `controllers/doraMetricsController.ts` file has a complexity score of **68** and contains 565 lines of code. This violates the "thin controller, fat service" design pattern, indicating that business logic is likely leaking into the routing/controller layer instead of being handled by dedicated backend services.

3. **Technical Debt (Poor Type Safety):** 
   The AST parser specifically scanned for the `any` keyword, which defeats TypeScript's strict typing system. The analysis found that the database access layer (`db/queries.ts`) contains **42 instances** of the `any` keyword. This represents significant technical debt and a risk of runtime errors when handling database queries, suggesting that stronger type interfaces need to be implemented for the database responses.

# SonarCloud Static Code Analysis

## What Was Done
As part of the continuous static analysis for Lab 1, the entire `GitLab-Tracker` repository (frontend and backend) was integrated with and scanned by **SonarCloud**. This platform performs deep static application security testing (SAST), code quality checks, and duplication detection across the 43,000 lines of code in the project.

## Outputs
The SonarCloud analysis completed but marked the project's overall Quality Gate status as **Failed**. The dashboard generated a comprehensive breakdown of bugs, vulnerabilities, code smells, and technical debt.

**High-Level Project Metrics:**
*   **Total Project Size:** ~43k Lines of Code (HTML, TypeScript, etc.)
*   **Quality Gate Status:** ❌ Failed
*   **Security Grade:** C (57 issues)
*   **Reliability Grade:** D (518 issues)
*   **Maintainability Grade:** A (1.3k issues)
*   **Code Duplication:** 22.3%
*   **Test Coverage:** Not calculated (0%)
*   **Security Hotspots Reviewed:** 0.0% (Grade E)

## Key Findings
Based on the detailed SonarCloud breakdown, the following critical insights were gathered regarding the software's quality and architectural health:

1. **High Code Duplication (Architectural Debt):** 
   SonarCloud reported a massive **22.3%** code duplication rate across the 43k lines of code. This perfectly corroborates the findings from the `jscpd` analysis (which found heavy duplication across the metric-gathering services). A quarter of the codebase being duplicated means fixing a single bug might require identical changes in multiple files, severely hindering maintainability.

2. **Severe Reliability Issues (Bugs & Criticals):**
   The project received a **"D" grade in Reliability** due to 518 reliability issues. The detailed breakdown indicates there is at least **1 active Bug** and **22 High/Critical severity issues** (split across 1 Reliability issue and 21 Maintainability issues). The presence of these critical issues likely triggered the Quality Gate failure, meaning the code is currently unfit for production deployment until these are resolved.

3. **Poor Maintainability (Code Smells):**
   Despite receiving an "A" grade in overall maintainability (likely because the ratio of smells to the massive 43k LOC is acceptable), there are still **1.3k total maintainability issues** and **21 Critical Code Smells**. Furthermore, there are **1.4k Major** and **302 Minor** issues. These code smells indicate confusing logic, unused variables, or overly complex functions (which aligns perfectly with the AST analysis finding cyclomatic complexities over 100).

4. **Security Vulnerability Neglect:**
   The project received a **"C" grade for Security** with 57 flagged issues, and a concerning **"E" grade (0.0%) for Security Hotspots Reviewed**. This indicates that while SonarCloud has flagged potentially dangerous code segments (like hardcoded credentials, weak cryptography, or unsafe regex), developers have completely ignored reviewing or mitigating these security hotspots.

5. **Lack of Automated Testing:**
   The Code Coverage metric is empty (`-`), revealing that there are zero unit tests or integration tests being reported to SonarCloud. Without test coverage, there is no safety net to prevent regressions when fixing the 1.4k+ code smells.

# Lab 2: Semantic Code Property Graph (CPG) Analysis

## What Was Done
In this lab, the project moved beyond simple syntax checking and utilized **Joern** to perform deep semantic analysis. A Code Property Graph (`tracker.cpg`) was previously generated, which combined the Abstract Syntax Tree (AST), Control Flow Graph (CFG), and Data Flow Graph (DFG) into a single, queryable database.

An interactive Joern shell was launched via a Docker container, and custom Scala queries were executed against the graph to audit the application's architectural health, security posture, and network dependencies.

Specific graph queries were run to find:
1. Functions with extreme control structure density (Complexity).
2. Hardcoded secret leaks and environment variable (`process.env`) usage.
3. Centralization of network calls (`axios`/`fetch`).

## Outputs
The Joern interactive shell successfully loaded the graph and traversed the Abstract Syntax Tree to return precise file and function paths (`fullName`) matching the query parameters.

**Key Query Outputs:**
*   **Complexity Query:** Returned a list of the top 10 most complex methods/files.
*   **Env Query:** Mapped exactly which services interact with `process.env`.
*   **Network Query:** Listed all methods across the codebase that initiate HTTP requests.

## Key Findings
Based on the results returned from the Joern graph queries, the following architectural insights were confirmed:

1. **Overloaded Constructors (Architectural Debt):** 
   While the analysis confirmed `utils/healthScoreCalculator.ts` is the most complex file (100 control structures), the query revealed a new, deeper issue: The constructor (`<init>`) of `GitLabIssueService` has an extremely high complexity score (40 control structures). This is a known anti-pattern. Constructors should be lightweight and only assign state; they should not contain heavy branching logic or complex setups.

2. **Secure Configuration Management:**
   By tracking the usage of `process.env` through the AST, Joern confirmed that environment variables are being accessed securely and properly. The graph proved that config variables are strictly isolated to foundational files (`db/connection.ts`, `index.ts`) and specific API clients (`geminiService`, `gitlabClient`, `sonarMaintainabilityApiService`). No environment variables are leaking into generic controllers or utility functions.

3. **Strict Service-Layer Adherence (Network Centralization):**
   The query searching for `axios` and `fetch` proved that the application strictly follows the Service-Layer architectural pattern. Joern found that 100% of external HTTP requests are centralized within dedicated API service classes (`googleSheetsService`, `gitlabClient`, and the various `sonar` API services). Not a single rogue HTTP request was found leaking into the routing controllers or database layers.


# Lab 3: Static Dependency Graphing (Madge)

## What Was Done
In this lab, the structural coupling and module dependencies of the backend were analyzed using **Madge**. The goal was to map out how different files and components rely on each other, detect any dangerous import loops, and identify the core structural hubs of the application.

1. **Dependency Extraction:** Madge was run against the `server/src` directory (`npx madge --json src > madge-output.json`). This crawled every TypeScript file and parsed all `import` statements to generate a massive, interconnected graph of the application's dependencies.
2. **Programmatic Interrogation:** Instead of manually reading the JSON file, a custom analysis script (`analyze-madge.js`) was executed to traverse the graph and calculate two critical architectural metrics:
   * **Circular Dependencies:** Identifying loops (e.g., A imports B, B imports A) that can cause runtime crashes or memory leaks.
   * **Architectural Hubs (Centrality):** Counting the number of "incoming" dependencies for every file to see which modules the rest of the application relies on the most.

## Outputs
The Madge extraction successfully mapped the entire architecture and the custom script provided a clear ranking of the most heavily imported files in the system.

**High-Level Metric Summary:**
*   **Total Circular Dependencies:** 0
*   **Most Depended-Upon File:** `db/connection.ts` (15 incoming imports)
*   **Most Depended-Upon Service:** `services/gitlab/gitlabClient.ts` (9 incoming imports)

## Key Findings
Based on the output of the dependency graph, the following architectural insights were established:

1. **Healthy Dependency Hierarchy (Zero Import Loops):**
   The script found **zero circular dependencies**. This is an incredibly strong indicator of architectural health. It proves that the application's flow is strictly unidirectional (Controllers -> Services -> Database), preventing the "chicken or egg" module-loading crashes common in Node.js applications.

2. **Database Centrality (Expected Hub):**
   `db/connection.ts` is the most relied-upon file in the entire project, imported by 15 different files. `db/queries.ts` is also a major hub (8 imports). This is an expected and healthy pattern for a data-driven dashboard, showing that database access is properly centralized rather than scattered across random files.

3. **External API Bottlenecks:**
   The `gitlabClient.ts` is the most imported service in the application (9 dependents). This makes sense, as the GitLab tracker fundamentally relies on fetching data from GitLab. However, this high centrality means that any bug, rate-limit failure, or unhandled promise rejection in `gitlabClient.ts` will instantly ripple out and crash at least 9 other major services. Ensuring this file has bulletproof error handling (and perhaps a circuit breaker) is paramount.

4. **Strong Typing Discipline:**
   The `types/sonarQubeMetrics.types.ts` and `types/index.ts` files are heavily imported (9 and 8 dependents, respectively). This proves that the codebase relies heavily on strict, centralized TypeScript interfaces across multiple files, rather than using inline or `any` types for data passing.


# Lab 4: Reverse Engineering & Documentation Recovery (TypeDoc)

## What Was Done
In this lab, the codebase was analyzed to dynamically recover and generate API documentation directly from the source code. Instead of manually writing wiki pages that easily become outdated, **TypeDoc** was utilized to read the TypeScript compiler's Abstract Syntax Tree and automatically construct an interactive HTML documentation site.

1. **Documentation Generation:** TypeDoc was executed (`npx typedoc --entryPointStrategy expand src --out docs`) against the backend repository to map out all modules, classes, and types into a browsable website.
2. **JSDoc Experiment:** A "Before/After" experiment was conducted on the `calculateIssueHealthScore` function to demonstrate the power of JSDoc. `/** ... */` comments featuring `@param` and `@returns` metadata were added to the source code to see how static analysis tools parse generalized comments into rich HTML tables.

## Outputs
The generation process successfully created a local static website (`server/docs/index.html`) containing hyperlinked documentation for every file, class, interface, and function in the backend's public API. 

## Key Findings
Through interacting with the generated TypeDoc site, several critical insights regarding the project's documentation and API structure were uncovered:

1. **Exposure of Technical Debt (Missing Types):** 
   TypeDoc perfectly corroborated the findings from Lab 1 regarding poor type safety. When analyzing controller functions (like `getCommitMetricsHistory`), TypeDoc explicitly highlighted that the function returns a `Promise` containing `any`. Because the TypeScript code lacked a strict interface (e.g., returning `CommitMetric[]`), the documentation tool was forced to expose the `any` type, acting as an automated auditor for technical debt.

2. **The "Public API" Audit:**
   The generation process revealed an important architectural quirk in how the application manages visibility. Files like `commitMetricsDbService.ts` exported a class instance (`export default new CommitMetricsDbService();`) but did not export the `class` blueprint itself. Because the class wasn't explicitly exported, TypeDoc classified the blueprint as "internal/private" and hid its methods from the documentation. This proves TypeDoc is highly effective at enforcing and auditing what parts of the codebase are truly "public" versus "private."

3. **JSDoc as a Universal Source of Truth:**
   The `calculateIssueHealthScore` experiment successfully proved that combining strict TypeScript types (inline object types) with JSDoc descriptions creates self-maintaining documentation. The analysis confirmed that standardizing around JSDoc does not just generate a website, but universally improves the developer experience (DX) by providing IDE IntelliSense directly in tools like VS Code.

# Lab 5: Dynamic Performance Profiling (Clinic.js)

## What Was Done
In this lab, the backend was moved from static analysis into **Dynamic Performance Profiling**. The goal was to identify synchronous, CPU-intensive bottlenecks that might block the Node.js event loop during heavy operations.

1. **Instrumentation:** The Node.js server was executed through the Clinic.js profiler using the command `npx clinic flame -- node dist/index.js`. 
2. **Runtime Execution:** The server was left running and interacted with for **75 seconds**, allowing the profiler to sample the CPU and record exactly how much time the V8 engine spent inside every single JavaScript function.
3. **Filtering:** To make the results actionable, internal Node.js core dependencies were filtered out of the UI, leaving only the application's source code (`dist`) and 3rd-party `node_modules` dependencies.

## Outputs
Clinic.js successfully generated an interactive HTML **Flamegraph**. In a flamegraph, the x-axis represents the percentage of total CPU time consumed, and the y-axis represents the call stack (functions calling other functions). Wider blocks indicate functions that monopolized the CPU.

## Key Findings
Based on the generated Flamegraph visualization, several major performance characteristics and bottlenecks were identified:

1. **AI Processing Overhead (`geminiService.js` & `aiController.js`):**
   A significant portion of the CPU time on the left side of the graph is consumed by the AI integration layers. The profiler highlighted `services/ai/geminiService.js` as the hottest frame (taking up the most width). This indicates that the synchronous tasks of assembling massive metric prompts, or parsing the incoming JSON strings from the Gemini API, are highly CPU-intensive and could briefly block the event loop for other users.

2. **Heavy File Processing Bottleneck (`xlsx.js`):**
   Directly above the AI service stacks, there is a very distinct, solid vertical block labeled `make_xlsx_lib` and `xlsx.js`. This proves that generating or parsing Excel spreadsheets (likely for metric exports or Google Sheets syncing) is a massive synchronous operation. Because Node.js is single-threaded, whenever this `xlsx` library is doing work, it monopolizes the CPU. *Actionable takeaway: If Excel generation becomes too slow, it should be moved to a background worker thread or a job queue.*

3. **Healthy Routing Layer:**
   On the far right of the graph, there are many thin, jagged spikes originating from `express/lib/application.js` and `routes/index.js`. These represent the standard Express routing and middleware overhead. Because these blocks are very narrow (not wide), it proves the API routing layer is highly optimized and fast, passing requests to the controllers without wasting CPU time.
