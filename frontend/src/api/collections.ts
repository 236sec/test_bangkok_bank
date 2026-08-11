import { env } from '../env';

export interface Collection {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { bookmarks: number };
}

export interface CollectionQueryParams {
  name?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export async function fetchCollections(
  accessToken: string,
  params?: CollectionQueryParams,
): Promise<Collection[]> {
  const url = new URL(`${env.VITE_API_URL}/collections`);

  if (params?.name) {
    url.searchParams.set('name', params.name);
  }
  if (params?.sortBy) {
    url.searchParams.set('sortBy', params.sortBy);
  }
  if (params?.sortOrder) {
    url.searchParams.set('sortOrder', params.sortOrder);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`/collections returned ${response.status}`);
  }

  return response.json() as Promise<Collection[]>;
}

export async function fetchCollection(
  accessToken: string,
  id: string,
): Promise<Collection> {
  const response = await fetch(`${env.VITE_API_URL}/collections/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`/collections/${id} returned ${response.status}`);
  }

  return response.json() as Promise<Collection>;
}

export async function createCollection(
  accessToken: string,
  name: string,
): Promise<Collection> {
  const response = await fetch(`${env.VITE_API_URL}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`POST /collections returned ${response.status}`);
  }

  return response.json() as Promise<Collection>;
}

export async function updateCollection(
  accessToken: string,
  id: string,
  name: string,
): Promise<Collection> {
  const response = await fetch(`${env.VITE_API_URL}/collections/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`PUT /collections/${id} returned ${response.status}`);
  }

  return response.json() as Promise<Collection>;
}

export async function patchCollection(
  accessToken: string,
  id: string,
  data: { name?: string },
): Promise<Collection> {
  const response = await fetch(`${env.VITE_API_URL}/collections/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`PATCH /collections/${id} returned ${response.status}`);
  }

  return response.json() as Promise<Collection>;
}

export async function deleteCollection(
  accessToken: string,
  id: string,
): Promise<void> {
  const response = await fetch(`${env.VITE_API_URL}/collections/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`DELETE /collections/${id} returned ${response.status}`);
  }
}
