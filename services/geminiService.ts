import { GoogleGenAI } from "@google/genai";
import { Source, SourceType, CrawlResult, ApiKeys } from "../types";

// --- Helper: Construct Prompts ---
const getPrompt = (source: Source) => {
  const context = source.type === SourceType.FACEBOOK ? "Facebook page" : "website";
  return `Search for the latest public posts or news updates from the ${context} "${source.name}" (${source.url}). 
    Find the most recent significant update from the last 24 hours.
    Summarize the content in Simplified Chinese (简体中文). 
    If the content is already in Chinese, just summarize it.
    Start your response with a clear title line, followed by the summary.`;
};

/**
 * Strategy 1: Google Gemini (All-in-One)
 * Uses built-in Google Search Grounding.
 */
const crawlWithGemini = async (source: Source, key: string): Promise<CrawlResult> => {
  const ai = new GoogleGenAI({ apiKey: key });
  const modelId = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: getPrompt(source),
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.3,
    },
  });

  const text = response.text || "未找到相关内容。";
  
  // Extract grounding URLs
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  let sourceLink = source.url;
  
  const relevantChunk = chunks.find(c => c.web?.uri && !c.web.uri.includes('google.com'));
  if (relevantChunk?.web?.uri) {
    sourceLink = relevantChunk.web.uri;
  }

  return parseResult(text, sourceLink, source);
};

/**
 * Strategy 2: Tavily Search (Search Engine)
 * Can be used alone or with OpenRouter.
 */
const searchWithTavily = async (source: Source, key: string) => {
  const query = `latest news or updates from ${source.url} ${source.name} current date`;
  
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: key,
      query: query,
      search_depth: "basic",
      include_answer: true,
      topic: "news",
      max_results: 3
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API Error: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Strategy 3: OpenRouter (LLM)
 * Used to summarize content found by Tavily.
 */
const summarizeWithOpenRouter = async (content: string, key: string): Promise<string> => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      // "HTTP-Referer": window.location.href, // Optional
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001", // Default to a reliable model on OR
      messages: [
        {
          role: "system",
          content: "You are a news summarizer. Output in Simplified Chinese (简体中文). Format: First line is Title, followed by Summary."
        },
        {
          role: "user",
          content: `Summarize this search result:\n\n${content}`
        }
      ]
    })
  });

  if (!response.ok) {
    // If OpenRouter fails, just return the raw content
    console.error("OpenRouter Error", await response.text());
    return content;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || content;
};

// --- Helper: Result Parser ---
const parseResult = (text: string, link: string, source: Source): CrawlResult => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const title = lines.length > 0 ? lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, '') : "检测到新动态";
  const summary = lines.slice(1).join('\n').trim();

  return {
    id: crypto.randomUUID(),
    sourceId: source.id,
    sourceName: source.name,
    title: title,
    summary: summary || text,
    originalUrl: link,
    timestamp: Date.now(),
    isRead: false,
  };
};

/**
 * Main Crawler Function
 * Dispatches to the best available provider based on API keys.
 */
export const crawlSource = async (source: Source, apiKeys: ApiKeys): Promise<CrawlResult[]> => {
  try {
    // Priority 1: Gemini (Best All-in-One)
    if (apiKeys.gemini) {
      const result = await crawlWithGemini(source, apiKeys.gemini);
      return [result];
    }

    // Priority 2: Tavily (Search) + Optional OpenRouter (Summarize)
    if (apiKeys.tavily) {
      const searchData = await searchWithTavily(source, apiKeys.tavily);
      
      let finalSummary = searchData.answer || "No immediate summary available.";
      const rawContext = searchData.results?.map((r: any) => `Title: ${r.title}\nContent: ${r.content}\nURL: ${r.url}`).join('\n\n') || "";
      const primaryLink = searchData.results?.[0]?.url || source.url;

      // If OpenRouter is available, use it to make the summary better and in Chinese
      if (apiKeys.openrouter) {
        finalSummary = await summarizeWithOpenRouter(`Context:\n${rawContext}\n\nTavily Answer: ${searchData.answer}`, apiKeys.openrouter);
        return [parseResult(finalSummary, primaryLink, source)];
      }

      // If only Tavily, return its auto-generated answer (might be in English, depending on query)
      // We explicitly ask for Chinese in the prompt, but Tavily's native answer isn't always perfect.
      return [{
        id: crypto.randomUUID(),
        sourceId: source.id,
        sourceName: source.name,
        title: searchData.results?.[0]?.title || "最新动态 (Tavily)",
        summary: searchData.answer || rawContext.substring(0, 200) + "...",
        originalUrl: primaryLink,
        timestamp: Date.now(),
        isRead: false,
      }];
    }

    throw new Error("未配置有效的 API Key。请在设置中配置 Gemini 或 Tavily Key。");

  } catch (error) {
    console.error("Crawling failed:", error);
    throw new Error(error instanceof Error ? error.message : "爬取过程中发生未知错误");
  }
};
