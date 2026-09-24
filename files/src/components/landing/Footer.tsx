import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { useHasActiveShopProducts } from "@/hooks/useHasActiveShopProducts";

/** TikTok logo in the same thin-outline style as lucide's Instagram and
 *  Facebook icons (lucide has no TikTok icon). Outline adapted from Tabler
 *  Icons (MIT). */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
    </svg>
  );
}

export function Footer() {
  // Only surface the shop once products are activated (see useHasActiveShopProducts).
  const hasShop = useHasActiveShopProducts();
  return <footer className="py-12 bg-background-dark border-t border-[hsl(0_0%_16%)]">
       <div className="container mx-auto px-4 flex flex-col items-center gap-6">
         {/* Brand */}
         <h2 className="font-display font-semibold text-2xl text-foreground">MyPet.Rocks</h2>
 
         {/* Social Icons */}
         <div className="flex items-center gap-4">
           <a href="https://www.instagram.com/mypetrocks/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
             <Instagram className="h-5 w-5" />
           </a>
           <a href="https://www.facebook.com/mypetrocksyall/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
             <Facebook className="h-5 w-5" />
           </a>
           <a href="https://www.tiktok.com/@mypet_rocks" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="TikTok">
             <TikTokIcon className="h-5 w-5" />
           </a>
         </div>
 
         {/* Navigation Links */}
         <nav className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-sm">
           {hasShop && <>
             <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
               Shop
             </Link>
             <span className="text-primary">•</span>
           </>}
           <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
             About
           </Link>
           <span className="text-primary">•</span>
           <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
             Privacy Policy
           </Link>
           <span className="text-primary">•</span>
           <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
             Terms of Service
           </Link>
           <span className="text-primary">•</span>
            <Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
              Cookies
            </Link>
            <span className="text-primary">•</span>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>
 
         {/* How the art is made — canon from the mythology bible: the AI
             disclosure is a trust signal, never fine print. */}
         <p className="max-w-md text-center text-sm text-muted-foreground">
           Made with AI from your photo. Styles designed by a human in Austin. You approve it before
           anything prints.
         </p>

         {/* Tagline */}
         <p className="text-sm text-[hsl(0_0%_50%)]">Made with ❤️ by 🦝🦝 in Austin, Texas</p>
 
         {/* Email */}
         <a href="mailto:woof@mypet.rocks" className="text-sm text-muted-foreground hover:text-primary transition-colors">
           woof@mypet.rocks
         </a>
 
         {/* Copyright */}
         <p className="text-xs text-[hsl(0_0%_38%)]">© 2026</p>
      </div>
     </footer>;
}