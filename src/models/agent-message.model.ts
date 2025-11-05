

export type MessageRole = 'user' | 'model';

export interface ToolCall {
  name: string;
  args: { [key: string]: any };
}

export interface GroundingChunk {
  // FIX: The 'web' property is made optional to match the @google/genai library's GroundingChunk type, resolving a type incompatibility.
  web?: {
    // FIX: made uri and title optional to match the library type
    uri?: string;
    title?: string;
  };
}

export interface AgentMessage {
  id: number;
  role: MessageRole;
  text: string;
  toolCalls?: ToolCall[];
  groundingChunks?: GroundingChunk[];
  isLoading?: boolean;
  isError?: boolean;
}
