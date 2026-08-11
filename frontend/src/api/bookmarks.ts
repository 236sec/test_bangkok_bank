import { env } from '../env';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  notes: string | null;
  ownerId: string;
  collectionId: string | null;
  createdAt: string;
  updatedAt: string;
  collection?: { id: string; name: string } | null;
}

export interface BookmarkQueryParams {
  title?: string;
  url?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBookmarkPayload {
  url: string;
  title?: string;
  notes?: string;
  collectionId?: string;
}

export interface UpdateBookmarkPayload {
  url: string;
  title: string;
  notes?: string;
  collectionId?: string;
}

export interface PatchBookmarkPayload {
  url?: string;
  title?: string;
  notes?: string;
  collectionId?: string;
}

export async function fetchBookmarks(
  accessToken: string,
  params?: BookmarkQueryParams,
): Promise<Bookmark[]> {
  const url = new URL(`${env.VITE_API_URL}/bookmarks`);

  if (params?.title) {
    url.searchParams.set('title', params.title);
  }
  if (params?.url) {
    url.searchParams.set('url', params.url);
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
    throw new Error(`/bookmarks returned ${response.status}`);
  }

  return response.json() as Promise<Bookmark[]>;
}

export async function fetchBookmark(
  accessToken: string,
  id: string,
): Promise<Bookmark> {
  const response = await fetch(`${env.VITE_API_URL}/bookmarks/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`/bookmarks/${id} returned ${response.status}`);
  }

  return response.json() as Promise<Bookmark>;
}

export async function createBookmark(
  accessToken: string,
  payload: CreateBookmarkPayload,
): Promise<Bookmark> {
  const response = await fetch(`${env.VITE_API_URL}/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`POST /bookmarks returned ${response.status}`);
  }

  return response.json() as Promise<Bookmark>;
}

export async function updateBookmark(
  accessToken: string,
  id: string,
  payload: UpdateBookmarkPayload,
): Promise<Bookmark> {
  const response = await fetch(`${env.VITE_API_URL}/bookmarks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`PUT /bookmarks/${id} returned ${response.status}`);
  }

  return response.json() as Promise<Bookmark>;
}

export async function patchBookmark(
  accessToken: string,
  id: string,
  payload: PatchBookmarkPayload,
): Promise<Bookmark> {
  const response = await fetch(`${env.VITE_API_URL}/bookmarks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`PATCH /bookmarks/${id} returned ${response.status}`);
  }

  return response.json() as Promise<Bookmark>;
}

export async function deleteBookmark(
  accessToken: string,
  id: string,
): Promise<void> {
  const response = await fetch(`${env.VITE_API_URL}/bookmarks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`DELETE /bookmarks/${id} returned ${response.status}`);
  }
}

export async function fetchCollectionBookmarks(
  accessToken: string,
  collectionId: string,
  params?: { sortBy?: string; sortOrder?: string },
): Promise<Bookmark[]> {
  const url = new URL(
    `${env.VITE_API_URL}/collections/${collectionId}/bookmarks`,
  );

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
    throw new Error(
      `/collections/${collectionId}/bookmarks returned ${response.status}`,
    );
  }

  return response.json() as Promise<Bookmark[]>;
}
