import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';
it('opens the signed-out authentication flow without a stored credential', async () => {
  await render(<App />);
  expect(await screen.findByText('A clearer day\nstarts here.')).toBeTruthy();
  expect(screen.getByLabelText('Email')).toBeTruthy();
});
