import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PricingSection } from './PricingSection';
import { PACKAGES } from '@/lib/packages';

vi.mock('@/hooks/useSectionViewEvent', () => ({
  useSectionViewEvent: () => ({ current: null }),
}));

const price = (type: string) => PACKAGES.find((p) => p.type === type)!.price;

describe('PricingSection', () => {
  it('shows the same prices checkout charges', () => {
    render(<PricingSection />);
    // The first list is the price list (the size guide repeats some prices).
    const priceList = within(screen.getAllByRole('list')[0]);
    expect(priceList.getByText(`from $${price('canvas-print')}`)).toBeInTheDocument();
    expect(priceList.getByText(`$${price('poster-print')}`)).toBeInTheDocument();
    expect(priceList.getByText(`$${price('digital-only')}`)).toBeInTheDocument();
  });

  it('never shows a broken "$undefined" price', () => {
    const { container } = render(<PricingSection />);
    expect(container.textContent).not.toMatch(/undefined/);
  });

  it('includes the free sticker pack and the size guide', () => {
    render(<PricingSection />);
    expect(screen.getByText('Every order comes with a free sticker pack.')).toBeInTheDocument();
    expect(screen.getByText('How big is it, really?')).toBeInTheDocument();
  });
});
