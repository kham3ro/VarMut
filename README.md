# VarMut: Evidence-Driven Mutation Testing Tool for Solidity Smart Contracts

[![Solidity](https://img.shields.io/badge/Solidity-%3E%3D0.8.0-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**VarMut** is an automated, evidence-driven mutation testing framework engineered specifically for Solidity smart contracts within the Ethereum Virtual Machine (EVM) ecosystem. Built natively on top of the Hardhat development framework, VarMut bridges empirical software engineering with compiler-aware Abstract Syntax Tree (AST) mutations.

Unlike traditional mutation tools that indiscriminately inject superficial grammar substitutions, VarMut operates on an **Evidence-Driven Smart Contract Fault Model (ED-SCFM)** derived from real-world vulnerabilities reported in the National Vulnerability Database (NVD) and structured via Orthogonal Defect Classification (ODC). To resolve the combinatorial explosion of mutant generation, VarMut introduces a **Pre-Compilation Semantic Filter** that statically eliminates compiler-incompatible (stillborn) mutants, slashing overall execution time by up to 90% while yielding realistic mutation scores.

---

## Table of Contents
- [VarMut: Evidence-Driven Mutation Testing Tool for Solidity Smart Contracts](#varmut-evidence-driven-mutation-testing-tool-for-solidity-smart-contracts)
  - [Table of Contents](#table-of-contents)
  - [Key Features](#key-features)
  - [Architecture \& Workflow](#architecture--workflow)
  - [Installation](#installation)
- [Enable specific operators or all](#enable-specific-operators-or-all)
- [Disable specific operators](#disable-specific-operators)
- [Export mutated .sol source code to ./mutants/ for manual inspection](#export-mutated-sol-source-code-to-mutants-for-manual-inspection)
- [Execute full mutation testing workflow](#execute-full-mutation-testing-workflow)
- [Run a specific subset or partition of mutants](#run-a-specific-subset-or-partition-of-mutants)
- [Restore the original contracts after an interrupted run](#restore-the-original-contracts-after-an-interrupted-run)

---

## Key Features

- **Evidence-Driven Fault Injection:** Grounded in a comprehensive fault model synthesized from real-world CVE mining and ODC taxonomy.
- **Pre-Compilation Semantic Filter:** Static AST-level semantic checking to discard stillborn and trivially invalid mutants before invoking the Solidity compiler (`solc`).
- **Targeted Operator Suite:** A curated collection of **20 AST mutation operators** (5 pioneering domain-specific operators and 15 complementary operators).
- **Hardhat Native:** Seamlessly integrates with modern smart contract pipelines (`hardhat test`, Mocha/Chai, and TypeScript/JavaScript test runners).
- **Significant Performance Gains:** Reduces the active mutant space by 26% to 61% compared to traditional tools like varmut and Vertigo, drastically minimizing execution timeouts and gas simulation overhead.

---

## Architecture & Workflow

```plaintext
+---------------------------------------------+
|        Target Solidity Source Files         |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|          AST Generation & Parsing           |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|       Pre-Compilation Semantic Filter       | ---> [Discard Stillborn Mutants]
+----------------------+----------------------+
                       | (Valid Transformation Candidates)
                       v
+---------------------------------------------+
|       VarMut 20-Operator AST Mutator        |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|       Hardhat Test Runner & Sandbox         |
+----------------------+----------------------+
                       |
                       v
+---------------------------------------------+
|  Reports: results/mutations.json & HTML UI  |
+---------------------------------------------+

```
## Installation

Ensure you have [Node.js](https://nodejs.org/) (>= 18.x) and [Git](https://git-scm.com/) installed.

Clone the repository and install dependencies:

```bash
git clone [https://github.com/YOUR_USERNAME/VarMut.git](https://github.com/YOUR_USERNAME/VarMut.git)
cd VarMut
npm install

Verify your Hardhat setup: npx hardhat compile

ConfigurationVarMut can be configured via varmut-config.js in your project's root directory:JavaScriptmodule.exports = {
  contractsDir: "contracts",               // Directory containing Solidity source files
  testDir: "test",                         // Directory containing test suites
  buildDir: "artifacts",                   // Compilation output artifacts directory
  skipContracts: ["mock", "interfaces"],   // Paths/contracts to exclude from mutation
  skipTests: [],                           // Test files to exclude from execution
  testingFramework: "hardhat",             // Primary testing environment
  semanticFilter: true,                    // Enable pre-compilation stillborn filtering
  randomSampling: false,                   // Random mutant sampling (optional)
  randomMutants: 100,                      // Cap on sampled mutants if enabled
  testingTimeOutInSec: 300                 // Test execution timeout per mutant
};
CLI UsageOperator ManagementInspect and configure active mutation operators:Bash# List all registered operators and their current status
npx varmut list

# Enable specific operators or all
npx varmut enable
npx varmut enable PRand REENT-ORDER SIG-VERIF

# Disable specific operators
npx varmut disable AOR FVR
Mutant Generation & InspectionBash# Analyze target contracts and dry-run mutant generation (without running tests)
npx varmut lookup

# Export mutated .sol source code to ./mutants/ for manual inspection
npx varmut mutate
Test Execution & AssessmentBash# Run baseline pre-test suite to confirm original code passes 100% of tests
npx varmut pretest

# Execute full mutation testing workflow
npx varmut test

# Run a specific subset or partition of mutants
npx varmut test <startHash> <endHash>

# Restore the original contracts after an interrupted run
npx varmut restore
Results are exported synchronously to:results/mutations.json: Detailed mutant status (Killed, Lived, Timed-out).results/index.html: Interactive browser report with mutant diff viewer.Mutation Operators Catalog (20 Operators)VarMut implements 20 AST-level mutation operators categorized into domain-specific security operators and standard structural operators.1. Domain-Specific & Novel OperatorsCodeOperator NameTarget AST NodeRoot-Cause Fault TargetTransformation SummaryPRandPredictable Randomness MutationMemberAccess / FunctionCallWeak PRNG / Block Env ExploitsReplaces secure entropy or VRF calls with predictable blockchain variables (block.timestamp, block.prevrandao).REENT-ORDERReentrancy Sequence & Guard MutatorBlock.statements / ModifierCEI Violation / ReentrancyShifts external calls ahead of state variable writes, or strips nonReentrant locks.SIG-VERIFSignature Verification MutatorFunctionCall (ecrecover) / requireCryptographic Verification BypassBypasses ecrecover / ECDSA signer validation checks to simulate unauthorized access.UNINIT-UPGUpgradeable Initialization MutatorConstructor / ModifierProxy Logic HijackingDeletes _disableInitializers() lock in logic contract constructors or removes initializer.UCRUnchecked Call Result MutatorExpressionStatementSilent Low-Level Call FailuresRemoves return value checks (bool success) from low-level address.call interactions.2. Complementary & Standard OperatorsCodeOperator NameTarget AST NodeDescription & Mutation BehaviorAORArithmetic Operator ReplacementBinaryOperationSwaps arithmetic operators (+, -, *, /, %).RORRelational Operator ReplacementBinaryOperationInverts comparison operators (<, <=, >, >=, ==, !=).CORConditional Operator ReplacementBinaryOperationSubstitutes boolean logical operators (&& <-> ||).BLRBoolean Literal ReplacementBooleanLiteralInverts boolean constants (true <-> false).UORUnary Operator ReplacementUnaryOperationInverts unary operations (++ <-> --, strips !).IVRInitialization Value ReplacementVariableDeclarationRemoves explicit initial value assignments in declarations.AVRAssignment Value ReplacementAssignmentRemoves assignment statements or zeroes target variables.MODModifier Omission / DeletionModifierInvocationStrips access-control modifiers (e.g., onlyOwner).MORModifier Order ReplacementFunctionDefinitionReorders multiple chained modifier invocations.FVRFunction Visibility ReplacementFunctionDefinitionPromotes restricted visibility (internal/private to public).RSDReturn Statement DeletionReturnStatementDeletes return statements in functions with default/named returns.RVSReturn Value SubstitutionReturnStatementSubstitutes returned expressions with default literals (false, 0).SFRSafeMath Function ReplacementFunctionCallConverts SafeMath library calls to unchecked raw math.LSCLoop Statement ChangeForStatement / WhileStatementMutates loop boundary expressions to bypass iteration execution.SORStatement Order ReplacementBlock.statementsSwaps adjacent topologically independent statements.Benchmarks & Experimental DatasetsThe repository includes curated benchmark suites under benchmarks/ used to evaluate VarMut alongside baseline tools (varmut and Vertigo):Crowdfunding & Milestone Campaigns: Multi-contract systems featuring stateful pledge, refund, and milestone mechanisms.DeFi & Token Protocols: Realistic ERC-20 / Vault implementations testing access control, proxy upgrades, and arithmetic integrity.Research CitationIf you use VarMut or its underlying Evidence-Driven Fault Model in your academic research, please cite:Code snippet@mastersthesis{khamseh2026varmut,
  author       = {Roozbeh Khamseh},
  title        = {Fault Model and Corresponding Mutation Operators for Testing Smart Contracts},
  school       = {Faculty of Computer Science and Engineering, Shahid Beheshti University},
  year         = {2026},
  address      = {Tehran, Iran},
  note         = {Supervised by Dr. Hassan Haghighi, Advised by Dr. Maedeh Moshref Dehkordi}
}
LicenseThis project is licensed under the MIT License - see the LICENSE file for details.