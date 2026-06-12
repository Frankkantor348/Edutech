import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import type { DashboardResponse } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private apiUrl = environment.apiUrl;

  getDashboard(): Observable<DashboardResponse> {
    this.logger.info('Solicitando dashboard');
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard`);
  }
}
