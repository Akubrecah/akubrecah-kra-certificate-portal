import os
import glob
import re

files_to_fix = glob.glob('components/admin/**/*.tsx', recursive=True) + glob.glob('components/admin/*.tsx', recursive=True)

replacements = {
    r'bg-white/50': 'bg-background/50',
    r'bg-white/95': 'bg-background/95',
    r'bg-white/80': 'bg-background/80',
    r'\bbg-white\b(?!/10)': 'bg-background',
    r'text-gray-900': 'text-foreground',
    r'text-gray-800': 'text-foreground',
    r'text-gray-700': 'text-muted-foreground',
    r'text-gray-600': 'text-muted-foreground',
    r'text-gray-500': 'text-muted-foreground',
    r'text-gray-400': 'text-muted-foreground',
    r'text-gray-300': 'text-muted-foreground/50',
    r'border-gray-100': 'border-border',
    r'border-gray-200': 'border-border',
    r'border-white/20': 'border-border',
    r'border-white/10': 'border-border',
    r'border-white/40': 'border-border',
    r'bg-gray-50/50': 'bg-secondary/50',
    r'\bbg-gray-50\b': 'bg-secondary',
    r'bg-gray-100/50': 'bg-secondary/50',
    r'\bbg-gray-100\b': 'bg-secondary',
    r'\bbg-gray-200\b': 'bg-secondary',
}

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
