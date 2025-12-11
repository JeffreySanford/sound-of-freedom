import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  private logger = inject(LoggerService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const start = Date.now();
    const requestClone = req.clone();
    this.logger.debug('HTTP Request', { method: requestClone.method, url: requestClone.urlWithParams, body: requestClone.body });
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          const elapsed = Date.now() - start;
          this.logger.debug('HTTP Response', { url: requestClone.urlWithParams, elapsed, event });
        },
        error: (err) => {
          const elapsed = Date.now() - start;
          this.logger.error('HTTP Response Error', { url: requestClone.urlWithParams, elapsed, message: err && err.message, status: err && err.status });
        },
      })
    );
  }
}
