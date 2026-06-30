import re

with open('tailwind.config.ts', 'r') as f:
    config = f.read()

# Find the block of Stitch tokens
stitch_pattern = re.compile(r'// Stitch Tokens\n(.*?)fontFamily:', re.DOTALL)
match = stitch_pattern.search(config)
if not match:
    print("Could not find Stitch tokens")
    exit(1)

tokens_text = match.group(1)

# Extract key-value pairs
token_pattern = re.compile(r'"([^"]+)":\s*"([^"]+)",?')
tokens = token_pattern.findall(tokens_text)

# Generate new tailwind config lines
new_tailwind_lines = ["\t\t\t\t// Stitch Tokens"]
for key, val in tokens:
    new_tailwind_lines.append(f'\t\t\t\t"{key}": "var(--{key})",')

# Replace in config
new_tokens_text = "\n".join(new_tailwind_lines) + "\n\t\t\t},\n\t\t\t"
new_config = config.replace("// Stitch Tokens\n" + tokens_text, new_tokens_text)

with open('tailwind.config.ts', 'w') as f:
    f.write(new_config)

# Generate root css
root_css = "/* Stitch Tokens Light Mode */\n"
for key, val in tokens:
    root_css += f"  --{key}: {val};\n"

# Generate dark mode css (simple mappings)
def get_dark_color(key, val):
    if "surface-container-lowest" in key or "surface-bright" == key:
        return "#09090b"
    elif "surface-container-low" in key or "surface" == key:
        return "#18181b"
    elif "surface-container-high" in key or "surface-container" in key:
        return "#27272a"
    elif "surface-container-highest" in key:
        return "#3f3f46"
    elif "on-surface-variant" in key or "outline" in key:
        return "#a1a1aa" # visible grey
    elif "on-surface" in key or "foreground" in key or "on-background" in key:
        return "#fafafa" # white text
    elif "primary" == key or "primary-container" in key:
        return "#ef4444"
    elif "on-primary" in key:
        return "#ffffff"
    elif "surface-variant" in key:
        return "#27272a"
    elif "secondary-container" in key:
        return "#3f3f46"
    elif "success-bg" in key:
        return "#064e3b"
    elif "success-green" in key:
        return "#4ade80"
    return val # Fallback

dark_css = "  /* Stitch Tokens Dark Mode */\n"
for key, val in tokens:
    dark_css += f"  --{key}: {get_dark_color(key, val)};\n"

# Update globals.css
with open('app/globals.css', 'r') as f:
    css = f.read()

# Insert into :root
root_match = re.search(r':root\s*\{', css)
css = css[:root_match.end()] + "\n" + root_css + css[root_match.end():]

# Insert into .dark
dark_match = re.search(r'\.dark\s*\{', css)
if dark_match:
    css = css[:dark_match.end()] + "\n" + dark_css + css[dark_match.end():]
else:
    css += "\n.dark {\n" + dark_css + "}\n"

with open('app/globals.css', 'w') as f:
    f.write(css)

print("Colors fixed successfully!")
