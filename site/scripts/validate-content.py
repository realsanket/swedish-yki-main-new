"""Content checks for every active lecture. Run from site/: python3 scripts/validate-content.py

Checks index freshness, IDs, answer keys, modules, grammar terms, activities,
textbook pages, extra steps, review phrases, unplanned questions and mission plans."""
import json,glob,re,sys,os
files=sorted(glob.glob('content/lectures/lecture-[0-9][0-9].json'))
L=sorted((json.load(open(f)) for f in files), key=lambda l:l['number'])
idx=json.load(open('content/lectures/index.json'))
errs=[]
if idx!=L: errs.append('index.json is stale')
mods=json.load(open('content/modules.json'))
allq=set(); allw=set()
gloss={t['id'] for t in json.load(open('content/grammar-terms.json'))['terms']}
module_numbers=[m['number'] for m in mods['modules']]
if module_numbers!=list(range(1,len(module_numbers)+1)): errs.append('module numbers must be consecutive from 1')
for prev,current in zip(mods['modules'],mods['modules'][1:]):
    if prev['last']+1!=current['first']: errs.append(f"module ranges must be consecutive: {prev['number']} to {current['number']}")
for l in L:
    for tid in l.get('grammarTerms',[]):
        if tid not in gloss: errs.append(f"{l['number']}: unknown grammar term {tid}")
for l in L:
    n=l['number']
    if not set(l.get('focusSkills',[])) <= {'listening','reading','speaking','writing'}: errs.append(f'{n}: invalid focus skill')
    presentation=l.get('presentation',{})
    if presentation.get('template')!='conversation-first': errs.append(f'{n}: active lectures use conversation-first')
    opening=presentation.get('opening',{})
    note=opening.get('teacherNote')
    if not isinstance(note,dict) or not note.get('title') or not note.get('body'): errs.append(f'{n}: teacherNote needs title and body')
    if not opening.get('questionIntro'): errs.append(f'{n}: opening questionIntro is required')
    if opening.get('dialogue',{}).get('part')!='recall': errs.append(f'{n}: dialogue belongs in recall')
    for key in ('initiallyHidden','startWithTextHidden'):
        if key in opening.get('dialogue',{}): errs.append(f'{n}: unsupported dialogue field {key}; use initiallyOpen')
    hero=presentation.get('hero',{})
    for key in ('variant','meta','kicker','title','lede','startLine','speakers','connector','encounterLabel','chunks'):
        if not hero.get(key): errs.append(f'{n}: missing hero.{key}')
    if not hero.get('startLine',{}).get('audioText'): errs.append(f'{n}: hero startLine needs audioText')
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
        if not w.get('example','').strip() or not w.get('translation','').strip(): errs.append(f'{n}: word example/translation missing {w["id"]}')
        if w.get('example','').startswith('Jag säger '): errs.append(f'{n}: placeholder word example {w["id"]}')
    titles=[s['title'] for s in l['sections']]
    t=l.get('presentation',{}).get('teaching',{})
    for lp in t.get('livePractice',[]):
        if lp['sectionTitle'] not in titles: errs.append(f'{n}: livePractice missing '+lp['sectionTitle'])
    b=t.get('builder')
    if b and b['sectionTitle'] not in titles: errs.append(f'{n}: builder section missing')
    for s in l['sections']:
      if s.get('kind','scene') not in ('rule','scene','register'): errs.append(f'{n}: unsupported teaching kind {s.get("kind")}')
      if 'table' in s and (not s['table'].get('headings') or 'headers' in s['table']): errs.append(f'{n}: table needs headings, not headers: {s["title"]}')
      if not isinstance(s.get('body'),list) or not all(isinstance(p,str) and p.strip() for p in s['body']):
        errs.append(f"{n}: section body must be a non-empty string list: {s.get('title','untitled')}")
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
            if len({p['right'] for p in a['pairs']})!=len(a['pairs']): errs.append(f'{n}: ambiguous duplicate match targets')
            for key in ('leftLabel','rightLabel','pattern'):
                if not a.get(key): errs.append(f'{n}: match missing {key}')
        if a['type']=='sound-map':
            f={x['id'] for x in a.get('features',[])}
            for so in a['sounds']:
                for x in so.get('features',[]):
                    if x not in f: errs.append(f'{n}: bad feature')
    op=l.get('presentation',{}).get('opening',{})
    rp=l.get('reviewPhrases',[])
    if len(rp)!=8: errs.append(f'{n}: active lecture needs 8 review phrases')
    if len({x['id'] for x in rp})!=len(rp): errs.append(f'{n}: duplicate review phrase id')
    for x in rp:
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,40}',x['id']) or not x['en'].strip() or not x['fi'].strip(): errs.append(f"{n}: bad review phrase {x.get('id')}")
    wr=l['practice']['writing']
    if not wr.get('situation'): errs.append(f'{n}: writing situation is required')
    if not wr.get('points'): errs.append(f'{n}: writing points are required')
    if 'wordRange' not in wr: errs.append(f'{n}: writing wordRange is required')
    if 'wordRange' in wr:
        r=wr['wordRange']
        if not (isinstance(r,list) and len(r)==2 and all(isinstance(v,int) for v in r) and 0<r[0]<=r[1]): errs.append(f'{n}: writing wordRange must be [fewest, most]')
        if len(wr['model'].split())>r[1]: errs.append(f'{n}: writing model is longer than its wordRange')
        if len(wr['model'].split())<r[0]: errs.append(f'{n}: writing model is shorter than its wordRange')
    if 'points' in wr and (not wr['points'] or not all(p.strip() for p in wr['points'])): errs.append(f'{n}: writing points must be non-empty')
    uq=l.get('unplannedQuestions',[])
    if len(uq)!=6: errs.append(f'{n}: active lecture needs 6 unplanned questions')
    if len({x['id'] for x in uq})!=len(uq): errs.append(f'{n}: duplicate unplanned question id')
    for x in uq:
        if not (x['fi'].strip().endswith('?') and x['en'].strip() and x['sample'].strip()): errs.append(f"{n}: bad unplanned question {x.get('id')}")
    mp=l.get('missionPlan')
    if not mp: errs.append(f'{n}: missionPlan is required')
    else:
        for ln in mp['lines']:
            if not ln['label'].strip() or not ln['placeholder'].strip(): errs.append(f'{n}: mission plan line missing label/placeholder')
    if not l.get('sittingBreakAfter'): errs.append(f'{n}: sittingBreakAfter is required')
    required=l.get('route',{}).get('requiredSkills',[])
    if not {'speaking','writing'}.issubset(required): errs.append(f'{n}: route.requiredSkills needs speaking and writing')
    if not any(not q.get('options') for q in l['checkpoint']): errs.append(f'{n}: checkpoint needs a typed-production item')
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
        for note in sp.get('naturalNotes',[]):
            if not all(note.get(k) for k in ('source','natural','note')): errs.append(f'{n}: malformed natural note on {sp["pageLabel"]}')
        hunt=sp.get('hunt',{})
        if not all(hunt.get(k) for k in ('label','title','instructions','missHint','spots')) or 'items' in hunt: errs.append(f'{n}: malformed or empty hunt on {sp["pageLabel"]}')
        if len({s['word'].lower() for s in hunt.get('spots',[])})!=len(hunt.get('spots',[])): errs.append(f'{n}: duplicate word rules on {sp["pageLabel"]}')
        bc=sp.get('backchain')
        if bc:
            line=sp['lines'][bc['line']]['fi'].lower()
            for c in bc['chunks']:
                if c.lower().rstrip('.') not in line: errs.append(f'{n}: chunk not in line: '+c)
            clean=lambda value: re.sub(r'[^\w\s]','',value.lower()).strip()
            for first,second in zip(bc['chunks'],bc['chunks'][1:]):
                if clean(first) not in clean(second): errs.append(f'{n}: backchain does not build progressively on {sp["pageLabel"]}')
        toks={re.sub(r'[^\w]','',t).lower() for li in sp['lines'] for t in li['fi'].split()}
        for spot in sp.get('hunt',{}).get('spots',[]):
            if spot['word'].lower() not in toks: errs.append(f"{n}: spot not on page "+spot['word'])
            if spot['mark'].lower() not in spot['word'].lower(): errs.append(f"{n}: spot mark "+spot['word'])
for module in mods['modules']:
    story=module.get('story',{})
    for key in ('title','setting','summary','cast'):
        if not story.get(key): errs.append(f'module {module["number"]}: missing story.{key}')
    actual={line['speaker'] for l in L if module['first']<=l['number']<=module['last'] for line in l.get('dialogue',[])}
    if set(story.get('cast',[]))!=actual: errs.append(f'module {module["number"]}: story cast does not match its dialogues')
    art=story.get('art')
    if art and (not art.startswith('/images/story/') or not os.path.isfile('public'+art)): errs.append('invalid chapter art '+art)
for l in L:
    art=l.get('story',{}).get('art')
    if art and (not art.startswith('/images/story/') or not os.path.isfile('public'+art)): errs.append('invalid lecture art '+art)
print('lectures:',[l['number'] for l in L],'errors:',errs)
sys.exit(1 if errs else 0)
