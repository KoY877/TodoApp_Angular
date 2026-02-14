import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { environement } from '../environements/environement.dev';

@Injectable({
  providedIn: 'root',
})
export class EntityService {
   private readonly apiUrl = environement.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // Method to validate user credentials
  private getAuthAHeaders(): HttpHeaders | null {
    const apiSecret = localStorage.getItem('Api-Secret');
    const userId = localStorage.getItem('User-Id');

    if (!apiSecret || !userId) {
      return null;
    }

    return new HttpHeaders({
      'Content-Type': `application/json`,
      'Api-Secret': apiSecret,
      'User-Id': userId
    });
  }

  getDataById<T extends { id?: string }>(entity: string, id?: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!id) return [];
        return Array.isArray(items) ? items.filter(item => item.id?.includes(id)) : [];
      })
    );
  }

  addData<T>(entity: string, data: T): Observable<T> {
    const headers = this.getAuthAHeaders();

    if (!headers) {
      return throwError(() => new Error('API Secret and User ID are required for authentication. Please sign in.'));
    }

    return this.http.post<T>(`${this.apiUrl}/${entity}`, data, { headers });
  }

  updateData<T>(entity: string, data: T): Observable<T> {
    const headers = this.getAuthAHeaders();

    if (!headers) {
      return throwError(() => new Error('API Secret and User ID are required for authentication. Please sign in.'));
    }

    return this.http.put<T>(`${this.apiUrl}/${entity}`, data, { headers });
  }

  getData<T>(entity: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`);
  }

  searchData<T extends { step1: { name: string } }>(entity: string, query: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.step1.name.toLowerCase().includes(normalizedQuery));
      })
    );
  }

  searchDataEmail<T extends { step4: { memberColumns: { memberEmail: string } } }>(entity: string, query: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.step4.memberColumns.memberEmail.toLowerCase().includes(normalizedQuery));
      })
    );
  }

}
