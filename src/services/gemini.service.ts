

// FIX: Import necessary Angular and Gemini modules for chat functionality.
import { Injectable, signal, inject, effect } from '@angular/core';
import { GoogleGenAI, Chat, Part, Tool, GenerateContentResponse, FunctionCall, Type } from '@google/genai';
import { CellType } from '../models/notebook-cell.model';
// FIX: Import AgentMessage model for chat history typing.
import { AgentMessage } from '../models/agent-message.model';
// FIX: Import JupyterService for executing code from the agent.
import { JupyterService } from './jupyter.service';

export type AiProvider = 'gemini' | 'azure' | 'claude';

// Settings Models
export interface GeminiSettings {
  apiKey: string;
  model: string;
  systemInstruction: string;
}

export interface AzureSettings {
  apiKey: string;
  endpoint: string;
  deployment: string;
  model: string;
  systemInstruction: string;
}

export interface ClaudeSettings {
  apiKey: string;
  model: string;
  systemInstruction: string;
}

export interface GeneralSettings {
  defaultCellType: CellType;
}

export type AppSettings = {
  gemini: GeminiSettings;
  azure: AzureSettings;
  claude: ClaudeSettings;
  general: GeneralSettings;
};

const DEFAULT_SETTINGS: AppSettings = {
  gemini: { apiKey: '', model: 'gemini-2.5-flash', systemInstruction: 'You are a helpful assistant for a software developer.' },
  azure: { apiKey: '', endpoint: '', deployment: '', model: 'gpt-4', systemInstruction: 'You are an AI assistant that helps people find information.' },
  claude: { apiKey: '', model: 'claude-3-opus-20240229', systemInstruction: 'You are a helpful assistant.' },
  general: {
    defaultCellType: 'code'
  }
};

const SETTINGS_KEY = 'notebook-ide-ai-settings';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | undefined;
  // FIX: Inject JupyterService to execute code from tool calls.
  private jupyterService = inject(JupyterService);

  // FIX: Define a chat instance to maintain conversation history.
  private chat: Chat | undefined;
  // FIX: Create a signal to hold the chat history for the UI. This resolves the 'chatHistory' property error.
  chatHistory = signal<AgentMessage[]>([]);
  activeProvider = signal<AiProvider>('gemini');
  appSettings = signal<AppSettings>(this.loadSettings());


  constructor() {
    this.initializeProvider();

    // Re-initialize when settings change
    effect(() => {
      this.appSettings(); // Depend on settings
      this.initializeProvider();
    });
  }

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        // Basic merge to ensure new properties from DEFAULT_SETTINGS are included
        const parsed = JSON.parse(stored);
        return {
          gemini: { ...DEFAULT_SETTINGS.gemini, ...parsed.gemini },
          azure: { ...DEFAULT_SETTINGS.azure, ...parsed.azure },
          claude: { ...DEFAULT_SETTINGS.claude, ...parsed.claude },
          general: { ...DEFAULT_SETTINGS.general, ...parsed.general },
        };
      }
    } catch (e) {
      console.error("Failed to load AI settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      this.appSettings.set(settings);
    } catch (e) {
      console.error("Failed to save AI settings to localStorage", e);
    }
  }
  
  private initializeProvider() {
    const provider = this.activeProvider();
    if (provider === 'gemini') {
      const geminiSettings = this.appSettings().gemini;
      const apiKey = geminiSettings.apiKey || process.env.API_KEY;
      if (!apiKey) {
        this.ai = undefined;
        console.error('Gemini API key is not set.');
      } else {
        this.ai = new GoogleGenAI({ apiKey });
      }
      this.initializeChat();
    } else {
      // Handle other providers initialization if they were real
      this.ai = undefined;
      this.chat = undefined;
      this.updateMockMessage();
    }
  }
  
  setProvider(provider: AiProvider) {
    this.activeProvider.set(provider);
    this.chatHistory.set([]);
    this.initializeProvider();
  }

  private updateMockMessage() {
    const provider = this.activeProvider();
    const settings = this.appSettings();
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    let message = `${providerName} provider is not implemented. This is a mock response. Please switch to the Gemini provider for full functionality.`;
    
    if (provider === 'azure' && !settings.azure.apiKey) {
      message = `Please configure your Azure OpenAI credentials in Settings to use this provider.`;
    } else if (provider === 'claude' && !settings.claude.apiKey) {
      message = `Please configure your Anthropic Claude credentials in Settings to use this provider.`;
    }

    this.chatHistory.set([{
        id: Date.now(),
        role: 'model',
        text: message
    }]);
  }

  // FIX: Add a private method to initialize the chat with a code execution tool.
  private initializeChat() {
    if (!this.ai || this.activeProvider() !== 'gemini') {
        this.chat = undefined;
        return;
    };
    
    const geminiSettings = this.appSettings().gemini;

    const agentTools: Tool = {
      functionDeclarations: [
        {
          name: 'execute_python',
          description: 'Execute python code in a jupyter notebook. Returns the stdout and stderr from the execution.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              code: {
                type: Type.STRING,
                description: 'The python code to execute.'
              }
            },
            required: ['code']
          }
        },
        {
          name: 'web_search',
          description: 'Searches the web for up-to-date information on a given query. Use this for questions about recent events or topics.',
          parameters: {
            type: Type.OBJECT,
            properties: { query: { type: Type.STRING, description: 'The search query.' } },
            required: ['query']
          }
        },
        {
          name: 'read_url',
          description: 'Reads the textual content from a given URL. Use this to summarize articles, extract information from web pages, etc.',
          parameters: {
            type: Type.OBJECT,
            properties: { url: { type: Type.STRING, description: 'The URL to read content from.' } },
            required: ['url']
          }
        }
      ]
    };

    this.chat = this.ai.chats.create({
      model: geminiSettings.model || 'gemini-2.5-flash',
      // FIX: The 'tools' property should be nested inside a 'config' object.
      config: {
        tools: [agentTools],
        systemInstruction: geminiSettings.systemInstruction,
      }
    });
  }

  // FIX: Implement the sendMessage method to handle user input and model interaction. This resolves the 'sendMessage' property error.
  async sendMessage(message: string) {
    if (this.activeProvider() !== 'gemini') {
        this.updateMockMessage();
        return;
    }
      
    if (!this.chat) {
      this.chatHistory.update(h => [...h, { id: Date.now(), role: 'model', isError: true, text: 'Chat is not initialized. Please check your API key in settings.'}]);
      console.error('Chat is not initialized.');
      return;
    }

    const userMessage: AgentMessage = {
      id: Date.now(),
      role: 'user',
      text: message
    };
    this.chatHistory.update(history => [...history, userMessage]);

    const modelMessageId = Date.now() + 1;
    const loadingMessage: AgentMessage = {
      id: modelMessageId,
      role: 'model',
      text: '',
      isLoading: true,
    };
    this.chatHistory.update(history => [...history, loadingMessage]);

    try {
      // FIX: The sendMessage method expects a SendMessageParameters object, not a raw string.
      let response: GenerateContentResponse = await this.chat.sendMessage({ message });

      while (true) {
        const functionCalls: FunctionCall[] = response.candidates?.[0]?.content.parts
          .filter(part => !!part.functionCall)
          .map(part => part.functionCall!) ?? [];

        if (functionCalls.length === 0) {
          // No tool call, we have the final response.
          this.updateModelMessage(modelMessageId, {
            text: response.text,
            isLoading: false,
            isError: false,
            toolCalls: [],
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
          });
          break; // Exit loop
        }

        // We have tool calls
        this.updateModelMessage(modelMessageId, {
          text: response.text, // Show any text that came with the tool call
          isLoading: true,
          toolCalls: functionCalls.map(fc => ({ name: fc.name, args: fc.args }))
        });

        const functionResponseParts: Part[] = [];

        for (const call of functionCalls) {
          if (call.name === 'execute_python' && call.args['code']) {
            const code = call.args['code'] as string;
            try {
              const output = await this.jupyterService.executeForAgent(code);
              functionResponseParts.push({
                functionResponse: {
                  name: 'execute_python',
                  response: { output }
                }
              });
            } catch (e: any) {
              functionResponseParts.push({
                functionResponse: {
                  name: 'execute_python',
                  response: { error: e.toString() }
                }
              });
            }
          } else if (call.name === 'web_search' && call.args['query']) {
            const query = call.args['query'] as string;
            try {
                const searchResult = await this.performWebSearch(query);
                functionResponseParts.push({ functionResponse: { name: 'web_search', response: { result: searchResult } } });
            } catch (e: any) {
                functionResponseParts.push({ functionResponse: { name: 'web_search', response: { error: e.toString() } } });
            }
          } else if (call.name === 'read_url' && call.args['url']) {
            const url = call.args['url'] as string;
            try {
                const content = await this.readUrlContent(url);
                functionResponseParts.push({ functionResponse: { name: 'read_url', response: { content } } });
            } catch (e: any) {
                functionResponseParts.push({ functionResponse: { name: 'read_url', response: { error: e.toString() } } });
            }
          }
        }

        // Send results back to the model
        // FIX: The sendMessage method expects a SendMessageParameters object. Wrap the parts array in an object.
        response = await this.chat.sendMessage({ message: functionResponseParts });
      }
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      this.updateModelMessage(modelMessageId, {
        text: 'Sorry, something went wrong processing your request. Please check your API key and model name in the settings.',
        isLoading: false,
        isError: true,
      });
    }
  }

  private async performWebSearch(query: string): Promise<string> {
    if (!this.ai) {
        throw new Error('Gemini service not available.');
    }
    try {
        const response = await this.ai.models.generateContent({
            model: this.appSettings().gemini.model || 'gemini-2.5-flash',
            contents: query,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        let resultText = response.text;
        if (groundingChunks && groundingChunks.length > 0) {
            const sources = groundingChunks
                .filter(chunk => chunk.web?.uri)
                .map(chunk => `[${chunk.web?.title || chunk.web?.uri}](${chunk.web?.uri})`)
                .join('\n');
            if (sources) {
                resultText += `\n\nSources:\n${sources}`;
            }
        }
        return resultText;
    } catch (error) {
        console.error('Error performing web search:', error);
        throw new Error('Failed to perform web search.');
    }
  }

  private async readUrlContent(url: string): Promise<string> {
    try {
        // NOTE: This implementation uses fetch() from the browser. It will be blocked by CORS for most external websites.
        // A more robust solution requires a backend proxy to bypass CORS restrictions.
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL with status: ${response.statusText}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('script, style').forEach(el => el.remove());
        let text = doc.body.textContent || '';
        text = text.replace(/\s\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
        return text.substring(0, 8000); // Truncate to a reasonable length for the context window
    } catch (error) {
        console.error(`Error reading URL ${url}:`, error);
        throw new Error(`Could not read content from the URL. It might be inaccessible due to browser CORS policy or other network issues.`);
    }
  }


  // FIX: Add a private helper to update a specific model message in the history.
  private updateModelMessage(id: number, updates: Partial<Omit<AgentMessage, 'id' | 'role'>>) {
    this.chatHistory.update(history =>
      history.map(msg => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }

  async getCodeSuggestions(code: string, token: any): Promise<string[]> {
    if (this.activeProvider() !== 'gemini' || !this.ai || code.trim().length < 10) {
      return [];
    }

    const prompt = `You are a code completion assistant for a Python notebook.
Your task is to complete the given Python code snippet.
- Only return the suggested code completion.
- Do not repeat the user's existing code.
- Do not add any comments, explanations, or markdown formatting like \`\`\`python.
- The completion should be concise and relevant to the surrounding code.

Here is the code to complete:
\`\`\`python
${code}
\`\`\`
Completion:`;

    try {
      const generatePromise = this.ai.models.generateContent({
        model: this.appSettings().gemini.model || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: 64,
          temperature: 0.2,
        },
      });

      const cancellationPromise = new Promise<never>((_, reject) => {
        if (token?.isCancellationRequested) {
          return reject(new Error('Cancelled'));
        }
        const disposable = token?.onCancellationRequested(() => {
          disposable.dispose();
          reject(new Error('Cancelled'));
        });
      });

      const response: GenerateContentResponse = await Promise.race([
        generatePromise,
        cancellationPromise,
      ]);

      const completion = response.text?.trim();
      if (!completion) {
        return [];
      }
      return completion.split('\n').filter(line => line.trim() !== '');
    } catch (error) {
      if ((error as Error).message !== 'Cancelled') {
        console.error('Error getting code suggestions:', error);
      }
      return [];
    }
  }

  async generateCodeFromPrompt(prompt: string): Promise<string> {
    const provider = this.activeProvider();
    if (provider !== 'gemini') {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      return Promise.resolve(`# Mock response from ${providerName} provider.\nprint("Hello from ${providerName}!")`);
    }

    if (!this.ai) {
        return Promise.resolve(`// Gemini service not available. Please check your API key in settings.`);
    }

    const fullPrompt = `You are a coding assistant. Based on the user's request, write a Python code snippet that can be run in a Jupyter notebook.
- Only return the raw Python code.
- Do not include any explanations, comments about the code, or markdown formatting like \`\`\`python.

User Request: "${prompt}"`;

    try {
        const response = await this.ai.models.generateContent({
            model: this.appSettings().gemini.model || 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        let generatedCode = response.text?.trim() ?? '';

        if (groundingChunks && groundingChunks.length > 0) {
            const sources = groundingChunks
                .map(chunk => chunk.web?.uri)
                .filter((uri): uri is string => !!uri)
                .map(uri => `# Source: ${uri}`)
                .join('\n');
            if (sources) {
                generatedCode = `# Generated with information from Google Search:\n${sources}\n\n${generatedCode}`;
            }
        }

        return generatedCode;
    } catch (error) {
        console.error('Error generating code from prompt:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Promise.resolve(`# An error occurred while generating code: ${errorMessage}`);
    }
  }

  async generateMarkdownForPromptCell(prompt: string): Promise<string> {
    const provider = this.activeProvider();
    if (provider !== 'gemini') {
        const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
        return Promise.resolve(`### Mock Response from ${providerName}\n\nThis is a mock response. Switch to the Gemini provider for full functionality.`);
    }

    if (!this.ai) {
        return Promise.resolve(`// Gemini service not available. Please check your API key in settings.`);
    }

    const fullPrompt = `You are a helpful assistant for a software developer using a notebook environment. Based on the user's request, provide a response in Markdown format.
- If the user asks for code, provide a clear explanation and the Python code snippet in a \`\`\`python markdown block.
- If the user asks a question, provide a clear and concise answer.
- The response should be well-formatted markdown.

User Request: "${prompt}"`;

    try {
        const response = await this.ai.models.generateContent({
            model: this.appSettings().gemini.model || 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        let generatedMarkdown = response.text?.trim() ?? '';

        if (groundingChunks && groundingChunks.length > 0) {
            const sources = groundingChunks
                .filter(chunk => chunk.web?.uri)
                .map(chunk => `* <${chunk.web?.uri}>`)
                .join('\n');
            if (sources) {
                generatedMarkdown += `\n\n---\n\n**Sources:**\n${sources}`;
            }
        }

        return generatedMarkdown;
    } catch (error) {
        console.error('Error generating markdown from prompt:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Promise.resolve(`### Error\n\nAn error occurred while generating code: ${errorMessage}`);
    }
  }
}