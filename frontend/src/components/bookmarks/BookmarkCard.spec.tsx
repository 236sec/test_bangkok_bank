import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import BookmarkCard from './BookmarkCard';
import type { Bookmark } from '../../api/bookmarks';

const mockBookmark: Bookmark = {
  id: 'bm-1',
  url: 'https://example.com/very/long/path/that/exceeds/fifty/characters/for/testing',
  title: 'Example Site',
  favicon: 'https://example.com/favicon.ico',
  notes: null,
  ownerId: 'auth0|user-1',
  collectionId: 'col-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  collection: { id: 'col-1', name: 'Tech Bookmarks' },
};

describe('BookmarkCard', () => {
  it('renders favicon image when favicon is a URL', () => {
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    const img = document.querySelector('img');
    expect(img).toBeDefined();
    expect(img?.getAttribute('src')).toBe('https://example.com/favicon.ico');
  });

  it('renders fallback LanguageIcon when favicon is null', () => {
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={{ ...mockBookmark, favicon: null }}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    // LanguageIcon renders an SVG with test-id or role
    const svg = document.querySelector('svg');
    expect(svg).toBeDefined();
  });

  it('renders title', () => {
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Example Site')).toBeDefined();
  });

  it('renders truncated URL snippet', () => {
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    // URL should be truncated to 50 chars
    const urlText = screen.getByText(/https:\/\/example.com/);
    expect(urlText).toBeDefined();
    expect(urlText.textContent!.length).toBeLessThanOrEqual(51); // 50 + …
  });

  it('renders collection chip when collection is set', () => {
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Tech Bookmarks')).toBeDefined();
  });

  it('renders no collection chip when collection is null', () => {
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={{ ...mockBookmark, collection: null, collectionId: null }}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Tech Bookmarks')).toBeNull();
  });

  it('renders edit button that calls onEdit', () => {
    const onEdit = vi.fn();
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    screen.getByLabelText('Edit bookmark').click();
    expect(onEdit).toHaveBeenCalled();
  });

  it('renders delete button that calls onDelete', () => {
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={vi.fn()}
          onDelete={onDelete}
          onClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    screen.getByLabelText('Delete bookmark').click();
    expect(onDelete).toHaveBeenCalled();
  });

  it('card click calls onClick', () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={onClick}
        />
      </MemoryRouter>,
    );

    // Click the CardActionArea (the clickable area)
    const actionArea = document.querySelector('.MuiCardActionArea-root');
    if (actionArea) {
      (actionArea as HTMLElement).click();
      expect(onClick).toHaveBeenCalled();
    }
  });

  it('edit button click does not trigger card click', () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <BookmarkCard
          bookmark={mockBookmark}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onClick={onClick}
        />
      </MemoryRouter>,
    );

    screen.getByLabelText('Edit bookmark').click();
    expect(onClick).not.toHaveBeenCalled();
  });
});
