import { env } from '@/lib/env';

// Azure AI Foundry deployment names (not raw OpenAI model IDs).
export const DEFAULT_LANGUAGE_MODEL = env.get('AZURE_GPT41_MINI_DEPLOYMENT')!;
export const ADVANCED_LANGUAGE_MODEL = env.get('AZURE_GPT41_DEPLOYMENT')!;
