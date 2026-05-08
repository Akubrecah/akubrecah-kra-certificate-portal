import os
import re

files_to_fix = [
    'app/file/components/IndividualFileSteps.tsx',
    'app/file/components/CompanyObligationSelector.tsx',
    'app/file/components/Step3Payment.tsx',
    'app/file/components/Step4Filing.tsx',
    'app/file/components/Step2Details.tsx',
    'app/file/components/Step1PIN.tsx'
]

replacements = {
    r'bg-white/50': 'bg-background/50',
    r'bg-white/95': 'bg-background/95',
    r'bg-white/80': 'bg-background/80',
    r'\bbg-white\b(?!/10)': 'bg-background', # avoiding bg-white/10 which might be used as an overlay
    r'text-gray-900': 'text-foreground',
    r'text-gray-800': 'text-foreground',
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
    
    r'bg-red-50/50': 'bg-destructive/10',
    r'bg-red-50/10': 'bg-destructive/5',
    r'bg-red-50/30': 'bg-destructive/10',
    r'\bbg-red-50\b': 'bg-destructive/10',
    r'\bbg-red-100\b': 'bg-destructive/20',
    r'border-red-100': 'border-destructive/30',
    r'border-red-200': 'border-destructive/30',
    r'text-red-900': 'text-destructive',
    r'text-red-800': 'text-destructive',
    r'text-red-700': 'text-destructive',
    r'text-red-600': 'text-destructive',
    r'text-red-500': 'text-destructive',
    r'\bbg-red-500\b': 'bg-destructive',
}

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
        
    content = content.replace('bg-white/10', 'bg-foreground/10')
    content = content.replace('text-black', 'text-foreground')
    # Be careful with bg-black, some might be gradients or overlays, but let's just do bg-foreground
    content = content.replace('bg-black ', 'bg-foreground ')
    content = content.replace('bg-black/', 'bg-foreground/')
    content = content.replace('bg-black"', 'bg-foreground"')
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
