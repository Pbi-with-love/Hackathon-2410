import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuggestedTeams from './SuggestedTeams.tsx';

// Mock dependencies
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

const mockUseAuth = vi.mocked(useAuth);
const mockApiFetch = vi.mocked(apiFetch);

const USER = { id: 'user-1', name: 'Alice', role: 'participant' as const };

const SUGGESTIONS = [
  {
    teamId: 'team-1',
    teamName: 'Dream Team',
    projectIdea: 'An AI hackathon tool',
    neededRoles: ['developer', 'designer'],
    score: 0.8,
    reasons: ['This team needs a developer — that matches your skills'],
    lat: 61.4978,
    lng: 23.761,
  },
  {
    teamId: 'team-2',
    teamName: 'Unicorn Squad',
    projectIdea: 'Fintech app',
    neededRoles: ['developer'],
    score: 0.6,
    reasons: ['This team needs a developer — that matches your skills'],
    lat: null,
    lng: null,
  },
];

function mockOkResponse(body: unknown): Response {
  return { ok: true, json: () => Promise.resolve(body) } as unknown as Response;
}

function mockErrorResponse(body: unknown): Response {
  return { ok: false, json: () => Promise.resolve(body) } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: USER, isAuthenticated: true } as ReturnType<typeof useAuth>);
});

describe('SuggestedTeams', () => {
  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<SuggestedTeams />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders suggestions after load', async () => {
    mockApiFetch.mockResolvedValueOnce(mockOkResponse({ suggestions: SUGGESTIONS }));
    render(<SuggestedTeams />);
    await waitFor(() => expect(screen.getByText('Dream Team')).toBeInTheDocument());
    expect(screen.getByText('Unicorn Squad')).toBeInTheDocument();
  });

  it('shows role tags for each suggestion', async () => {
    mockApiFetch.mockResolvedValueOnce(mockOkResponse({ suggestions: SUGGESTIONS }));
    render(<SuggestedTeams />);
    await waitFor(() => screen.getByText('Dream Team'));
    expect(screen.getAllByText('developer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('designer')).toBeInTheDocument();
  });

  it('shows empty state when no suggestions', async () => {
    mockApiFetch.mockResolvedValueOnce(mockOkResponse({ suggestions: [] }));
    render(<SuggestedTeams />);
    await waitFor(() => expect(screen.getByText(/no matching teams/i)).toBeInTheDocument());
  });

  it('shows error when fetch fails', async () => {
    mockApiFetch.mockResolvedValueOnce(mockErrorResponse({ error: 'Not found' }));
    render(<SuggestedTeams />);
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument());
  });

  it('collapses and expands panel on header click', async () => {
    mockApiFetch.mockResolvedValueOnce(mockOkResponse({ suggestions: SUGGESTIONS }));
    render(<SuggestedTeams />);
    await waitFor(() => screen.getByText('Dream Team'));

    // collapse
    fireEvent.click(screen.getByText(/suggested for you/i));
    expect(screen.queryByText('Dream Team')).not.toBeInTheDocument();

    // expand again
    fireEvent.click(screen.getByText(/suggested for you/i));
    expect(screen.getByText('Dream Team')).toBeInTheDocument();
  });

  it('calls /match/request when Request to Join is clicked', async () => {
    mockApiFetch
      .mockResolvedValueOnce(mockOkResponse({ suggestions: SUGGESTIONS }))
      .mockResolvedValueOnce(mockOkResponse({})); // request response

    render(<SuggestedTeams />);
    await waitFor(() => screen.getByText('Dream Team'));

    const buttons = screen.getAllByRole('button', { name: /request to join/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/match/request',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ teamId: 'team-1' }) })
      );
    });
  });

  it('does not fetch when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false } as ReturnType<typeof useAuth>);
    render(<SuggestedTeams />);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
