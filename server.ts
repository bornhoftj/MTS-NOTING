import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import cors from "cors";

// Extract system instruction from the old client service
const BASE_INSTRUCTION = `You are an expert logistics coordinator for MTS Moving and Storage. Your job is to filter out "Standard Service" fluff and record ONLY operational exceptions, specific customer agreements, and precise details with absolute accuracy.

**HIGH-VALUE ACCURACY & DETAIL DIRECTIVE (CRITICAL):**
- These moves are worth $10,000 to $20,000. Errors, generalizations, or missing details in the Operational Briefing or Checklist will cause massive logistical failures and severe financial loss.
- Be extremely accurate and faithful to the actual agreements and discussions.
- Do not make assumptions, guess, or generalize. Record the exact details discussed, such as exact sizes, exact promises, exact counts, and specific constraints.

**MANDATORY RETRACTION & COURSE-CORRECTION DIRECTIVE (THE "TOOK BACK" RULE - CRITICAL):**
- Customers and sales representatives frequently brainstorm, mention preliminary thoughts, or propose items/services that are subsequently retracted, cancelled, declined, or revised later in the call or across subsequent calls.
- YOU MUST NEVER RECORD AN ITEM, SERVICE, SURCHARGE, OR ACCESS CONDITION THAT WAS RETRACTED, DECLINED, OR CANCELLED!
- When a customer says:
  * "Actually, never mind...", "We decided not to bring that...", "We sold it / gave it away / left it behind..."
  * "My daughter/friend took the piano..." -> Piano: NO. (Do NOT list piano in the briefing or checklist!)
  * "No reassembly, $150 is too much, I have tools..." -> Reassembly: NO.
  * "We thought we needed 2 months of storage, but our new house is ready..." -> Storage: NO.
  * "We have 3 flights of stairs... wait, the building approved the elevator!" -> Elevator: YES, Stairs: NO.
  * "We originally thought 6,000 lbs, but we downsized to 4,000 lbs..." -> Weight: 4K (Ignore the 6,000 lbs).
- YOUR OUTPUT (Operational Briefing, Action Items, Checklist, and Calendar details) MUST STRICTLY REFLECT THE FINAL TRUE OPERATIONAL REALITY. Discarded proposals, retracted items, and declined services must be completely excluded from the operational checklist and briefing!

**COMPLETE INFORMATION RETENTION & ACCURACY DIRECTIVE:**
- Do NOT lose, omit, or overlook any confirmed information from the calls and documents.
- Keep all confirmed items:
  * Every confirmed disassembly item (e.g., King bed, dining table, bunk beds).
  * Every fragile item (glass tops, marble, mirrors, granite).
  * Every promised supply or discount (with "APPROVED BY MATHIEU").
  * All access details (parking constraints, loading dock times, elevator reservation windows).
  * Exact pickup and delivery windows.

**CHRONOLOGICAL OVERRIDE LOGIC (CRITICAL):**
- You are provided with multiple files representing consecutive phone calls or documents. Each file's content is preceded by its file name (e.g., "June 15th Call.mp3", "June 17th.txt").
- Analyze the dates or sequence indicators in the file names to understand their chronological order.
- **Strictly apply Chronological Override Logic:** Any agreements, instructions, dates, addresses, or requests discussed in a LATER call/document supersede and completely override any contradictory information from an EARLIER call/document. (For example: if a customer initially discusses a pickup on June 15th, but on a subsequent call on June 17th they agree to change it to June 19th, the final move date and checklist pickup date MUST be recorded as June 19th).
- Your final output (Operational Briefing, Action Items, Checklist, etc.) must reflect only the LATEST, final agreed-upon state.
- In the **Call Log** section, chronologically document the progression of each call clearly from Jacob's perspective (e.g. Call 1: Spoke with customer..., Call 2: Customer called back to change the pickup date from June 15th to June 19th... etc.), but ensure that all other sections (Checklist, Operational Briefing, Calendar details) represent the final, updated state from the latest call.

**THE STANDARD FILTER (DO NOT WRITE THESE):**
The following are ALREADY INCLUDED in the standard quote. Do NOT mention them in the notes unless there is a critical issue:
- Inventory listing, tagging, number coding.
- Blanket wrapping of **WOOD** and **METAL** furniture.
- Loading/Unloading, Room-to-room placement.
- Weight tickets, Fuel surcharge, Weight videos.
- Standard Liability ($1.50/lb) and Deductibles.
- 4 weeks storage included.

**DISASSEMBLY VS. REASSEMBLY DIRECTIVE (CRITICAL):**
- In the Checklist and notes, Disassembly and Reassembly MUST ALWAYS be noted as TWO SEPARATE, DISTINCT POINTS (never combine them into a single line).
- **DISASSEMBLY**: Clearly note whether disassembly is needed and list the items (e.g., "Disassembly: YES, BED FRAMES, DINING TABLES, ETC" or "Disassembly: NO").
- **REASSEMBLY**: Clearly note on its own separate line (e.g., "Reassembly: NO" or "Reassembly: YES, [details]").
- **CRITICAL RULE ON REASSEMBLY (ALMOST ALWAYS NO):** Reassembly is almost ALWAYS "NO" because MTS charges $150 per item for reassembly.
- **REASSEMBLY IS ONLY "YES" IF:**
  1) Jacob explicitly mentions and confirms in the recording/discussion that reassembly is included for the client, OR
  2) The customer booked a genuine FULL PACK service, AND Jacob explicitly verified and mentioned that we will reassemble for them and that it is necessary.
  - If neither condition is explicitly confirmed by Jacob, Reassembly MUST be recorded as "NO".

**THE OPERATIONAL TRIGGERS (WRITE THESE):**
1. **Glass & Fragile (CRITICAL):** Standard wrapping only covers Wood/Metal. You MUST note if **Glass**, **Marble**, **Stone**, or **Mirrors** are discussed.
   - *Example:* "Fragile: Glass table top requires crating."
   - *Example:* "Promise: Rep offered free packing labor for china cabinet."
2. **Complex Items (Excluded from Basic):** Note if items are **Hydraulic beds**, **Bunk beds**, **Upholstered beds**, **Pianos**, **Safes**, **Gym Equipment**, or **Pool Tables**.
3. **Access & SurchargES:** Note **Stairs**, **Long Carry (>75ft)**, **Elevator restrictions**, or **Shuttle** requirements.
4. **Sales Promises:** If the Rep waives a fee, makes a specific deal (e.g., "Waived stair fee", "Free bubble wrap"), or promises any discounts or "free packing material", record it with a **Promise:** tag. IMPORTANT: If any discount or "free packing material" is promised, you MUST append the exact note "APPROVED BY MATHIEU" to that promise or checklist entry.
5. **Dispatcher, Mover & Customer Service Operational Notes:** Note essential operational details that the Dispatcher, Movers, and Customer Service Manager must know:
   - **Dispatcher:** Truck parking/access constraints, shuttle/tight street restrictions, loading dock/elevator booking times, delivery windows, and storage/staging requirements.
   - **Movers (Crew):** Heavy/fragile/specialty items requiring specialized equipment or crating, customer packing status/preparedness, stair/carry complexities, and disassembly/assembly needs.
   - **Customer Service Manager:** Customer communication preferences, primary and move-day contact numbers, strict timeline constraints/deadlines, and specific customer service expectations.
   - **CRITICAL:** Do NOT assess or mention "cancellation risk", likelihood of cancellation, or retention follow-up advice.

**DELIVERY WINDOW LOGIC (CRITICAL):**
You must determine the "D/L" (Delivery) entry based on this logic:
1. **Specific/Promised:** If a specific date or window was discussed/promised, write that.
2. **Flexible:** If the customer stated they are flexible, write "Flexible".
3. **Not Discussed (Default Rules):**
   - If the move is **Between AB and BC** (Origin/Dest is AB/BC): Write "2-7 days (Standard)".
   - If the move involves **Ontario (ON)** (Origin is ON or Destination is ON): Write "1-3 weeks (Standard)".
   - Otherwise: Write "Standard Window".

**Output Format:**
Return a SINGLE Markdown document. 
IMPORTANT: Do NOT use asterisks (*) or markdown bolding (**). That looks ugly in the system. 
Use '## ' for section headers.
ALL text in the Operational Briefing MUST be UPPERCASE and extremely concise. Do NOT use prefixes like "Logistics:", "Access:", or "Promise:".
For the Checklist, do NOT include any parenthesis in the note outcome. Instead of putting N/A, put NO. If the answer is YES or MAYBE, you MUST provide additional details explaining why. For example: Long carry: NO, Storage: YES, Customer requires 2 additional weeks of storage, Disassembly: YES, BED FRAMES, DINING TABLES, ETC, Reassembly: NO. IMPORTANT: If any discount or "free packing material" is promised, you MUST explicitly include the note "APPROVED BY MATHIEU" in the checklist (specifically under the "Promises" or "Packing Material" field).

## Operational Briefing
PU [MONTH] [DAY] (BACKUP [DAY])
DL [Apply Delivery Window Logic above, e.g., 1-3W]

- [CONCISE BULLET POINT OF EXCEPTION/WARNING/SPECIALTY ITEM]
- [CONCISE BULLET POINT 2]
- [e.g., BASEMENT LOAD OUT]
- [e.g., CUSTOMER WANTS TO GO TO THE SCALE]
- [e.g., FREE MATTRESS COVER & FREE SOFA COVER]
- [If none, write STANDARD RESIDENTIAL MOVE]

## Action Items
- [Tasks for office/crew.]
- [e.g., - Send COI to building.]

## Checklist
- PU [MONTH] [DAY] (BACKUP [DAY])
- DL [Apply Delivery Window Logic above, e.g., 2-7 DAYS (STANDARD)]
- Date restrictions: [Value]
- Elevator: [Value]
- Storage: [Value]
- Disassembly: [NO, YES, or MAYBE - e.g. YES, BED FRAMES, DINING TABLES, ETC]
- Reassembly: [NO, YES, or MAYBE - Note: Almost always NO ($150/item charge) unless Jacob explicitly confirmed/mentioned it or verified for a genuine full pack service where reassembly was explicitly confirmed and necessary]
- Packing Material: [Value]
- Fragile Items: [Value]
- Long carry: [NO, YES, or MAYBE]
- Shuttle fee: [NO, YES, or MAYBE]
- More than one flight of stairs: [NO, YES, or MAYBE]
- Pictures of goods: [NO, YES, or MAYBE]
- Special Instructions: [Value]
- Promises: [Value]
- Notes: [Essential operational details for dispatchers, movers, and customer service managers (truck access & parking constraints, loading dock/elevator booking times, crew equipment needs for heavy/fragile items, packing readiness, move-day contact numbers, customer timeline/deadlines, and special customer agreements). Do NOT include cancellation risks or cancellation follow-up advice.]

## Call Summary
[1 sentence TL;DR.]

## Call Log
- **Call 1:** [Bullet point summarizing key events and conversations. Written concisely in first-person from Jacob's perspective (e.g. "Spoke with [name] regarding..."). Do not write long paragraphs.]
- **Call 2:** [Next call details...]

## Sentiment Analysis
[Positive/Neutral/Negative - Reason]

## CALENDAR TITLE DETAILS
- Customer First Name: [Name or (N/A)]
- Estimated Weight: [e.g., 2.5K or 1500 lbs. Use 'K' for thousands.]
- Pickup Location: [City, 2-letter PROV Abbrev or (N/A). e.g. BRAMPTON, ON]
- Delivery Location: [City, 2-letter PROV Abbrev or (N/A). e.g. EDMONTON, AB]
- Tentative Move Date: [YYYY-MM-DD. The latest discussed move date. Assume current year is 2026. Infer year if missing. If no date found, write (N/A).]
## CALENDAR TITLE DETAILS END
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '200mb' }));

  function getAI(): GoogleGenAI {
    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI_API_KEY")) {
      try {
        const secretPath = path.resolve(process.cwd(), ".env.secret");
        if (fs.existsSync(secretPath)) {
          const secretContent = fs.readFileSync(secretPath, "utf8");
          const match = secretContent.match(/GEMINI_API_KEY=([^\s\r\n]+)/);
          if (match && match[1]) {
            apiKey = match[1].trim();
          }
        }
      } catch (err) {
        console.warn("Could not read .env.secret:", err);
      }
    }

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("Invalid or unconfigured Gemini API Key.");
    }

    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // Helper to wrap any promise with a specific timeout
  function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${operationName} request timed out after ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  function cleanErrorMessage(err: any): string {
    if (!err) return "The AI was unable to generate notes. Please try again.";
    let msg = typeof err === "string" ? err : (err.message || String(err));
    try {
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      }
    } catch {
      // Keep original
    }
    const lower = msg.toLowerCase();
    if (lower.includes("503") || lower.includes("high demand") || lower.includes("unavailable") || lower.includes("overloaded")) {
      return "The AI service is currently experiencing high demand. Please try again in a few moments.";
    }
    if (lower.includes("rate limit") || lower.includes("429") || lower.includes("resource exhausted") || lower.includes("quota")) {
      return "AI rate limit reached. Please wait a moment and try again.";
    }
    if (lower.includes("timed out") || lower.includes("timeout")) {
      return "The AI processing timed out. Please try with shorter recordings or documents.";
    }
    if (lower.includes("api key") || lower.includes("api_key")) {
      return "Invalid or unconfigured Gemini API Key.";
    }
    return msg;
  }

  // Helper for resilient execution with model fallback & exponential backoff during high demand (503 / 429)
  async function generateWithFlashFallback(
    generateOptions: { parts: any[]; systemInstruction: string }
  ): Promise<any> {
    const ai = getAI();

    const hasAudio = generateOptions.parts.some(
      (p: any) => p?.inlineData?.mimeType?.startsWith("audio/")
    );

    // Multi-tier model pool in priority order:
    // 1. gemini-3.6-flash (Top-tier reasoning & accuracy, tested online)
    // 2. gemini-3.5-flash (High-tier reasoning & multimodal audio capable)
    // 3. gemini-3.8-flash (High-tier reasoning)
    // 4. gemini-3.5-flash-lite (Fast fallback)
    // 5. gemini-3.1-flash-lite (Audio capable fallback)
    // 6. gemini-3-flash-preview (Text/docs fallback)
    const modelPool: Array<{ name: string; timeoutMs: number; requiresNoAudio?: boolean; config?: Record<string, any> }> = [
      {
        name: "gemini-3.6-flash",
        timeoutMs: 35000,
      },
      {
        name: "gemini-3.5-flash",
        timeoutMs: 30000,
      },
      {
        name: "gemini-3.8-flash",
        timeoutMs: 30000,
      },
      {
        name: "gemini-3.5-flash-lite",
        timeoutMs: 20000,
      },
      {
        name: "gemini-3.1-flash-lite",
        timeoutMs: 55000,
      },
      {
        name: "gemini-3-flash-preview",
        timeoutMs: 25000,
        requiresNoAudio: true,
      },
    ];

    let lastError: any = null;
    const maxRounds = 2;
    const permanentlyFailed = new Set<string>();

    for (let round = 1; round <= maxRounds; round++) {
      for (const modelEntry of modelPool) {
        const modelName = modelEntry.name;

        if (permanentlyFailed.has(modelName)) {
          continue;
        }

        if (hasAudio && modelEntry.requiresNoAudio) {
          continue;
        }

        try {
          console.log(`[Gemini API] Requesting ${modelName} (Round ${round}/${maxRounds}, timeout: ${modelEntry.timeoutMs / 1000}s, audio: ${hasAudio})...`);
          
          const modelConfig: Record<string, any> = {
            systemInstruction: generateOptions.systemInstruction,
            ...(modelEntry.config || {}),
          };

          const generatePromise = ai.models.generateContent({
            model: modelName,
            contents: { parts: generateOptions.parts },
            config: modelConfig,
          });

          const response = await withTimeout(generatePromise, modelEntry.timeoutMs, modelName);
          console.log(`[Gemini API] Successfully generated response using model: ${modelName}`);
          return response;
        } catch (error: any) {
          lastError = error;
          const msg = (error?.message || "").toLowerCase();
          const status = error?.status || error?.statusCode;

          // If daily quota exhausted or permanently unavailable, do not retry in round 2
          if (msg.includes("quota exceeded") || msg.includes("daily") || msg.includes("free_tier_requests") || status === 404 || status === 400 || msg.includes("invalid argument") || msg.includes("not found")) {
            console.warn(`[Gemini API] Model ${modelName} permanently unavailable for this request (${status || msg.substring(0, 80)}). Skipping.`);
            permanentlyFailed.add(modelName);
            continue;
          }

          const isRetryable =
            status === 503 ||
            status === 429 ||
            status === 500 ||
            msg.includes("503") ||
            msg.includes("high demand") ||
            msg.includes("resource exhausted") ||
            msg.includes("overloaded") ||
            msg.includes("unavailable") ||
            msg.includes("rate limit") ||
            msg.includes("timed out") ||
            msg.includes("timeout") ||
            msg.includes("fetch failed");

          if (!isRetryable) {
            console.error(`[Gemini API] Non-retryable error on ${modelName}:`, error);
            throw error;
          }

          console.warn(`[Gemini API] ${modelName} transient issue (${status || msg.substring(0, 60)}). Falling over to next model...`);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // If all models failed during round 1, short wait before round 2
      if (round < maxRounds) {
        console.warn(`[Gemini API] Round ${round} completed. Waiting 1000ms before round ${round + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw lastError || new Error("All Gemini model tiers are experiencing high demand right now. Please try again in a few moments.");
  }

  app.post("/api/generate-notes", async (req, res) => {
    try {
      try {
        getAI();
      } catch (e: any) {
        return res.status(500).json({ error: e.message || "Invalid or unconfigured Gemini API Key." });
      }

      const { parts, fileNames } = req.body;
      
      const fileListStr = fileNames && Array.isArray(fileNames) ? fileNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n') : '';
      const userPrompt = `You are analyzing discussion files for MTS Moving and Storage.
The files are provided in chronological sequence of occurrence:
${fileListStr}

Please read and analyze each of these files in sequence.
Remember:
- CRITICAL "TOOK BACK" RULE: If a customer or representative mentions an item, service, access issue, or preliminary idea, but subsequently takes it back, cancels it, declines it, or changes their mind (e.g. "actually never mind on the piano", "no reassembly, $150 is too much", "our house is ready so no storage needed", "the building approved the elevator so zero stairs"), DO NOT include it as an active requirement in the Operational Briefing or Checklist! Your output must strictly reflect ONLY what is actually happening in the final confirmed operational reality.
- COMPLETE INFORMATION RETENTION: Do NOT omit or drop any confirmed agreements, dates, weights, disassembly items, fragile items, or approved promises. Retain all factual details with 100% precision.
- CHRONOLOGICAL OVERRIDE: A later call/file COMPLETELY overrides and supersedes any contradictory agreements, dates, prices, addresses, or instructions made in any earlier files/calls.
- Your final output (Operational Briefing, Action Items, Checklist, and Calendar details) must strictly reflect the final agreed-upon state from the latest chronological call/document.
- You must pay extreme attention to detail and be hyper-accurate.
- If any discounts or "free packing material" are promised in the files, you must add the exact note "APPROVED BY MATHIEU" in the checklist under Promises or Packing Material.
- Note clearly whether it is just disassembly or if reassembly is also included as TWO SEPARATE points in the Checklist (Disassembly: [Value] and Reassembly: [Value]). Remember Reassembly is almost always NO ($150/item charge) unless Jacob explicitly confirmed it or verified for a genuine full pack service where reassembly was explicitly confirmed and necessary.
- In the Checklist "Notes:" section, include only critical, relevant operational information for the dispatcher, moving crew, and customer service manager (access/parking details, crew equipment/handling needs, move-day contacts, and timeline constraints). Do NOT mention cancellation risks or cancellation follow-up recommendations.
`;

      // Start response immediately to prevent proxy timeouts
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Transfer-Encoding", "chunked");
      
      // Send a space character every 15 seconds to keep the connection alive
      const keepAliveInterval = setInterval(() => {
        res.write(" ");
      }, 15000);

      try {
        const fullParts = [...parts, { text: userPrompt }];

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out. Please try again.")), 240000);
        });

        // Generate notes using Flash with automatic model fallback & retry
        const generatePromise = generateWithFlashFallback({
          parts: fullParts,
          systemInstruction: BASE_INSTRUCTION,
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        clearInterval(keepAliveInterval);

        const generatedText = response.text;
        if (!generatedText || generatedText.trim() === "") {
          console.warn("Gemini API returned an empty text response for notes generation.");
          res.write(JSON.stringify({ error: "The AI was unable to generate notes." }));
          return res.end();
        }
        
        res.write(JSON.stringify({ result: generatedText }));
        res.end();
      } catch (innerError: any) {
        clearInterval(keepAliveInterval);
        console.error("Error inside generation:", innerError);
        const cleanMsg = cleanErrorMessage(innerError);
        res.write(JSON.stringify({ error: cleanMsg }));
        res.end();
      }
    } catch (error: any) {
      console.error("Error with Gemini API (Notes):", error);
      const cleanMsg = cleanErrorMessage(error);
      if (!res.headersSent) {
        res.status(500).json({ error: cleanMsg });
      } else {
        res.write(JSON.stringify({ error: cleanMsg }));
        res.end();
      }
    }
  });

  app.post("/api/generate-specific", async (req, res) => {
    try {
      try {
        getAI();
      } catch (e: any) {
        return res.status(500).json({ error: e.message || "Invalid or unconfigured Gemini API Key." });
      }

      const { parts, userQuery, fileNames } = req.body;
      
      const systemInstruction = `You are an expert AI assistant for MTS Moving and Storage. Answer the user's question with absolute accuracy based on the provided files.
IMPORTANT:
- A later call/file overrides any earlier call/file. Use chronological override logic if there are contradictions in different files.
- Be extremely accurate and detailed. Do not assume or generalize.`;
    
      const fileListStr = fileNames && Array.isArray(fileNames) ? fileNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n') : '';
      const userPrompt = `User's Question: "${userQuery}"

The files analyzed (in chronological order):
${fileListStr}

Provide your answer based on the file analysis, taking into account the chronological order and override rules:`;
      
      // Start response immediately to prevent proxy timeouts
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Transfer-Encoding", "chunked");
      
      // Send a space character every 15 seconds to keep the connection alive
      const keepAliveInterval = setInterval(() => {
        res.write(" ");
      }, 15000);

      try {
        const fullParts = [...parts, { text: userPrompt }];

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out. Please try again.")), 240000);
        });

        const generatePromise = generateWithFlashFallback({
          parts: fullParts,
          systemInstruction,
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        clearInterval(keepAliveInterval);

        const generatedText = response.text;
        if (!generatedText || generatedText.trim() === "") {
          res.write(JSON.stringify({ result: "The requested information was not found in the files." }));
          return res.end();
        }
        
        res.write(JSON.stringify({ result: generatedText }));
        res.end();
      } catch (innerError: any) {
        clearInterval(keepAliveInterval);
        console.error("Error inside specific generation:", innerError);
        const cleanMsg = cleanErrorMessage(innerError);
        res.write(JSON.stringify({ error: cleanMsg }));
        res.end();
      }
    } catch (error: any) {
      console.error("Error with Gemini API (Specific Info):", error);
      const cleanMsg = cleanErrorMessage(error);
      if (!res.headersSent) {
        res.status(500).json({ error: cleanMsg });
      } else {
        res.write(JSON.stringify({ error: cleanMsg }));
        res.end();
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 5.x
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
    console.error("Failed to start server", err);
});
