import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldsWallHero } from './WorldsWallHero';
import { HERO_WALL_IMAGES } from './heroWall';

const { clarityEvent, capture, toastError } = vi.hoisted(() => ({
  clarityEvent: vi.fn(),
  capture: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock('@/lib/clarity', () => ({ clarityEvent }));
vi.mock('@/lib/analytics', () => ({ capture }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));

function photo(bytes: number): File {
  const file = new File(['x'], 'pet.jpg', { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

function upload(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe('WorldsWallHero upload', () => {
  beforeEach(() => {
    clarityEvent.mockReset();
    capture.mockReset();
    toastError.mockReset();
  });

  it('names the upload button for screen readers', () => {
    render(<WorldsWallHero onGetStarted={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: "See your pet's portrait free: upload a photo" }),
    ).toBeInTheDocument();
  });

  it('hands a valid photo to the create flow and records the funnel events', async () => {
    const onGetStarted = vi.fn();
    const { container } = render(<WorldsWallHero onGetStarted={onGetStarted} />);
    const file = photo(2 * 1024 * 1024);
    upload(container, file);

    await waitFor(() => expect(onGetStarted).toHaveBeenCalledWith(file));
    expect(clarityEvent).toHaveBeenCalledWith('hero_upload_started');
    expect(capture).toHaveBeenCalledWith(
      'funnel_hero_upload_started',
      expect.objectContaining({ surface: 'hero' }),
    );
  });

  it('rejects a photo over 24MB without starting the flow', async () => {
    const onGetStarted = vi.fn();
    const { container } = render(<WorldsWallHero onGetStarted={onGetStarted} />);
    upload(container, photo(25 * 1024 * 1024));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Image must be less than 24MB'));
    expect(onGetStarted).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });
});

describe('WorldsWallHero wall', () => {
  it('drops the whole wall when every image fails, leaving the copy', () => {
    const { container } = render(<WorldsWallHero onGetStarted={vi.fn()} />);
    const imgs = () => container.querySelectorAll('figure img');
    expect(imgs().length).toBeGreaterThan(0);

    for (const src of new Set(HERO_WALL_IMAGES.map((i) => i.src))) {
      const img = container.querySelector(`figure img[src="${src}"]`);
      if (img) fireEvent.error(img);
    }

    expect(imgs()).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pause the wall/i })).toBeNull();
  });

  it('lets visitors pause and restart the moving wall', () => {
    render(<WorldsWallHero onGetStarted={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Pause the wall' });
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Play the wall' })).toHaveAttribute('aria-pressed', 'true');
  });
});
