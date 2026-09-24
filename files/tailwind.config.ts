import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				display: ['Cormorant Garamond', 'serif'],
				sans: ['DM Sans', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				'border-strong': 'hsl(var(--border-strong))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				'background-dark': 'hsl(var(--background-dark))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				gold: 'hsl(var(--primary))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				// v3 fix F7: scale-in and fade-in-scale were duplicate keyframes
				// (both opacity 0→1 + scale 0.95→1). Collapsed into one keyframe;
				// the two animation names below differ only in duration.
				'fade-in-scale': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-6px)' }
				},
				'subtle-float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-3px)' }
				},
				// Slow drift on the active hero slide — barely perceptible, resets
				// each rotation. Duration outlasts the slide dwell so it never ends
				// on-screen. Gated behind motion-safe: at the call site.
				'hero-kenburns': {
					from: { transform: 'scale(1)' },
					to: { transform: 'scale(1.055)' }
				},
				// Worlds-wall hero: each strip holds its tiles twice and each tile
				// has its own trailing margin (no gap), so the halves are equal and
				// sliding by exactly half loops seamlessly.
				'worlds-up': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(-50%)' }
				},
				'worlds-down': {
					from: { transform: 'translateY(-50%)' },
					to: { transform: 'translateY(0)' }
				},
				'worlds-left': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-50%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out forwards',
				// Both names point at the same fade-in-scale keyframe; only the
				// duration differs. Keeps the existing class names callable.
				'scale-in': 'fade-in-scale 0.3s ease-out forwards',
				'fade-in-scale': 'fade-in-scale 0.6s ease-out forwards',
				'float': 'float 2s ease-in-out infinite',
				'subtle-float': 'subtle-float 6s ease-in-out infinite',
				'hero-kenburns': 'hero-kenburns 9s ease-out forwards',
				'worlds-up': 'worlds-up 70s linear infinite',
				'worlds-down': 'worlds-down 80s linear infinite',
				'worlds-left': 'worlds-left 90s linear infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
