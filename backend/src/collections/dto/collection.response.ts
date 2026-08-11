export interface CollectionResponse {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { bookmarks: number };
}
