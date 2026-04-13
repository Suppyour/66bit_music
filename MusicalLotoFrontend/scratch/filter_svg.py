with open('src/assets/Готовы начать.svg', 'r', encoding='utf-8') as f:
    lines = f.readlines()
filtered = lines[:5] + [lines[6]] + lines[11:]
with open('src/assets/CtaBg.svg', 'w', encoding='utf-8') as f:
    f.writelines(filtered)
