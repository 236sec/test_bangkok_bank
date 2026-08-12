export interface BookmarkResponse {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  notes: string | null;
  ownerId: string;
  collectionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  collection?: { id: string; name: string } | null;
}
