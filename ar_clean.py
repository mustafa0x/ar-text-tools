import regex
import sys

ar_digits = {ord(str(k)):v for k,v in enumerate(list('٠١٢٣٤٥٦٧٨٩'))}
en_digits = {ord(v): str(i) for i, v in enumerate('٠١٢٣٤٥٦٧٨٩')}

harakat_prep = lambda s: regex.sub(r'([ءأؤإئبةتثجحخدذرزسشصضطظعغفقكلمنهوىي])', r'\1[ً-ْ]*', s)
prep_honorific = lambda s: r'(\b| )([(ـ-] ?)?%s( ?[-ـ)])?(\b| )' % harakat_prep(s)
honorifics = [
    ('صلى الله عليه وسلم', 'ﷺ'),
    ('جل جلاله', 'ﷻ'),
    ('رحمه الله(?! تعالى)', '﵀'),
    ('رحمهم الله(?! تعالى)', '﵏'),
    ('عز وجل', '﷿'),
    ('عليه الصلاة والسلام', '﵊'),
    ('رضي الله عنهما', '﵄'),
    ('رضي الله عنهم(?! ورضوا)', '﵃'),
    ('رضي الله عنهن', '﵅'),
    ('رضي الله عنها', '﵂'),
    ('رضي الله عنه', '﵁'),
    ('سبحانه وتعالى(?! عما)', '﷾'),
    ('تبارك وتعالى', '﵎'),
    ('عليه السلام', '﵇'),
    ('عليها السلام', '﵍'),
    ('عليهم السلام', '﵈'),
    ('عليهما السلام', '﵉'),
    ('صلى الله عليه وآله وسلم', '﵌'),
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
    (1, r'\b(([وفبتَِ]*ا?)?لِ?ل)[َّ]+(?=ه[َُِ]?)\b', r'\1'),

    # Arabic punctuation
    (0, ';', '؛'),
    (0, ',', '،'),
    (0, '?', '؟'),

    # dash_fix
    (1, r' [ـ_] ', ' - '),

    # trailing spaces
    (1, r'(?m)[ \t]+$', ''),

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
    (1, r'(\b[وأ]َ|إِ|اَ|الْ|[أإ]نَّ\b|م[َِ]نْ\b)', lambda m: m.group(0)[:-1]),

    # حذف السكون على حرفي المد
    (1, r'(ِي|ُو)ْ', lambda m: m.group(0)[:-1]),

    # shaddah_order
    (1, r'([ً-ِْ])ّ', r'ّ\1'),

    # space after waaw
    (1, r'\b(وَ?) ', r'\1'),
]
arabic_repls_optional = [
    # Remove colon in ayah tag
    (1, r'(\[[ء-ْ ]{1,11}): ([\d٠-٩، -]+\])', r'\1 \2'),
    # semicolon_to_comma
    (1, r'[;؛]', '،'),
    # zwj, etc
    (1, r'[\u00AD\u200C-\u200F\u2063\uFE0F]', ''),
    # remove tatweel
    (0, 'ـ', ''),

    # double new line
    (1, r'\n\n+', '\n\n'),

    # clean_harakat
    (1, r'َ([اى])', r'\1'),

    # bad_harakah
    # Using two diacritics is sometimes intentional
    (1, r'[^ء-يیّٕٔۜۧۦۣ][ً-ْ]', 'bad harakah'),

    # Remove pause marks
    (1, r' *[ۘۙۖۗۚۛۜ]﴾', '﴾'),

    # small alif on ى
    (0, 'ىٰ', 'ى'),

    # eg هُمْ أهلي
    (r'([هك])ُمْ(?=\b)', r'\1م'),

    (0, '\r\n', '\n'),
]
url_en_nums = (r'http[^ \n]+', lambda m: m.group(0).translate(en_digits))

def apply_repls_remove_ayahs(text, repls=arabic_repls):
    # Remove ayahs from the text since different rules apply to it
    ayahs = []
    def remove_ayahs(m):
        ayahs.append(m.group(1))
        return '﴿ayah﴾'
    text = regex.sub(r'[{﴿](.*?)[﴾}]', remove_ayahs, text)
    for r in repls:
        text = regex.sub(r[1], r[2], text) if r[0] else text.replace(r[1], r[2])
    text = regex.sub(r'﴿ayah﴾', lambda m: '﴿%s﴾' % ayahs.pop(0), text)
    text = text.translate(ar_digits)
    text = regex.sub(*url_en_nums, text)
    return text

def apply_repls(text, repls=arabic_repls):
    for r in repls:
        text = regex.sub(r[1], r[2], text) if r[0] else text.replace(r[1], r[2])
    return text.translate(ar_digits)

if __name__ == '__main__':
    text = open(sys.argv[1]).read().strip()
    open(sys.argv[2], 'w').write(apply_repls(text))
