	import type { Config } from "tailwindcss";

	const config: Config = {
		darkMode: ["class"],
		content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				brand: {
					red: 'hsl(var(--brand-red) / <alpha-value>)',
					cyan: {
						DEFAULT: 'hsl(var(--brand-cyan) / <alpha-value>)',
						dark: 'hsl(var(--brand-cyan-dark) / <alpha-value>)',
					},
					green: 'hsl(var(--brand-green) / <alpha-value>)',
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
								// Stitch Tokens
				"secondary-fixed-dim": "var(--secondary-fixed-dim)",
				"on-surface-variant": "var(--on-surface-variant)",
				"on-secondary": "var(--on-secondary)",
				"tertiary-fixed": "var(--tertiary-fixed)",
				"on-primary-container": "var(--on-primary-container)",
				"surface-variant": "var(--surface-variant)",
				"success-green": "var(--success-green)",
				"inverse-surface": "var(--inverse-surface)",
				"error-container": "var(--error-container)",
				"primary-fixed": "var(--primary-fixed)",
				"surface-container-high": "var(--surface-container-high)",
				"primary-container": "var(--primary-container)",
				"surface-container-highest": "var(--surface-container-highest)",
				"on-secondary-container": "var(--on-secondary-container)",
				"primary-fixed-dim": "var(--primary-fixed-dim)",
				"on-tertiary-container": "var(--on-tertiary-container)",
				"error": "var(--error)",
				"on-tertiary": "var(--on-tertiary)",
				"on-tertiary-fixed": "var(--on-tertiary-fixed)",
				"surface-dim": "var(--surface-dim)",
				"on-primary-fixed": "var(--on-primary-fixed)",
				"outline-muted": "var(--outline-muted)",
				"on-tertiary-fixed-variant": "var(--on-tertiary-fixed-variant)",
				"surface-bright": "var(--surface-bright)",
				"outline-variant": "var(--outline-variant)",
				"tertiary-container": "var(--tertiary-container)",
				"on-primary-fixed-variant": "var(--on-primary-fixed-variant)",
				"inverse-primary": "var(--inverse-primary)",
				"success-bg": "var(--success-bg)",
				"on-error": "var(--on-error)",
				"outline": "var(--outline)",
				"on-primary": "var(--on-primary)",
				"tertiary": "var(--tertiary)",
				"on-secondary-fixed": "var(--on-secondary-fixed)",
				"secondary-fixed": "var(--secondary-fixed)",
				"surface-container-low": "var(--surface-container-low)",
				"surface-tint": "var(--surface-tint)",
				"surface-container": "var(--surface-container)",
				"on-background": "var(--on-background)",
				"surface-container-lowest": "var(--surface-container-lowest)",
				"on-surface": "var(--on-surface)",
				"surface": "var(--surface)",
				"on-error-container": "var(--on-error-container)",
				"secondary-container": "var(--secondary-container)",
				"on-secondary-fixed-variant": "var(--on-secondary-fixed-variant)",
				"inverse-on-surface": "var(--inverse-on-surface)",
			},
			fontFamily: {
				sans: ['var(--font-inter)'],
				heading: ['var(--font-alfa)'],
				script: ['var(--font-satisfy)'],
				"label-md": ["Inter"],
				"display-lg": ["Inter"],
				"title-lg": ["Inter"],
				"body-lg": ["Inter"],
				"label-sm": ["Inter"],
				"headline-md": ["Inter"],
				"body-sm": ["Inter"],
				"headline-lg": ["Inter"],
				"body-md": ["Inter"],
				"headline-lg-mobile": ["Inter"]
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'var(--radius)',
				sm: 'var(--radius)',
				DEFAULT: 'var(--radius)',
				xl: 'var(--radius)',
				'2xl': 'var(--radius)',
				'3xl': 'var(--radius)'
			},
			spacing: {
				"stack-lg": "24px",
				"stack-sm": "8px",
				"gutter": "24px",
				"margin-mobile": "16px",
				"margin-desktop": "40px",
				"stack-md": "16px",
				"container-max": "1280px",
				"unit": "4px"
			},
			fontSize: {
				"label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500" }],
				"display-lg": ["48px", { "lineHeight": "60px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
				"title-lg": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
				"body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
				"label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
				"headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
				"body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
				"headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
				"body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
				"headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }]
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'blob': {
					"0%": {
						transform: "translate(0px, 0px) scale(1)",
					},
					"33%": {
						transform: "translate(30px, -50px) scale(1.1)",
					},
					"66%": {
						transform: "translate(-20px, 20px) scale(0.9)",
					},
					"100%": {
						transform: "translate(0px, 0px) scale(1)",
					},
				},
				'gradient': {
					"0%, 100%": {
						"background-size": "200% 200%",
						"background-position": "left center",
					},
					"50%": {
						"background-size": "200% 200%",
						"background-position": "right center",
					},
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'bounce-slow': 'bounce 2s infinite',
				'blob': 'blob 7s infinite',
				'gradient': 'gradient 8s linear infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
	};
	export default config;
