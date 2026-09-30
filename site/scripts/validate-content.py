"""Content checks for every active lecture. Run from site/: python3 scripts/validate-content.py

Checks index freshness, IDs, answer keys, modules, grammar terms, activities,
textbook pages, extra steps, review phrases, unplanned questions and mission plans."""
import json,glob,re,sys
files=sorted(glob.glob('content/lectures/lecture-[0-9][0-9].json'))
L=sorted((json.load(open(f)) for f in files), key=lambda l:l['number'])
idx=json.load(open('content/lectures/index.json'))
errs=[]
if idx!=L: errs.append('index.json is stale')
mods=json.load(open('content/modules.json'))
allq=set(); allw=set()
gloss={t['id'] for t in json.load(open('content/grammar-terms.json'))['terms']}
for l in L:
    for tid in l.get('grammarTerms',[]):
        if tid not in gloss: errs.append(f"{l['number']}: unknown grammar term {tid}")
for l in L:
    n=l['number']
    if not any(m['first']<=n<=m['last'] for m in mods['modules']): errs.append(f'{n}: no module')
    if len(mods['titles'])<n: errs.append(f'{n}: no title')
    for k in ('recall','guided','checkpoint'):
        for q in l[k]:
            if q['id'] in allq: errs.append('dup q '+q['id'])
            allq.add(q['id'])
            if q.get('options') and not all(a in q['options'] for a in q['answers']): errs.append('answer not in options '+q['id'])
    for w in l['practice']['words']:
        if w['id'] in allw: errs.append('dup word '+w['id'])
        allw.add(w['id'])
    titles=[s['title'] for s in l['sections']]
    t=l.get('presentation',{}).get('teaching',{})
    for lp in t.get('livePractice',[]):
        if lp['sectionTitle'] not in titles: errs.append(f'{n}: livePractice missing '+lp['sectionTitle'])
    b=t.get('builder')
    if b and b['sectionTitle'] not in titles: errs.append(f'{n}: builder section missing')
    for s in l['sections']:
      for a in ([s['activity']] if s.get('activity') else [])+s.get('activities',[]):
        if a['type']=='question-gap':
            if a['answerer'] not in ('Alex','Elin','Henrik','Maja'): errs.append(f'{n}: bad answerer')
            for g in a['gaps']:
                if g['answer'] not in g['options']: errs.append(f"{n}: gap answer not in options {g['field']}")
                if len(set(g['options']))!=len(g['options']): errs.append(f"{n}: dup gap option")
        if a['type']=='sort':
            ids={x['id'] for x in a['buckets']}
            for it in a['items']:
                if it['bucket'] not in ids: errs.append(f'{n}: bad bucket '+it['fi'])
                if it.get('mark') and it['mark'].lower() not in it['fi'].lower(): errs.append(f'{n}: mark '+it['fi'])
        if a['type']=='match':
            if len({p['left'] for p in a['pairs']})!=len(a['pairs']): errs.append(f'{n}: dup left')
        if a['type']=='sound-map':
            f={x['id'] for x in a.get('features',[])}
            for so in a['sounds']:
                for x in so.get('features',[]):
                    if x not in f: errs.append(f'{n}: bad feature')
    op=l.get('presentation',{}).get('opening',{})
    rp=l.get('reviewPhrases',[])
    if len({x['id'] for x in rp})!=len(rp): errs.append(f'{n}: duplicate review phrase id')
    for x in rp:
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,40}',x['id']) or not x['en'].strip() or not x['fi'].strip(): errs.append(f"{n}: bad review phrase {x.get('id')}")
    uq=l.get('unplannedQuestions',[])
    if uq and len(uq)<3: errs.append(f'{n}: unplannedQuestions needs at least 3 questions')
    if len({x['id'] for x in uq})!=len(uq): errs.append(f'{n}: duplicate unplanned question id')
    for x in uq:
        if not (x['fi'].strip().endswith('?') and x['en'].strip() and x['sample'].strip()): errs.append(f"{n}: bad unplanned question {x.get('id')}")
    mp=l.get('missionPlan')
    if mp:
        for ln in mp['lines']:
            if not ln['label'].strip() or not ln['placeholder'].strip(): errs.append(f'{n}: mission plan line missing label/placeholder')
    if 'sourcePractice' in op or 'sourcePractices' in op: errs.append(f'{n}: textbook pages belong in extraSteps now')
    parts=['recall','teach','guided','practice','check','assignment']
    steps=l.get('extraSteps',[])
    if len({st['id'] for st in steps})!=len(steps): errs.append(f'{n}: duplicate extra step id')
    pages=[]
    for st in steps:
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,60}',st['id']): errs.append(f"{n}: bad extra step id {st['id']}")
        if st['after'] not in parts: errs.append(f"{n}: extra step {st['id']} follows unknown part {st['after']}")
        if st['kind'] not in ('source-practice',): errs.append(f"{n}: unknown extra step kind {st['kind']}")
        if not (isinstance(st['minutes'],int) and 1<=st['minutes']<=60): errs.append(f"{n}: extra step minutes {st['id']}")
        for k in ('label','description','action'):
            if not st.get(k,'').strip(): errs.append(f"{n}: extra step {st['id']} missing {k}")
        if st['kind']=='source-practice':
            if not st.get('pages'): errs.append(f"{n}: extra step {st['id']} has no pages")
            pages+=st.get('pages',[])
    for sp in pages:
        import os
        if not os.path.exists('public'+sp['image']): errs.append('missing image '+sp['image'])
        if len(sp['recallCues'])!=len(sp['lines']): errs.append(f"{n}: cue count {sp['title']}")
        for line in sp['lines']:
            if line['voice'] not in ('Alex','Elin','Henrik','Maja'): errs.append('bad voice '+line['voice'])
        for q in sp.get('listenQuestions',[]):
            if not 0<=q['answer']<len(q['options']): errs.append('bad listen answer')
        bc=sp.get('backchain')
        if bc:
            line=sp['lines'][bc['line']]['fi'].lower()
            for c in bc['chunks']:
                if c.lower().rstrip('.') not in line: errs.append(f'{n}: chunk not in line: '+c)
        toks={re.sub(r'[^\w]','',t).lower() for li in sp['lines'] for t in li['fi'].split()}
        for spot in sp.get('hunt',{}).get('spots',[]):
            if spot['word'].lower() not in toks: errs.append(f"{n}: spot not on page "+spot['word'])
            if spot['mark'].lower() not in spot['word'].lower(): errs.append(f"{n}: spot mark "+spot['word'])
print('lectures:',[l['number'] for l in L],'errors:',errs)
sys.exit(1 if errs else 0)
