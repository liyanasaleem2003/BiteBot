import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BiteBot title', () => {
  render(<App />);
  const titleElement = screen.getByText(/BiteBot/i);
  expect(titleElement).toBeInTheDocument();
});
