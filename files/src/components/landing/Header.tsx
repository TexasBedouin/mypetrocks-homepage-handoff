import type { MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useHasActiveShopProducts } from '@/hooks/useHasActiveShopProducts';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

// Homepage sections the header can jump to. The ids live on the sections
// themselves (StyleGallerySection, FearSection, PricingSection).
const SECTION_LINKS = [
  { id: 'worlds', label: 'The 15 worlds' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'prices', label: 'Prices' },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  // On the homepage, scroll smoothly to the section; from any other page, go
  // home with the #hash and let Index scroll once the section has rendered.
  function goToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `/#${id}`);
    } else {
      navigate(`/#${id}`);
    }
  }
  const {
    user,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useAdmin();
  // Only surface the shop once products are activated (see useHasActiveShopProducts).
  const hasShop = useHasActiveShopProducts();
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        {/* Wordmark + category descriptor: answers "what site is this?" on
            every page, not just the homepage hero. */}
        <Link
          to="/"
          className="flex flex-col leading-none hover:opacity-80 transition-opacity"
        >
          <span className="text-xl font-bold text-foreground">MyPet.Rocks</span>
          <span className="mt-0.5 whitespace-nowrap font-display text-base italic leading-none text-primary sm:text-xl">
            Joy only pet parents understand.
          </span>
        </Link>
        
        {/* Nav + Auth Section */}
        <div className="flex items-center gap-2">
          {/* Section links: large screens only (phones keep just Shop + Sign In). */}
          <nav aria-label="Homepage sections" className="hidden items-center gap-1 lg:flex">
            {SECTION_LINKS.map((link) => (
              <a
                key={link.id}
                href={`/#${link.id}`}
                onClick={(event) => goToSection(event, link.id)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/85 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
          {hasShop && <Link to="/shop">
              <Button variant="ghost" size="sm" className="font-medium">
                Shop
              </Button>
            </Link>}

          {user ? <>
            <Link to="/downloads">
              <Button variant="ghost" size="sm">
                Your Collection
              </Button>
            </Link>

            {isAdmin && <Link to="/admin">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>}

            <Button variant="ghost" size="icon" onClick={signOut} className="h-10 w-10 text-muted-foreground hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </> : <Link to="/auth">
            <Button variant="ghost" size="sm" className="font-medium">
              Sign In
            </Button>
          </Link>}
        </div>
      </div>
    </header>;
}