import { apiBaseUrl } from '@/data/market-api';

export type AiChatMessage = { role: 'user' | 'assistant'; content: string };

export async function sendAiChatMessage(args: {
  accessToken: string;
  walletAddress: string;
  messages: AiChatMessage[];
}): Promise<string> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error('AI chat server URL is not configured.');
  if (!/^0x[a-fA-F0-9]{40}$/.test(args.walletAddress)) {
    throw new Error('Your BNB Chain wallet is not ready yet.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(`${baseUrl}/api/binance/ai/chat`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: args.walletAddress,
        messages: args.messages.slice(-12),
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as { message?: unknown; error?: unknown } | null;
    if (!response.ok) {
      throw new Error(typeof payload?.error === 'string' ? payload.error : `AI assistant unavailable (${response.status}).`);
    }
    if (typeof payload?.message !== 'string' || !payload.message.trim()) {
      throw new Error('AI assistant returned an invalid response.');
    }
    return payload.message.trim();
  } finally {
    clearTimeout(timeout);
  }
}
