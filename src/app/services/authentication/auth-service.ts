import { Injectable } from '@angular/core';
import { environement } from '../../environements/environement.dev';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
   private readonly apiUrl = environement.apiUrl;

  constructor(private readonly http: HttpClient) { }

  // Method to validate user credentials
  private getAuthAHeaders(): HttpHeaders {
    const apiSecret = localStorage.getItem('Api-Secret');
    return new HttpHeaders({
      'Content-Type': `application/json`,
      'Api-Secret': apiSecret ? apiSecret : '',
      'User-Id': localStorage.getItem('User-Id') || '',
      'User-Name': localStorage.getItem('User-Name') || ''
    });
  }

  // ========== ENDPOINTS PUBLICS (without Auth) ==========
  addUser<T>(entity: string, data: T): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data);
  }

  getUserByEmailAndPassword(entity: string, data: { email: string; password: string }): Observable<string> {
    const params = new HttpParams()
      .set('email', data.email)
      .set('password', data.password);

    return this.http.get(`${this.apiUrl}/${entity}`, {
      params,
      responseType: 'text'
    });
  }

  // ========== ENDPOINTS AUTHENTIFIÉS (with Api-Secret) ==========

  //GET authentification
  get<T>(entity: string): Observable<T> {
    const headers = this.getAuthAHeaders();
    return this.http.get<T>(`${this.apiUrl}/${entity}`, { headers });
  }

  // POST authentification
  post<T>(entity: string, data: any): Observable<T> {
    const headers = this.getAuthAHeaders();
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data, { headers });
  }

  // PUT authentification
  put<T>(entity: string, data: any): Observable<T> {
    const headers = this.getAuthAHeaders();
    return this.http.put<T>(`${this.apiUrl}/${entity}`, data, { headers });
  }

  // PATCH authentification
  pacth<T>(entity: string, data: any): Observable<T> {
    const headers = this.getAuthAHeaders();
    return this.http.patch<T>(`${this.apiUrl}/${entity}`, data, { headers });
  }

  // DELETE authentification
  delete<T>(entity: string): Observable<T> {
    const headers = this.getAuthAHeaders();
    return this.http.delete<T>(`${this.apiUrl}/${entity}`, { headers });
  }

  // GET by ID authentification
  getDataById<T extends { id?: string }>(entity: string, id?: string): Observable<T[]> {
    const headers = this.getAuthAHeaders();
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`, { headers }).pipe(
      map(items => {
        if (!id) return [];
        return Array.isArray(items) ? items.filter(item => item.id?.includes(id)) : [];
      })
    );
  }

  // SEARCH authentification
  searchData<T extends { step1: { name: string } }>(entity: string, query: string): Observable<T[]> {
    const headers = this.getAuthAHeaders();
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`, { headers }).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.step1.name.toLowerCase().includes(normalizedQuery));
      })
    );
  }

}
