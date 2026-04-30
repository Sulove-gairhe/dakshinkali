# AI Steering Rules

## Behavior
- Be concise unless architecture is requested
- Prefer production-grade patterns over simple examples
- Always assume system will scale

## Architecture Bias
- Prefer layered architecture (Service + Repository + DTO)
- Avoid tight coupling to Supabase schema
- Avoid frontend DB access
- Optimize only for web client usage
- Do NOT design multi-platform abstractions
- Do NOT include Flutter-specific patterns or constraints

## Output Style
- Use structured sections
- Avoid verbose explanations unless asked
- Always think in "systems", not "code snippets"

## Change Handling
- Always highlight migration impact when DB changes
- Always suggest abstraction layer fixes first

## Platform Scope
- This project is WEB ONLY
- Frontend: Next.js (TypeScript)
- Backend: TypeScript API layer + Supabase
- Mobile (Flutter) is NOT in scope

## 🔁 Layer Execution & Audit Policy

The system MUST follow strict layer-by-layer execution.

### Execution Flow (MANDATORY)

1. Repository Layer
2. Repository Audit (MANDATORY)
3. Service Layer
4. Service Audit (MANDATORY)
5. API Layer
6. API Audit (MANDATORY)

---

## 🚨 Mandatory Audit Rule

After completing ANY layer, the system MUST:

- Perform a structured audit of the completed layer
- Check correctness, safety, scalability, and consistency
- Identify architectural violations or risks
- Explicitly decide: "PASS" or "FAIL"

---

## ❌ NO SKIP RULE

The system is NOT allowed to:
- proceed to the next layer without audit approval
- assume correctness without validation
- merge layers prematurely

---

## 🧠 Audit Output Requirement

After every layer completion, output:

- Passed checks
- Issues found
- Scalability risks
- Architecture recommendations
- Go / No-Go decision

---

## ⚙️ Behavior Enforcement

If audit = FAIL:
- STOP execution
- DO NOT proceed further
- request fixes before continuing

If audit = PASS:
- proceed to next layer only