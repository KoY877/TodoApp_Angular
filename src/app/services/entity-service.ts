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

  /**
   * Fetch a single entity by ID
   * The JWT interceptor automatically adds the Authorization header
   * @param entity - API resource name (e.g. 'boards')
   * @param id - optional resource ID; returns empty array if absent
   */
  getDataById<T>(entity: string, id?: string): Observable<T[]> {
    if (!id) return of([]);
    // Wrap the single item in an array for a consistent return type
    return this.http.get<T>(`${this.apiUrl}/${entity}/${id}`).pipe(
      map(item => item ? [item] : [])
    );
  }

  /**
   * Create a new entity
   * @param entity - API resource name
   * @param data - the payload to POST
   */
  addData<T>(entity: string, data: T): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data);
  }

  /**
   * Full replacement of an existing entity (PUT)
   * @param entity - API resource name
   * @param id - resource ID to update
   * @param data - the new payload
   */
  putData<T>(entity: string, id: string, data: T): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${entity}/${id}`, data);
  }

  /**
   * Partial update of an existing entity (PATCH)
   * @param entity - API resource name
   * @param data - partial payload; must include an `id` field
   */
  updateData<T extends { id?: string }>(entity: string, data: T): Observable<T> {
    if (!data.id) throw new Error('ID is required for update');
    return this.http.patch<T>(`${this.apiUrl}/${entity}/${data.id}`, data);
  }

  /**
   * Delete an entity by ID
   * @param entity - API resource name
   * @param id - resource ID to delete
   */
  deleteData(entity: string, id: string): Observable<void> {
    if (!id) throw new Error('ID is required for delete');
    return this.http.delete<void>(`${this.apiUrl}/${entity}/${id}`);
  }

  /**
   * Fetch all entities of a given type
   * @param entity - API resource name
   */
  getData<T>(entity: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`);
  }

  /**
   * Search entities by name (uses client-side filtering)
   * @param entity - API resource name
   * @param query - search string matched against step1.name
   */
  searchData<T extends { step1: { name: string } }>(entity: string, query: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        // Normalize both sides for case-insensitive matching
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.step1.name.toLowerCase().includes(normalizedQuery));
      })
    );
  }

  /**
   * Search entities by member email (uses client-side filtering)
   * @param entity - API resource name
   * @param query - search string matched against memberEmail
   */
  searchDataEmail<T extends {memberEmail: string}>(entity: string, query: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        // Normalize both sides for case-insensitive matching
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.memberEmail.toLowerCase().includes(normalizedQuery));
      })
    );
  }
}
