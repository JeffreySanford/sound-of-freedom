import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly KEY = 'user_settings';

  getGenerator(): string | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.generator || null;
    } catch {
      return null;
    }
  }

  setGenerator(generator: string) {
    try {
      const raw = localStorage.getItem(this.KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.generator = generator;
      localStorage.setItem(this.KEY, JSON.stringify(parsed));
    } catch {
      // noop
    }
  }
}
