import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface FrontendLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  meta?: any;
  timestamp?: string;
  developer?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly http = inject(HttpClient);

  private sendToServer(entry: FrontendLogEntry) {
    if (!environment.logToServer || !environment.apiLogEndpoint) return;
    try {
      this.http.post(environment.apiLogEndpoint, entry).subscribe({});
    } catch {
      // swallow - do not fail the application if logging fails
    }
  }

  debug(message: string, meta?: any) {
    console.debug(message, { meta });
    const entry: FrontendLogEntry = { level: 'debug', message, meta, timestamp: new Date().toISOString(), developer: !environment.production };
    this.sendToServer(entry);
  }

  info(message: string, meta?: any) {
    console.info(message, { meta });
    const entry: FrontendLogEntry = { level: 'info', message, meta, timestamp: new Date().toISOString(), developer: !environment.production };
    this.sendToServer(entry);
  }

  warn(message: string, meta?: any) {
    console.warn(message, { meta });
    const entry: FrontendLogEntry = { level: 'warn', message, meta, timestamp: new Date().toISOString(), developer: !environment.production };
    this.sendToServer(entry);
  }

  error(message: string, meta?: any) {
    console.error(message, { meta });
    const entry: FrontendLogEntry = { level: 'error', message, meta, timestamp: new Date().toISOString(), developer: !environment.production };
    this.sendToServer(entry);
  }
}
