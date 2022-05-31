import regex
import sys

ar_digits = {ord(str(k)):v for k,v in enumerate(list('٠١٢٣٤٥٦٧٨٩'))}

harakat_prep = lambda s: regex.sub(r'([ءأؤإئبةتثجحخدذرزسشصضطظعغفقكلمنهوىي])', r'\1[ً-ْ]*', s)
prep_honorific = lambda s: r'\b([(ـ-] ?)?%s( ?[-ـ)])?\b' % harakat_prep(s)
honorifics = [
    ('صلى الله عليه وسلم', r'ﷺ'),
    ('رحمه الله', '\uFD40'),
    ('رحمهم الله', '\uFD4F'),
    ('عز وجل', '\uFDFF'),
    ('عليه الصلاة والسلام', '\uFD4A'),
    ('رضي الله عنهم', '\uFD43'),
    ('رضي الله عنهن', '\uFD45'),
    ('رضي الله عنها', '\uFD42'),
    ('رضي الله عنهما', '\uFD44'),
    ('رضي الله عنه', '\uFD41'),
    ('سبحانه وتعالى', '\uFDFE'),
    ('تبارك وتعالى', '\uFD4E'),
    ('عليه السلام', '\uFD47'),
    ('عليها السلام', '\uFD4D'),
    ('عليهم السلام', '\uFD48'),
    ('عليهما السلام', '\uFD49'),
    ('صلى الله عليه وآله وسلم', '\uFD4C'),
]
honorifics = [(1, prep_honorific(a), b) for a, b in honorifics]

harakaat = 'ًٌٍَُِّ'
arabic_repls = honorifics + [
    (1, r'؟\.', '؟'),
    (1, r'؟؟+', '؟'),
    (1, r'!!+', '!'),

    # ١٢٣ه, (ت: ٢٠٠)
    (1, r'([٠-٩]+) ?هـ?([ .]|$)', r'\1 هـ\2'),
    (1, r'\(ت:? ?([٠-٩]+)\)', r'(ت \1)'),

    # Duplicate harakaat
    (1, '|'.join([h + h for h in harakaat]), lambda m: m.group(0)[0]),

    # Remove harakaat from لفظ الجلالة
    (1, r'\b([وفبتُِ]*ا?)?لل[َّ]+ه([َُِ]?)\b', r'\1لله\2'),

    # Arabic punctuation
    (0, ';', '؛'),
    (0, ',', '،'), (0, '?', '؟'),
    # semicolon_to_comma
    (1, r'[;؛]', '،'),

    # Remove colon in ayah tag
    (1, r'(\[[ء-ْ ]{1,11}): ([\d٠-٩، -]+\])', r'\1 \2'),

    # dash_fix
    (1, r' [ـ_] ', ' - '),

    # trailing spaces
    (1, r'[ \t]+\n', '\n'),

    (1, r'\(\(([\s\S]*?)\)\)', r'«\1»'),
    (1, r'"(.*?)"', r'«\1»'),
    (1, r'\{(.*?)\}', r'﴿\1﴾'),

    # Remove space (and add joiner) between وفكبل and paren
    (1, r'([^\w][وفكبل][َِ]?ـ?) ?([(«‹﴾”])', lambda m: m.group(1) + ('ـ' if not regex.search('[وـ]', m.group(1)) else '') + m.group(2)),

    # عبدالله ➔ عبد الله
    (1, r'\b(عَ?بْ?د[َُِ]?)(ال)', r'\1 \2'),

    # spaces
    (1, r' +([\]\)﴾»،؟:؛\n])', r'\1'),
    (1, r'([\[﴿«(]) +', r'\1'),

    # period_space
    (1, r' +\.(?!\.)', '.'),

    # tanween_fath
    (0, 'اً', 'ًا'),
    (1, r'(([^ء-ْ]|^)[وأ]َ)|إِ|اَ|الْ|[أإ]نَّ|م[َِ]نْ', lambda m: m.group(0)[:-1]),

    # حذف السكون على حرفي المد
    (1, r'(ِي|ُو)ْ', lambda m: m.group(0)[:-1]),

    # shaddah_order
    (1, r'([ً-ِْ])ّ', r'ّ\1'),

    # space after waaw
    (1, r'\b(وَ?) ', r'\1'),
]
arabic_repls_optional = [
    # zwj, etc
    (1, r'[\u00AD\u200C-\u200F\u2063\uFE0F]', ''),
    # remove tatweel
    (0, 'ـ', ''),

    # double new line
    (1, r'\n\n+', '\n\n'),

    # clean_harakat
    (1, r'َ([اى])', r'\1'), # disabled TEMP

    # bad_harakah
    (1, r'[^ء-يّٕیٔ][ً-ْ]', ''),

    # Remove pause marks
    (1, r' *[ۘۙۖۗۚۛۜ]﴾', '﴾'),

    # small alif on ى
    (0, 'ىٰ', 'ى'),

    # eg هُمْ أهلي
    (r'([هك])ُمْ(?=\b)', r'\1م'),

    (0, '\r\n', '\n'),
]

def apply_repls_remove_ayahs(text, repls=arabic_repls):
    # Remove ayahs from the text since different rules apply to it
    ayahs = []
    def remove_ayahs(m):
        ayahs.append(m.group(1))
        return '﴿ayah﴾'
    text = re.sub(r'﴿(.*?)﴾', remove_ayahs, text)
    for r in repls:
        text = regex.sub(r[1], r[2], text) if r[0] else text.replace(r[1], r[2])
    text = re.sub(r'﴿ayah﴾', lambda m: '﴿%s﴾' % ayahs.pop(0), text)
    return text.translate(ar_digits)

def apply_repls(text, repls=arabic_repls):
    for r in repls:
        text = regex.sub(r[1], r[2], text) if r[0] else text.replace(r[1], r[2])
    return text.translate(ar_digits)

if __name__ == '__main__':
    text = open(sys.argv[1]).read().strip()
    open(sys.argv[2], 'w').write(apply_repls(text))
