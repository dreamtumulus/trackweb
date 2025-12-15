import { GoogleGenAI } from "@google/genai";
import { Source, SourceType, CrawlResult } from "../types";

/**
 * Simulates a "Crawl" by using Google Search Grounding to find recent updates.
 * This bypasses CORS issues and parses content intelligently.
 */
export const crawlSource = async (source: Source, apiKey: string): Promise<CrawlResult[]> => {
  if (!apiKey) {
    throw new Error("请先在设置中配置 Gemini API Key");
  }

  // Initialize Gemini Client dynamically with the provided key
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const modelId = "gemini-2.5-flash"; // Efficient for text processing

  let prompt = "";
  if (source.type === SourceType.FACEBOOK) {
    prompt = `Search for the latest public posts or news updates from the Facebook page "${source.name}" (${source.url}). 
    Find the most recent significant update from the last 24 hours.
    Summarize the content in Simplified Chinese (简体中文). 
    If the content is already in Chinese, just summarize it.
    Start your response with a clear title line, followed by the summary.`;
  } else {
    prompt = `Search for the latest headlines or news articles from the website "${source.name}" (${source.url}).
    Find the most significant update from the last 24 hours.
    Summarize the content in Simplified Chinese (简体中文).
    If the content is already in Chinese, just summarize it.
    Start your response with a clear title line, followed by the summary.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3, // Keep it factual
      },
    });

    const text = response.text || "未找到相关内容。";
    
    // Extract grounding URLs
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let sourceLink = source.url;
    
    // Find the first valid external link that isn't the search engine itself
    const relevantChunk = chunks.find(c => c.web?.uri && !c.web.uri.includes('google.com'));
    if (relevantChunk?.web?.uri) {
      sourceLink = relevantChunk.web.uri;
    }

    // Simple parsing of the response text (assuming Title \n Summary format requested)
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const title = lines.length > 0 ? lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, '') : "检测到新动态";
    const summary = lines.slice(1).join('\n').trim();

    const result: CrawlResult = {
      id: crypto.randomUUID(),
      sourceId: source.id,
      sourceName: source.name,
      title: title,
      summary: summary || text, // Fallback if parsing fails
      originalUrl: sourceLink,
      timestamp: Date.now(),
      isRead: false,
    };

    return [result];

  } catch (error) {
    console.error("Crawling failed:", error);
    throw new Error(error instanceof Error ? error.message : "爬取过程中发生未知错误");
  }
};