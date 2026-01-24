
import os
import re

pages_dir = 'pages'
refactored_markers = [
    r'rounded-\[[0-9][0-9]px\]',
    r'accent-gold',
     r'shadow-hug',
    r'bg-background-',
    r'font-display',
    r'premium-',
    r'animate-reveal'
]

legacy_markers = [
    r'gray-100',
    r'gray-200',
    r'gray-300',
    r'gray-400',
    r'gray-500',
    r'rounded-2xl(?! px)',
    r'shadow-sm',
    r'bg-gray-50'
]

def audit_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    score = 0
    ref_matches = []
    for marker in refactored_markers:
        if re.search(marker, content):
            score += 1
            ref_matches.append(marker)
            
    leg_matches = []
    for marker in legacy_markers:
        if re.search(marker, content):
            score -= 0.5
            leg_matches.append(marker)
            
    # Specific detection for the big rounded corners used in the WOW design
    if 'rounded-[40px]' in content or 'rounded-[48px]' in content or 'rounded-[56px]' in content:
        score += 2

    # Status determination
    if score >= 3:
        return "Refatorada (WOW)", score
    elif score > 0:
        return "Parcialmente Refatorada", score
    else:
        return "Legada (Padrão)", score

results = []
for filename in os.listdir(pages_dir):
    if filename.endswith('.tsx'):
        filepath = os.path.join(pages_dir, filename)
        status, score = audit_file(filepath)
        results.append((filename, status, score))

# Sort by status and then name
results.sort(key=lambda x: (x[1], x[0]))

print("| Página | Status | Score |")
print("| :--- | :--- | :--- |")
for name, status, score in results:
    print(f"| {name} | {status} | {score} |")
