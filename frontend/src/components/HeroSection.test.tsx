import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from './HeroSection';

function renderHero(props = { totalTeams: 5, totalParticipants: 42, totalMentors: 8 }) {
  return render(
    <MemoryRouter>
      <HeroSection {...props} />
    </MemoryRouter>,
  );
}

describe('HeroSection', () => {
  it('renders the hackathon title', () => {
    renderHero();
    expect(screen.getByText('Junction Hackathon')).toBeInTheDocument();
  });

  it('shows Tampere University campus label', () => {
    renderHero();
    expect(screen.getByText(/Tampere University/)).toBeInTheDocument();
  });

  it('displays stat cards with correct values', () => {
    renderHero({ totalTeams: 12, totalParticipants: 99, totalMentors: 7 });
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('displays stat labels', () => {
    renderHero();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Hackers')).toBeInTheDocument();
    expect(screen.getByText('Mentors')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    renderHero();
    expect(screen.getByText('Team Map')).toBeInTheDocument();
    expect(screen.getByText('Mentor Map')).toBeInTheDocument();
    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('shows zero counts without crashing', () => {
    renderHero({ totalTeams: 0, totalParticipants: 0, totalMentors: 0 });
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });

  it('nav links point to correct paths', () => {
    renderHero();
    const teamMapLink = screen.getByText('Team Map').closest('a');
    const mentorMapLink = screen.getByText('Mentor Map').closest('a');
    const matchesLink = screen.getByText('Matches').closest('a');
    const profileLink = screen.getByText('Profile').closest('a');
    expect(teamMapLink).toHaveAttribute('href', '/map/teams');
    expect(mentorMapLink).toHaveAttribute('href', '/map/mentors');
    expect(matchesLink).toHaveAttribute('href', '/matches');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });
});
