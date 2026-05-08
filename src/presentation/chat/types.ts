export interface QuickReply {
  label: string;
  value: string;
}

export interface InputAffordance {
  kind: 'text' | 'number' | 'url_or_skip' | 'date' | 'date_or_skip';
  placeholder: string;
  skipLabel?: string;
}

export interface StartResponse {
  sessionId: string;
  agentMessage: string;
  nextQuestionId: string | null;
  suggestions: QuickReply[] | null;
  input: InputAffordance | null;
}

export interface MessageResponse {
  done: boolean;
  agentMessage: string;
  nextQuestionId?: string | null;
  suggestions?: QuickReply[] | null;
  input?: InputAffordance | null;
  extracted?: string[];
  error?: string;
}

export interface AgentTurn {
  role: 'agent';
  message: string;
}

export interface UserTurn {
  role: 'user';
  text: string;
}

export type Turn = AgentTurn | UserTurn;
