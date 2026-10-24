import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from './HeroSection';

function renderNavBar(stats?: { teams?: number; participants?: number; mentors?: number }) {
  return render(
    <MemoryRouter>
      <NavBar stats={stats} />
    </MemoryRouter>,
  );
}

describe('NavBar', () => {
  it('renders the JUNCTION wordmark', () => {
    renderNavBar();
    expect(screen.getByText('JUNCTION')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    renderNavBar();
    expect(screen.getByText('Team Map')).toBeInTheDocument();
    expect(screen.getByText('Mentors')).toBeInTheDocument();
    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('nav links point to correct paths', () => {
    renderNavBar();
    const teamMapLink = screen.getByText('Team Map').closest('a');
    const mentorsLink = screen.getByText('Mentors').closest('a');
    const matchesLink = screen.getByText('Matches').closest('a');
    const profileLink = screen.getByText('Profile').closest('a');
    expect(teamMapLink).toHaveAttribute('href', '/map/teams');
    expect(mentorsLink).toHaveAttribute('href', '/map/mentors');
    expect(matchesLink).toHaveAttribute('href', '/matches');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('shows team count in stats when teams > 0', () => {
    renderNavBar({ teams: 12 });
    expect(screen.getByText('12 teams')).toBeInTheDocument();
  });

  it('shows participants count in stats when participants > 0', () => {
    renderNavBar({ participants: 99 });
    expect(screen.getByText('99 hackers')).toBeInTheDocument();
  });

  it('shows mentors count in stats when mentors > 0', () => {
    renderNavBar({ mentors: 7 });
    expect(screen.getByText('7 mentors')).toBeInTheDocument();
  });

  it('hides stats section when no stats provided', () => {
    renderNavBar();
    expect(screen.queryByText(/teams/)).toBeNull();
    expect(screen.queryByText(/hackers/)).toBeNull();
    expect(screen.queryByText(/mentors/)).toBeNull();
  });

  it('hides zero-value stats', () => {
    renderNavBar({ teams: 0, participants: 0, mentors: 0 });
    expect(screen.queryByText('0 teams')).toBeNull();
    expect(screen.queryByText('0 hackers')).toBeNull();
    expect(screen.queryByText('0 mentors')).toBeNull();
  });
});
