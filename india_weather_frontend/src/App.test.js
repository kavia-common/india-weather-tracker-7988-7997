import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header brand', () => {
  render(<App />);
  const brandTitle = screen.getByText(/India Weather/i);
  expect(brandTitle).toBeInTheDocument();
});

test('renders refresh button', () => {
  render(<App />);
  const button = screen.getByRole('button', { name: /refresh/i });
  expect(button).toBeInTheDocument();
});
