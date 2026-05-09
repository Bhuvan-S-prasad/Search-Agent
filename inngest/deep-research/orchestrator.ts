import { inngest } from "../client";
import { DEEP_RESEARCH_EVENT } from "../events";
import { supabaseAdmin as supabase } from "@/services/supabaseAdmin";
import { callOpenRouter } from "@/lib/openrouter";
import { extractJson } from "@/lib/json-utils";
import { appendActivityLog, updateSession } from "./utils";
import { getOrchestratorPlanningPrompt } from "./prompts";
import { researchSection } from "./sub-agent";
import { processCitations } from "./citation-agent";
import { synthesizeReport } from "./synthesis-agent";
import { reviewReport } from "./review-agent";
import {
    AGENT_MODELS,
    MAX_ITERATIONS,
    type ReportPlan,
    type SectionFindings
} from "./types";

/**
 * Deep Research Orchestrator
 */
export const deepResearchOrchestrator = inngest.createFunction(
    {
        id: "deep-research-orchestrator",
        retries: 1,
    },
    { event: DEEP_RESEARCH_EVENT },
    async ({ event, step }) => {
        const { sessionId, query } = event.data;

        console.log(`[DeepResearch] ====== SESSION START ======`);
        console.log(`[DeepResearch] Session ID: ${sessionId}`);
        console.log(`[DeepResearch] Query: "${query}"`);

        // Step 1: Plan report structure
        const reportPlan = await step.run("plan-report-structure", async () => {
            await appendActivityLog(sessionId, {
                agent: "orchestrator",
                action: "planning_started",
                detail: "Analyzing query and planning report structure...",
            }, "planning");

            const prompt = getOrchestratorPlanningPrompt(query);
            console.log(`[DeepResearch][Orchestrator] Planning prompt length: ${prompt.length} chars`);

            const result = await callOpenRouter({
                model: AGENT_MODELS.orchestrator,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 2048,
                response_format: { type: "json_object" },
            });

            console.log(`[DeepResearch][Orchestrator] Raw LLM response (first 500 chars):`, result.content?.substring(0, 500));
            console.log(`[DeepResearch][Orchestrator] Model used: ${result.model}`);
            console.log(`[DeepResearch][Orchestrator] Token usage:`, result.usage);

            const plan = extractJson<ReportPlan>(result.content);

            if (!plan || !plan.sections || plan.sections.length === 0) {
                console.error(`[DeepResearch][Orchestrator] Failed to parse plan. Raw content:`, result.content);
                throw new Error("Failed to generate report plan");
            }

            console.log(`[DeepResearch][Orchestrator] Plan parsed successfully:`);
            console.log(`[DeepResearch][Orchestrator]   Title: "${plan.title}"`);
            console.log(`[DeepResearch][Orchestrator]   Sections: ${plan.sections.length}`);
            plan.sections.forEach((s, i) => {
                console.log(`[DeepResearch][Orchestrator]   Section ${i+1}: "${s.heading}" (${s.search_queries.length} queries)`);
                s.search_queries.forEach(q => console.log(`[DeepResearch][Orchestrator]     - Query: "${q}"`));
            });

            await updateSession(sessionId, {
                report_plan: plan,
            });

            await appendActivityLog(sessionId, {
                agent: "orchestrator",
                action: "plan_created",
                detail: `Report plan created: "${plan.title}" with ${plan.sections.length} sections`,
            });

            return plan;
        });

        // Step 2: Spawn sub-agents for parallel section research
        const sectionFindings = await step.run("research-all-sections", async () => {
            await appendActivityLog(sessionId, {
                agent: "orchestrator",
                action: "research_started",
                detail: `Spawning ${reportPlan.sections.length} research sub-agents...`,
            }, "researching");

            const results: SectionFindings[] = [];

            // Research each section in parallel
            const researchPromises = reportPlan.sections.map(async (section) => {
                await appendActivityLog(sessionId, {
                    agent: "sub-agent",
                    action: "section_research_started",
                    detail: `Researching: ${section.heading}`,
                    section_id: section.id,
                });

                try {
                    const findings = await researchSection(section, sessionId);

                    await appendActivityLog(sessionId, {
                        agent: "sub-agent",
                        action: "section_research_completed",
                        detail: `Completed: ${section.heading} (${findings.key_findings.length} findings, ${findings.sources.length} sources)`,
                        section_id: section.id,
                    });

                    return findings;
                } catch (error) {
                    console.error(`Sub-agent failed for section ${section.id}:`, error);

                    await appendActivityLog(sessionId, {
                        agent: "sub-agent",
                        action: "section_research_failed",
                        detail: `Failed: ${section.heading} — ${error instanceof Error ? error.message : "Unknown error"}`,
                        section_id: section.id,
                    });

                    // Return partial findings on failure so the report isn't blocked
                    return {
                        section_id: section.id,
                        section_heading: section.heading,
                        key_findings: [],
                        detailed_content: `Research for this section could not be completed.`,
                        sources: [],
                    } as SectionFindings;
                }
            });

            const allResults = await Promise.all(researchPromises);
            results.push(...allResults);

            console.log(`[DeepResearch][Orchestrator] All sub-agents completed. Results summary:`);
            results.forEach(r => {
                console.log(`[DeepResearch][Orchestrator]   ${r.section_id}: ${r.key_findings.length} findings, ${r.sources.length} sources, content: ${r.detailed_content?.length || 0} chars`);
            });

            // Save all section findings
            await updateSession(sessionId, {
                section_findings: results,
            });

            return results;
        });

        // Step 3: Citation processing
        const citationResult = await step.run("process-citations", async () => {
            await appendActivityLog(sessionId, {
                agent: "citation-agent",
                action: "citation_processing_started",
                detail: "Deduplicating and indexing all sources...",
            });

            const result = await processCitations(sectionFindings, sessionId);

            console.log(`[DeepResearch][Citations] Processed ${result.citations.length} unique citations`);
            result.citations.forEach(c => console.log(`[DeepResearch][Citations]   [${c.index}] ${c.title} — ${c.url}`));

            await appendActivityLog(sessionId, {
                agent: "citation-agent",
                action: "citation_processing_completed",
                detail: `Processed ${result.citations.length} unique sources`,
            });

            return result;
        });

        // Step 4: Synthesize final report
        const finalReport = await step.run("synthesize-report", async () => {
            await appendActivityLog(sessionId, {
                agent: "synthesis-agent",
                action: "synthesis_started",
                detail: "Compiling findings into comprehensive research report...",
            }, "synthesizing");

            const report = await synthesizeReport(
                reportPlan,
                sectionFindings,
                citationResult,
                sessionId
            );

            const wordCount = report.split(/\s+/).length;
            console.log(`[DeepResearch][Synthesis] Report generated: ${wordCount} words, ${report.length} chars`);
            console.log(`[DeepResearch][Synthesis] Report preview (first 300 chars):`, report.substring(0, 300));

            await appendActivityLog(sessionId, {
                agent: "synthesis-agent",
                action: "synthesis_completed",
                detail: `Report synthesized (${wordCount} words)`,
            });

            return report;
        });

        // Step 5: Quality review
        const reviewResult = await step.run("review-report", async () => {
            await appendActivityLog(sessionId, {
                agent: "review-agent",
                action: "review_started",
                detail: "Performing quality review of the research report...",
            }, "reviewing");

            const review = await reviewReport(finalReport, query, sessionId);

            console.log(`[DeepResearch][Review] Result:`, JSON.stringify(review, null, 2));

            await appendActivityLog(sessionId, {
                agent: "review-agent",
                action: "review_completed",
                detail: `Quality: ${review.overall_quality} | Approved: ${review.approved} | Gaps: ${review.gaps.length}`,
            });

            return review;
        });

        // Step 6: Handle review result — iterate or finalize
        await step.run("finalize-session", async () => {
            const { data: session } = await supabase
                .from("deep_research_sessions")
                .select("iteration_count")
                .eq("id", sessionId)
                .single();

            const currentIteration = session?.iteration_count || 0;

            if (!reviewResult.approved && currentIteration < MAX_ITERATIONS - 1) {
                // Mark for another iteration (Phase 2 only supports logging this)
                await updateSession(sessionId, {
                    iteration_count: currentIteration + 1,
                    final_report: finalReport,
                    status: "completed",
                });

                await appendActivityLog(sessionId, {
                    agent: "orchestrator",
                    action: "iteration_note",
                    detail: `Review identified ${reviewResult.gaps.length} gaps but proceeding with current report. Iteration ${currentIteration + 1}/${MAX_ITERATIONS}`,
                });
            } else {
                // Finalize
                await updateSession(sessionId, {
                    final_report: finalReport,
                    status: "completed",
                    iteration_count: currentIteration + 1,
                });

                await appendActivityLog(sessionId, {
                    agent: "orchestrator",
                    action: "research_completed",
                    detail: "Deep research completed successfully",
                }, "completed");
            }
        });

        console.log(`[DeepResearch] ====== SESSION COMPLETE ======`);
        console.log(`[DeepResearch] Session ID: ${sessionId}`);

        return {
            success: true,
            sessionId,
            message: "Deep research pipeline completed",
        };
    }
);
