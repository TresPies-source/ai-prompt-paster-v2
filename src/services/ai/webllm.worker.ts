import * as webllm from '@mlc-ai/web-llm';
import { AI_CONFIG } from '@/config/constants';

interface WorkerMessage {
  type: 'initialize' | 'generate' | 'embed' | 'shutdown';
  payload?: {
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
    text?: string;
  };
}

interface WorkerResponse {
  type: 'initialized' | 'progress' | 'generated' | 'embedded' | 'error';
  payload?: {
    progress?: number;
    message?: string;
    text?: string;
    embedding?: number[];
    error?: string;
  };
}

let engine: webllm.MLCEngine | null = null;

async function initialize() {
  try {
    const initProgressCallback = (report: webllm.InitProgressReport) => {
      const response: WorkerResponse = {
        type: 'progress',
        payload: {
          progress: report.progress,
          message: report.text,
        },
      };
      self.postMessage(response);
    };

    engine = await webllm.CreateMLCEngine(AI_CONFIG.MODEL_ID, {
      initProgressCallback,
    });

    const response: WorkerResponse = {
      type: 'initialized',
      payload: {
        message: 'Model initialized successfully',
      },
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : 'Failed to initialize model',
      },
    };
    self.postMessage(response);
  }
}

async function generate(prompt: string, temperature = 0.7, maxTokens = 100) {
  if (!engine) {
    const response: WorkerResponse = {
      type: 'error',
      payload: {
        error: 'Engine not initialized',
      },
    };
    self.postMessage(response);
    return;
  }

  try {
    const completion = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const text = completion.choices[0]?.message?.content || '';

    const response: WorkerResponse = {
      type: 'generated',
      payload: {
        text,
      },
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : 'Failed to generate text',
      },
    };
    self.postMessage(response);
  }
}

async function generateEmbedding(text: string) {
  if (!engine) {
    const response: WorkerResponse = {
      type: 'error',
      payload: {
        error: 'Engine not initialized',
      },
    };
    self.postMessage(response);
    return;
  }

  try {
    const embeddingResult = await engine.embeddings.create({
      input: text,
    });

    const embedding = embeddingResult.data[0]?.embedding || [];

    const response: WorkerResponse = {
      type: 'embedded',
      payload: {
        embedding,
      },
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : 'Failed to generate embedding',
      },
    };
    self.postMessage(response);
  }
}

function shutdown() {
  if (engine) {
    engine = null;
  }
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'initialize':
      await initialize();
      break;

    case 'generate':
      if (payload?.prompt) {
        await generate(payload.prompt, payload.temperature, payload.maxTokens);
      }
      break;

    case 'embed':
      if (payload?.text) {
        await generateEmbedding(payload.text);
      }
      break;

    case 'shutdown':
      shutdown();
      break;

    default:
      const response: WorkerResponse = {
        type: 'error',
        payload: {
          error: `Unknown message type: ${type}`,
        },
      };
      self.postMessage(response);
  }
};
