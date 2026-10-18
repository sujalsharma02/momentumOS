export function readSession(req: any): Promise<string | null>;
export function createSession(username: string, res: any): Promise<void>;
export function clearSession(req: any, res: any): Promise<void>;
export function credentialsMatch(username: unknown, password: unknown): boolean;
