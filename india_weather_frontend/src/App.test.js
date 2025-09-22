import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RootRouter from './RootRouter';

test('renders header brand', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <RootRouter />
    </MemoryRouter>
  );
  const brandTitle = screen.getByText(/India Weather/i);
  expect(brandTitle).toBeInTheDocument();
});

test('renders refresh button on home', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <RootRouter />
    </MemoryRouter>
  );
  const button = screen.getByRole('button', { name: /refresh/i });
  expect(button).toBeInTheDocument();
});
