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
  'copilot',
  'agent',
  'agents',
  'agentic',
  'automation',
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
  'claude',
  'claude 3',
  'anthropic',
  'openai',
  'deepseek',
  'gemini',
  'mistral',
  'llama',
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
  'llm',
  'gpt',
  'claude',
  'deepseek',
  'gemini',
  'rag',
  'diffusion model',
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
  'essay writing service',
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
    score += Math.min(10, strongMatches.length * 3);
    reasons.push(`${label} contains strong AI signals: ${strongMatches.slice(0, 4).join(', ')}`);
  }

  const regularMatches = POSITIVE_TERMS.filter((term) => hasWord(normalized, term));
  if (regularMatches.length > 0) {
    score += Math.min(8, regularMatches.length);
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
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/json')) {
      return { text: '', finalUrl: response.url || url, error: 'Homepage is not readable HTML/text' };
    }

    const html = await response.text();
    return {
      text: normalizeText(html.slice(0, 150000)).slice(0, 30000),
      finalUrl: response.url || url,
    };
  } catch (err: any) {
    return { text: '', finalUrl: url, error: err?.name === 'AbortError' ? 'Homepage verification timed out' : 'Homepage could not be reached' };
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

  if (/(^|[-.])(ai|gpt|llm|agent|bot|model|prompt|neuro|gen|neural)([-.]|$)/i.test(domain)) {
    score += 3;
    reasons.push('Domain name includes AI keyword');
  }

  // 3. User submitted text
  const submittedText = [input.name, input.tagline, input.description || '', input.xHandle || '', domain].join(' ');
  const submittedScore = scoreText(submittedText, 'Input details');
  score += submittedScore.score;
  reasons.push(...submittedScore.reasons);

  // 4. Real-time Homepage Scraper
  const homepage = await fetchHomepageText(safeUrl.normalizedUrl);
  if (homepage.text) {
    const homepageScore = scoreText(homepage.text, 'Homepage');
    score += homepageScore.score;
    reasons.push(...homepageScore.reasons);
  } else if (homepage.error) {
    // If scraper timed out or got bot blocked (e.g. Cloudflare on high-traffic sites), evaluate domain and name
    reasons.push(homepage.error);
    if (domain.includes('ai') || domain.includes('gpt') || domain.includes('bot') || input.name.toLowerCase().includes('ai')) {
      score += 3;
    }
  }

  const isAiProduct = score >= 3;
  const confidence = Math.max(0, Math.min(1, score / 10));

  return {
    isAiProduct,
    confidence,
    score,
    reasons: reasons.length > 0 ? reasons : [isAiProduct ? 'AI signals detected' : 'No clear AI signals found'],
    checkedUrl: homepage.finalUrl || safeUrl.normalizedUrl,
  };
}
