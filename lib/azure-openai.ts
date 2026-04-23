import { AzureOpenAI } from 'openai';
import { env } from '@/lib/env';

let client: AzureOpenAI | null = null;

export function getAzureOpenAI(): AzureOpenAI {
  if (client) return client;
  client = new AzureOpenAI({
    endpoint: env.get('AZURE_FOUNDRY_ENDPOINT')!,
    apiKey: env.get('AZURE_FOUNDRY_API_KEY')!,
    apiVersion: env.get('AZURE_OPENAI_API_VERSION')!,
  });
  return client;
}

export const AZURE_DEPLOYMENTS = {
  gpt41Mini: () => env.get('AZURE_GPT41_MINI_DEPLOYMENT')!,
  gpt41: () => env.get('AZURE_GPT41_DEPLOYMENT')!,
  deepseekR1: () => env.get('AZURE_DEEPSEEK_R1_DEPLOYMENT')!,
  deepseekV3: () => env.get('AZURE_DEEPSEEK_V3_DEPLOYMENT')!,
} as const;
