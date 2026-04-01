export type HumanLatchStatus =
  | "pending_approval"
  | "approved_auto"
  | "approved_manual"
  | "rejected"
  | "blocked"
  | "cancelled";

export type HumanLatchHeaders = Record<string, string>;

export interface ProposeActionInput {
  action_type: string;
  target: string;
  summary: string;
  payload?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface ProposeActionResult {
  id: string;
  status: HumanLatchStatus;
  risk_score: number;
  summary: string;
}

export interface ActionRecord extends ProposeActionResult {
  workspace_id: string;
  target: string;
  action_type: string;
  payload: Record<string, unknown>;
  context: Record<string, unknown>;
  proposed_by: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListActionsOptions {
  status?: HumanLatchStatus;
  limit?: number;
  offset?: number;
}

export interface DecisionOptions {
  note?: string;
}

export interface HumanLatchClientOptions {
  baseUrl: string;
  workspaceId: string;
  token?: string;
  apiKey?: string;
  headers?: HumanLatchHeaders;
  fetch?: typeof fetch;
}

export class HumanLatchError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "HumanLatchError";
    this.status = status;
    this.detail = detail;
  }
}

export class HumanLatchClient {
  private readonly baseUrl: string;
  private readonly workspaceId: string;
  private readonly token?: string;
  private readonly apiKey?: string;
  private readonly headers: HumanLatchHeaders;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HumanLatchClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.workspaceId = options.workspaceId;
    this.token = options.token;
    this.apiKey = options.apiKey;
    this.headers = options.headers ?? {};
    this.fetchImpl = options.fetch ?? fetch;

    if (!this.token && !this.apiKey) {
      throw new Error("HumanLatchClient requires either a token or an apiKey.");
    }
  }

  async proposeAction(input: ProposeActionInput): Promise<ProposeActionResult> {
    return this.request<ProposeActionResult>("/api/v1/actions/propose", {
      method: "POST",
      body: JSON.stringify({
        action_type: input.action_type,
        target: input.target,
        summary: input.summary,
        payload: input.payload ?? {},
        context: input.context ?? {},
      }),
    });
  }

  async listActions(options: ListActionsOptions = {}): Promise<ActionRecord[]> {
    const query = new URLSearchParams();

    if (options.status) query.set("status", options.status);
    if (typeof options.limit === "number") query.set("limit", String(options.limit));
    if (typeof options.offset === "number") query.set("offset", String(options.offset));

    return this.request<ActionRecord[]>(`/api/v1/actions?${query.toString()}`);
  }

  async getAction(actionId: string): Promise<ActionRecord> {
    return this.request<ActionRecord>(`/api/v1/actions/${actionId}`);
  }

  async approveAction(actionId: string, options: DecisionOptions = {}): Promise<ActionRecord> {
    return this.request<ActionRecord>(`/api/v1/actions/${actionId}/approve`, {
      method: "POST",
      body: JSON.stringify({ note: options.note }),
    });
  }

  async rejectAction(actionId: string, note: string): Promise<ActionRecord> {
    return this.request<ActionRecord>(`/api/v1/actions/${actionId}/reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  async cancelAction(actionId: string): Promise<ActionRecord> {
    return this.request<ActionRecord>(`/api/v1/actions/${actionId}/cancel`, {
      method: "POST",
    });
  }

  isApproved(result: Pick<ProposeActionResult, "status">): boolean {
    return result.status === "approved_auto" || result.status === "approved_manual";
  }

  requiresApproval(result: Pick<ProposeActionResult, "status">): boolean {
    return result.status === "pending_approval";
  }

  isBlocked(result: Pick<ProposeActionResult, "status">): boolean {
    return result.status === "blocked" || result.status === "rejected";
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const separator = path.includes("?") ? "&" : "?";
    const hasWorkspaceId = /(?:\?|&)workspace_id=/.test(path);
    const workspaceQuery = hasWorkspaceId
      ? ""
      : `${separator}workspace_id=${encodeURIComponent(this.workspaceId)}`;
    const url = `${this.baseUrl}${path}${workspaceQuery}`;

    const headers: HumanLatchHeaders = {
      "Content-Type": "application/json",
      ...this.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const response = await this.fetchImpl(url, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers as HumanLatchHeaders | undefined),
      },
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      const message =
        typeof detail === "object" &&
        detail !== null &&
        "detail" in detail &&
        typeof (detail as { detail: unknown }).detail === "string"
          ? (detail as { detail: string }).detail
          : "HumanLatch request failed";

      throw new HumanLatchError(message, response.status, detail);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
