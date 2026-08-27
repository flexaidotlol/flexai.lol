import { validateSafeUrl } from './security';

export interface AiVerificationInput {
  name: string;
  tagline: string;
  description?: string;
  websiteUrl: string;
  xHandle?: string;
}

export interface AiVerificationResult {
  isAiProduct: boolean;
  confidence: number;
  score: number;
  reasons: string[];
  checkedUrl?: string;
}

// Known Leading AI Domains & Ecosystems
const KNOWN_AI_DOMAINS = new Set([
  'openai.com',
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'claude.com',
  'anthropic.com',
  'deepseek.com',
  'perplexity.ai',
  'midjourney.com',
  'cursor.com',
  'cursor.sh',
  'v0.dev',
  'v0.app',
  'mistral.ai',
  'huggingface.co',
  'elevenlabs.io',
  'cohere.com',
  'runwayml.com',
  'suno.ai',
  'klingai.com',
  'groq.com',
  'replicate.com',
  'ollama.com',
  'ollama.ai',
  'together.ai',
  'together.xyz',
  'scale.com',
  'character.ai',
  'poe.com',
  'leonardo.ai',
  'synthesia.io',
  'pika.art',
  'ideogram.ai',
  'replit.com',
  'lovable.dev',
  'bolt.new',
  'jasper.ai',
  'copy.ai',
  'stability.ai',
  'fal.ai',
  'fireworks.ai',
  'pinecone.io',
  'weaviate.io',
  'qdrant.tech',
  'langchain.com',
  'llamaindex.ai',
  'buildfast-ai.com',
  'buildfast.com',
]);

const POSITIVE_TERMS = [
  'ai',
  'artificial intelligence',
  'artificial general intelligence',
  'agi',
  'llm',
  'large language model',
  'machine learning',
  'deep learning',
  'generative',
  'genai',
  'generative ai',
  'chatbot',
  'chatgpt',
  'openai',
  'claude',
  'deepseek',
  'gemini',
  'mistral',
  'llama',
  'copilot',
  'agent',
  'agents',
  'agentic',
  'auto-pilot',
  'autopilot',
  'automation',
  'automated',
  'automate',
  'prompt',
  'prompts',
  'prompting',
  'rag',
  'vector',
  'embedding',
  'embeddings',
  'inference',
  'neural',
  'neural network',
  'model',
  'models',
  'gpt',
  'gpt-4',
  'gpt-4o',
  'gpt-3',
  'flux',
  'diffusion',
  'transformer',
  'assistant',
  'ai assistant',
  'ai tool',
  'ai software',
  'ai app',
  'ai platform',
  'ai agent',
  'ai engine',
  'ai writer',
  'ai generator',
  'text to image',
  'text to speech',
  'speech to text',
  'image generation',
  'video generation',
  'voice synthesis',
  'transcription',
  'summarization',
  'vision',
  'computer vision',
  'nlp',
  'natural language',
  'fine-tuning',
  'synthetic data',
  'seo',
  'content generator',
  'writer',
  'writing',
  'copywriting',
  'optimizer',
  'workflow',
  'bot',
  'bots',
  'saas',
  'software',
];

const STRONG_TERMS = [
  'artificial intelligence',
  'large language model',
  'machine learning',
  'generative ai',
  'ai agent',
  'ai assistant',
  'ai platform',
  'ai-powered',
  'powered by ai',
  'built with ai',
  'chatgpt',
  'openai',
  'claude',
  'deepseek',
  'gemini',
  'auto-pilot',
  'autopilot',
  'llm',
  'gpt',
  'rag',
  'diffusion model',
  'ai software',
  'ai tool',
];

const NEGATIVE_TERMS = [
  'casino',
  'sportsbook',
  'poker',
  'blackjack',
  'roulette',
  'slots',
  'gambling',
  'payday loan',
  'adult content',
  'pornography',
  'escort service',
  'essay writing service',
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMetaAndText(html: string): string {
  const metaContents: string[] = [];

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    metaContents.push(titleMatch[1]);
  }

  // Extract <meta name="description" content="..."> and <meta property="og:description" content="...">
  const metaRegex = /<meta\s+[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const prop = match[1].toLowerCase();
    const content = match[2];
    if (prop.includes('desc') || prop.includes('title') || prop.includes('keyword') || prop.includes('og:')) {
      metaContents.push(content);
    }
  }

  // Extract headings <h1>, <h2>, <h3>
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  while ((match = headingRegex.exec(html)) !== null) {
    metaContents.push(match[1]);
  }

  const cleanBody = normalizeText(html.slice(0, 150000)).slice(0, 30000);
  const cleanMeta = normalizeText(metaContents.join(' '));

  return `${cleanMeta} ${cleanBody}`;
}

function hasWord(text: string, term: string): boolean {
  if (term.includes(' ') || term.includes('-')) return text.includes(term);
  return new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(text);
}

function scoreText(text: string, label: string): { score: number; reasons: string[] } {
  const normalized = normalizeText(text);
  const reasons: string[] = [];
  let score = 0;

  const strongMatches = STRONG_TERMS.filter((term) => hasWord(normalized, term));
  if (strongMatches.length > 0) {
    score += Math.min(12, strongMatches.length * 3);
    reasons.push(`${label} contains strong AI signals: ${strongMatches.slice(0, 4).join(', ')}`);
  }

  const regularMatches = POSITIVE_TERMS.filter((term) => hasWord(normalized, term));
  if (regularMatches.length > 0) {
    score += Math.min(8, regularMatches.length * 1.5);
    reasons.push(`${label} contains AI-related terms: ${regularMatches.slice(0, 6).join(', ')}`);
  }

  const negativeMatches = NEGATIVE_TERMS.filter((term) => hasWord(normalized, term));
  if (negativeMatches.length > 0) {
    score -= negativeMatches.length * 5;
    reasons.push(`${label} contains blocked non-AI terms: ${negativeMatches.slice(0, 4).join(', ')}`);
  }

  return { score, reasons };
}

async function fetchHomepageText(url: string): Promise<{ text: string; finalUrl: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    const html = await response.text();
    const extracted = extractMetaAndText(html);
    return {
      text: extracted,
      finalUrl: response.url || url,
    };
  } catch (err: any) {
    // If https:// failed, attempt non-www or fallback
    return { text: '', finalUrl: url, error: err?.name === 'AbortError' ? 'Timeout reaching site' : 'Site could not be fetched directly' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyAiProduct(input: AiVerificationInput): Promise<AiVerificationResult> {
  const safeUrl = validateSafeUrl(input.websiteUrl);
  if (!safeUrl.isValid || !safeUrl.normalizedUrl) {
    return {
      isAiProduct: false,
      confidence: 0,
      score: 0,
      reasons: [safeUrl.error || 'Website URL is not safe to verify'],
    };
  }

  const parsed = new URL(safeUrl.normalizedUrl);
  const domain = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const reasons: string[] = [];
  let score = 0;

  // 1. Check Known AI Directory / Ecosystem
  if (KNOWN_AI_DOMAINS.has(domain) || Array.from(KNOWN_AI_DOMAINS).some((d) => domain.endsWith(`.${d}`))) {
    return {
      isAiProduct: true,
      confidence: 1,
      score: 20,
      reasons: [`Verified premier AI platform (${domain})`],
      checkedUrl: safeUrl.normalizedUrl,
    };
  }

  // 2. Domain heuristics (.ai TLD or 'ai' / 'gpt' in name)
  if (domain.endsWith('.ai')) {
    score += 4;
    reasons.push('Domain uses .ai TLD');
  }

  if (/(^|[-.])(ai|gpt|llm|agent|bot|model|prompt|neuro|gen|neural|auto|rank|outrank|seo|tool)([-.]|$)/i.test(domain)) {
    score += 3;
    reasons.push('Domain name includes AI/SaaS keyword');
  }

  // 3. User submitted text & inferred details
  const submittedText = [input.name, input.tagline, input.description || '', input.xHandle || '', domain].join(' ');
  const submittedScore = scoreText(submittedText, 'Input details');
  score += submittedScore.score;
  reasons.push(...submittedScore.reasons);

  // 4. Real-time Homepage Scraper with Meta Tag parsing
  const homepage = await fetchHomepageText(safeUrl.normalizedUrl);
  if (homepage.text) {
    const homepageScore = scoreText(homepage.text, 'Homepage');
    score += homepageScore.score;
    reasons.push(...homepageScore.reasons);
  } else if (homepage.error) {
    reasons.push(homepage.error);
    // If the scraper could not fetch (Cloudflare bot protection or SPA), give default credibility to valid tech domains (.so, .ai, .io, .dev, .app, .co, .com)
    if (domain.endsWith('.ai') || domain.endsWith('.so') || domain.endsWith('.io') || domain.endsWith('.dev') || domain.endsWith('.app')) {
      score += 2;
    }
  }

  // Passing threshold: 2+ points passes AI check
  const isAiProduct = score >= 2;
  const confidence = Math.max(0, Math.min(1, score / 6));

  return {
    isAiProduct,
    confidence,
    score,
    reasons: reasons.length > 0 ? reasons : [isAiProduct ? 'AI signals detected' : 'No clear AI signals found'],
    checkedUrl: homepage.finalUrl || safeUrl.normalizedUrl,
  };
}
