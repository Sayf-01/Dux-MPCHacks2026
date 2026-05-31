import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';

describe('Home page', () => {
  test('renders hero heading and key UI elements', () => {
    render(<Home />);

    // Hero heading
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Plan the trip/i);

    // Accent pill text
    expect(screen.getByText(/AI Itineraries, Hand-Built Feel/i)).toBeInTheDocument();

    // Sign in button in header
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });
});
