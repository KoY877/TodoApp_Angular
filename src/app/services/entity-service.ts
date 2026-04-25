import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environement } from '../environements/environement.dev';

@Injectable({
  providedIn: 'root',
})
export class EntityService {
  private readonly apiUrl = environement.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // L'intercepteur JWT ajoute automatiquement le token Authorization à toutes les requêtes
  getDataById<T>(entity: string, id?: string): Observable<T[]> {
    if (!id) return of([]);
    return this.http.get<T>(`${this.apiUrl}/${entity}/${id}`).pipe(
      map(item => item ? [item] : [])
    );
  }

  addData<T>(entity: string, data: T): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data);
  }

  // Méthode PUT spécifique pour les boards
  putData<T>(entity: string, id: string, data: T): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${entity}/${id}`, data);
  }

  updateData<T extends { id?: string }>(entity: string, data: T): Observable<T> {
    if (!data.id) throw new Error('ID is required for update');
    return this.http.patch<T>(`${this.apiUrl}/${entity}/${data.id}`, data);
  }

  deleteData(entity: string, id: string): Observable<void> {
    if (!id) throw new Error('ID is required for delete');
    return this.http.delete<void>(`${this.apiUrl}/${entity}/${id}`);
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

  searchDataEmail<T extends {memberEmail: string}>(entity: string, query: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.memberEmail.toLowerCase().includes(normalizedQuery));
      })
    );
  }
}
