import { Injectable } from '@angular/core';
import { environement } from '../environements/environement.dev';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { Members } from '../models/members.model';
import { TokenService } from './authentication/tokenService';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
   private readonly apiUrl = environement.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService
  ) {}

  // Verify authentication (the interceptor will add the header automatically)
  private ensureAuthenticated(): void {
    if (!this.tokenService.isAuthenticated() || !this.tokenService.getUserId()) {
      throw new Error('User not authenticated. Please sign in.');
    }
  }

  getMembersByBoard<T extends { boardId?: string }>(entity: string, boardId?: string): Observable<T[]> {
    this.ensureAuthenticated();

    // The interceptor will automatically add the Authorization header
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items =>
      Array.isArray(items) ? items.filter(item => item.boardId === boardId) : []
      )
    );
  }

 addMemberData(entity: string, data: Members): Observable<Members> {
    this.ensureAuthenticated();

    // The interceptor will automatically add the Authorization header
    return this.http.post<Members>(`${this.apiUrl}/${entity}`, data);
  }


  updateMemberData<T extends {id?: string}>(entity: string, data: T): Observable<T> {
    this.ensureAuthenticated();

    // The interceptor will automatically add the Authorization header
    return this.http.patch<T>(
      `${this.apiUrl}/${entity}/${data.id}`,
      data
    );
  }

  delete<T extends {id?: string}>(entity: string, data: T): Observable<T> {
    this.ensureAuthenticated();

    // The interceptor will automatically add the Authorization header
    return this.http.delete<T>(
      `${this.apiUrl}/${entity}/${data.id}`
    );
  }


  getMemberData<T>(entity: string): Observable<T[]> {
    this.ensureAuthenticated();

    // The interceptor will automatically add the Authorization header
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`);
  }

  searchMemberData<T extends { step1: { name: string } }>(entity: string, query: string): Observable<T[]> {
    this.ensureAuthenticated();

    // The interceptor will automatically add the Authorization header
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.step1.name.toLowerCase().includes(normalizedQuery));
      })
    );
  }

  searchDataEmail<T extends { memberEmail: string }>(entity: string, query: string): Observable<T[]> {
    this.ensureAuthenticated();

    // The interceptor will automatically add the Authorization header
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.memberEmail.toLowerCase().includes(normalizedQuery));
      })
    );
  }
}
