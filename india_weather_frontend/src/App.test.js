import { render, screen } from '@testing-library/react';
import RootRouter from './RootRouter';

test('renders header brand', () => {
  render(<RootRouter />);
  const brandTitle = screen.getByText(/India Weather/i);
  expect(brandTitle).toBeInTheDocument();
});

test('renders refresh button on home', () => {
  render(<RootRouter />);
  const button = screen.getByRole('button', { name: /refresh/i });
  expect(button).toBeInTheDocument();
});
