import os
import glob
import re

files = glob.glob('d:/Repositório_Pessoal/SaaS Projects/Neonorte/Neonorte/kurupira/frontend/src/**/*.ts', recursive=True)
files.extend(glob.glob('d:/Repositório_Pessoal/SaaS Projects/Neonorte/Neonorte/kurupira/frontend/src/**/*.tsx', recursive=True))

for file in files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        continue

    original = content
    
    # 1. m.quantity -> 1 (for multipliers)
    content = re.sub(r'm\.quantity\s*\*\s*m\.(power|area|weight|voc)', r'm.\1', content)
    content = re.sub(r'm\.(power|area|weight|voc)\s*\*\s*m\.quantity', r'm.\1', content)
    # With defaults: ((m.area || 2) * m.quantity)
    content = re.sub(r'\(\(m\.(power|area|weight|voc)\s*\|\|\s*([\d\.]+)\)\s*\*\s*m\.quantity\)', r'(m.\1 || \2)', content)
    content = re.sub(r'\(m\.(power|area|weight|voc)\s*\|\|\s*([\d\.]+)\)\s*\*\s*m\.quantity', r'(m.\1 || \2)', content)

    # 2. Simple accumulators: reduce((acc, m) => acc + m.quantity, 0)
    content = re.sub(r'(\w+)\.reduce\(\(\w+,\s*m\)\s*=>\s*\w+\s*\+\s*m\.quantity,\s*0\)', r'\1.length', content)
    content = re.sub(r'(\w+)\.reduce\(\(\w+,\s*m\)\s*=>\s*\w+\s*\+\s*\(m\.quantity\s*\|\|\s*0\),\s*0\)', r'\1.length', content)

    # 3. Handle ProposalBOMCard and TechnicalForm hardcodes manually if needed, but let's try to ignore `{m.quantity}` for now, 
    # since those components might iterate over unique models, not instances, or need grouping.

    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
