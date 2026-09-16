import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Firebase client so importing the page never touches the SDK or env.
vi.mock('$lib/firebase/client', () => ({
  db: {},
  auth: {},
  storage: {}
}));

// Run the page's browser-only load effect and return an empty player list so
// the page settles into its rendered (non-loading) state without any network.
vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/repositories/players.repository', () => ({
  MAX_PAGE_SIZE: 25,
  getPlayers: vi.fn(async () => ({ players: [], lastDoc: null }))
}));

import { render, waitFor } from '@testing-library/svelte';
import PlayersPage from '../src/routes/admin/players/+page.svelte';
import { authStore } from '$lib/stores/auth.store.svelte';

describe('viewer role hides write controls on the Players page', () => {
  beforeEach(() => {
    authStore.role = 'viewer';
    authStore.loading = false;
  });

  it('does not render Add / Edit / Delete controls for a viewer', async () => {
    const { queryByText, queryByRole } = render(PlayersPage);

    // Wait for the browser-only load effect to resolve to the empty state.
    await waitFor(() => {
      expect(queryByText(/no players match/i)).not.toBeNull();
    });

    // No "Add Player" action (button or link) is present.
    expect(queryByText(/add player/i)).toBeNull();
    expect(queryByText(/add your first player/i)).toBeNull();

    // No add/edit/delete links to player routes.
    const addLink = queryByRole('link', { name: /add/i });
    expect(addLink).toBeNull();
  });

  it('renders the Add Player control for an editor (control gate works)', async () => {
    authStore.role = 'editor';
    const { queryByText, findByText } = render(PlayersPage);

    // The Add Player link is visible for a writer role.
    await findByText(/add player/i);
    expect(queryByText(/add player/i)).not.toBeNull();
  });
});
