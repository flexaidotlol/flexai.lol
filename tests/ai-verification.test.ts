import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyAiProduct } from '../src/lib/ai-verification';

function mockHtmlResponse(html: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      status: 200,
      url: 'https://example.ai',
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => html,
    }))
  );
}

describe('AI product verification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('approves products with strong AI signals in submission and homepage', async () => {
    mockHtmlResponse(`
      <html>
        <title>AgentFlow AI</title>
        <meta name="description" content="AI agents for workflow automation">
        <body>Build autonomous AI agents powered by large language models and RAG.</body>
      </html>
    `);

    const result = await verifyAiProduct({
      name: 'AgentFlow AI',
      tagline: 'AI agents for operations teams',
      description: 'Automate workflows with LLM-powered assistants.',
      websiteUrl: 'https://agentflow.ai',
    });

    expect(result.isAiProduct).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.reasons.join(' ')).toContain('AI');
  });

  it('rejects products without meaningful AI signals', async () => {
    mockHtmlResponse(`
      <html>
        <title>Plain CRM</title>
        <body>Manage contacts, invoices, calendars, and sales pipelines for small teams.</body>
      </html>
    `);

    const result = await verifyAiProduct({
      name: 'Plain CRM',
      tagline: 'Simple contact management for teams',
      description: 'Track customers and invoices.',
      websiteUrl: 'https://plaincrm.com',
    });

    expect(result.isAiProduct).toBe(false);
    expect(result.confidence).toBeLessThan(0.5);
  });
});
