import { render, screen } from '@testing-library/react';
import RootRouter from './RootRouter';

// RootRouter internally uses BrowserRouter. Do not wrap it with MemoryRouter.
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
