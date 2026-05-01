import { NextRequest, NextResponse } from "next/server";

/**
 * Query Planner API — Uses Gemini to decompose a user query into
 * 1–5 optimized Google search queries for parallel execution.
 */
export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        const plannerPrompt = `You are a search query planner. Given a user's question, generate optimized Google search queries that will best answer it.

Rules:
1. Generate between 1 and 5 search queries depending on complexity.
2. For simple factual questions (e.g. "what is the capital of France"), generate just 1 query.
3. For complex or multi-faceted questions (e.g. "compare React vs Vue for large enterprise apps"), generate 3-5 queries covering different angles.
4. Make queries specific — add relevant keywords, dates, or technical terms.
5. Avoid redundant queries that would return the same results.
6. Each query should target a different aspect or angle of the user's question.
7. Format queries as you would type them into Google — concise and keyword-focused.

User question: "${query.replace(/"/g, '\\"')}"

Respond with ONLY a JSON object in this exact format:
{"queries": ["query 1", "query 2", ...]}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: plannerPrompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 300,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!response.ok) {
            console.error("Gemini API error:", response.status, response.statusText);
            return NextResponse.json({ queries: [query] });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        try {
            const parsed = JSON.parse(text);
            // Validate and cap at 5 queries
            const queries = Array.isArray(parsed.queries)
                ? parsed.queries.filter((q: unknown) => typeof q === "string" && q.trim()).slice(0, 5)
                : [query];

            if (queries.length === 0) {
                return NextResponse.json({ queries: [query] });
            }

            return NextResponse.json({ queries });
        } catch {
            console.warn("Failed to parse query planner response:", text);
            return NextResponse.json({ queries: [query] });
        }
    } catch (error) {
        console.error("Query planner API error:", error);
        return NextResponse.json({ queries: [req.url] });
    }
}
