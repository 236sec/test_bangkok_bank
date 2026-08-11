import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CollectionCard from './CollectionCard';
import type { Collection } from '../../api/collections';

const collection: Collection = {
  id: 'col-1',
  name: 'Tech Articles',
  ownerId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
  _count: { bookmarks: 3 },
};

describe('CollectionCard', () => {
  it('renders collection name and bookmark count', () => {
    render(
      <CollectionCard
        collection={collection}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Tech Articles')).toBeInTheDocument();
    expect(screen.getByText('3 bookmarks')).toBeInTheDocument();
  });

  it('renders edit button that calls onEdit prop', () => {
    const onEdit = vi.fn();

    render(
      <CollectionCard
        collection={collection}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    screen.getByLabelText('Edit collection').click();
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders delete button that calls onDelete prop', () => {
    const onDelete = vi.fn();

    render(
      <CollectionCard
        collection={collection}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onClick={vi.fn()}
      />,
    );

    screen.getByLabelText('Delete collection').click();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders correctly with _count undefined (0 bookmarks)', () => {
    const noCount: Collection = {
      id: 'col-2',
      name: 'Empty',
      ownerId: 'user-1',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };

    render(
      <CollectionCard
        collection={noCount}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('0 bookmarks')).toBeInTheDocument();
  });
});
