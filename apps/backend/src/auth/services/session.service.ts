import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionService {
	private sessionMap: Map<string, string> = new Map();

	async createSession(token: string): Promise<string> {
		const session = `session-${randomUUID()}`;
		this.sessionMap.set(session, token);
		return session;
	}

	async getSessionString(session: string): Promise<string | undefined> {
		return this.sessionMap.get(session);
	}

	async removeSession(session: string): Promise<boolean> {
		return this.sessionMap.delete(session);
	}

	async hasSession(session: string): Promise<boolean> {
		return this.sessionMap.has(session);
	}
}
