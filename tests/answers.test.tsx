import { MotionConfig } from 'framer-motion';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AppProvider } from '@/store/AppContext';
import { AksGame } from '@/games/AksGame';

function saveState() {
  localStorage.setItem('farkash.state.v1', JSON.stringify({ settings: { lang: 'en', sound: false, speech: false }, sessions: [] }));
}

  it('blocks additional answers while showing feedback', async () => {
    saveState();
    render(<MotionConfig skipAnimations><AppProvider><AksGame onExit={() => {}} /></AppProvider></MotionConfig>);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    const answer = await screen.findByRole('button', { name: 'I run' }, { timeout: 3000 }) as HTMLButtonElement;
    fireEvent.click(answer);
    expect(answer.disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'I freeze' }) as HTMLButtonElement).disabled).toBe(true);
  });
