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
VOICES=('Alex','Elin','Henrik','Maja')
def words(text): return len(re.findall(r"[\wåäöÅÄÖé'-]+",text))
def check_questions(n,hid,qs):
    errs=[]
    if len({q['id'] for q in qs})!=len(qs): errs.append(f'{n}: {hid} repeats a question id')
    for q in qs:
        qid=q.get('id')
        if not q.get('prompt','').strip(): errs.append(f"{n}: {hid} question {qid} needs a prompt")
        answers=q.get('answers')
        if answers is not None and (not answers or not all(a.strip() for a in answers)): errs.append(f"{n}: {hid} question {qid} has an empty answer")
        opts=q.get('options')
        if q.get('multiple') and not opts: errs.append(f"{n}: {hid} question {qid} is multiple without options")
        if q.get('writing') is not None and opts: errs.append(f"{n}: {hid} question {qid} mixes writing and options")
        wr=(q.get('writing') or {}).get('wordRange')
        if wr is not None and not (len(wr)==2 and 0<wr[0]<wr[1]): errs.append(f"{n}: {hid} question {qid} bad wordRange")
        if opts is not None:
            if len(opts)<2 or len(set(opts))!=len(opts): errs.append(f"{n}: {hid} question {qid} needs distinct options")
            if answers and not set(answers)<=set(opts): errs.append(f"{n}: {hid} question {qid} answer is not an option")
    return errs

homework_ids=set()
def check_homework(n,st):
    """The teacher's Classroom forms: each needs questions whose answers can be checked."""
    errs=[]
    if not st.get('homework'): return [f"{n}: extra step {st['id']} has no homework"]
    for hw in st['homework']:
        hid=hw.get('id','')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,60}',hid) or hid in homework_ids: errs.append(f'{n}: bad or duplicate homework id {hid}')
        homework_ids.add(hid)
        for k in ('title','posted','instructions'):
            if not str(hw.get(k,'')).strip(): errs.append(f'{n}: homework {hid} missing {k}')
        if not isinstance(hw.get('item'),int): errs.append(f'{n}: homework {hid} needs its Classroom item number')
        qs=hw.get('questions',[])
        if not qs: errs.append(f'{n}: homework {hid} has no questions')
        if len({q['id'] for q in qs})!=len(qs): errs.append(f'{n}: homework {hid} repeats a question id')
        for link in hw.get('links',[]):
            if not link.get('label','').strip() or not link.get('url','').startswith('https://'): errs.append(f'{n}: homework {hid} has a bad link')
        for text in hw.get('texts',[]):
            if not text.get('body','').strip(): errs.append(f'{n}: homework {hid} has an empty text')
        errs+=check_questions(n,'homework '+hid,qs)
    return errs

comprehension_ids=set()
def check_comprehension(n,st):
    """Listening clips and reading texts: playable audio, a text, and at least one checkable question."""
    errs=[]
    if not st.get('parts'): return [f"{n}: extra step {st['id']} has no parts"]
    em=st.get('examMinutes')
    if em is not None and not (isinstance(em,int) and 5<=em<=120): errs.append(f"{n}: {st['id']} examMinutes 5-120")
    for part in st['parts']:
        pid=part.get('id','')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,60}',pid) or pid in comprehension_ids: errs.append(f'{n}: bad or duplicate comprehension id {pid}')
        comprehension_ids.add(pid)
        for k in ('title','textType'):
            if not str(part.get(k,'')).strip(): errs.append(f'{n}: {pid} missing {k}')
        if part.get('type')=='listening':
            lines=part.get('lines',[])
            if not 1<=len(lines)<=24: errs.append(f'{n}: {pid} needs 1-24 lines (the speech API limit)')
            if sum(len(l.get('fi','')) for l in lines)>3900: errs.append(f'{n}: {pid} is over the 4,000-character speech limit')
            for l in lines:
                if l.get('voice') not in ('Alex','Elin','Henrik','Maja'): errs.append(f'{n}: {pid} bad voice {l.get("voice")}')
                if not all(str(l.get(k,'')).strip() for k in ('speaker','fi','en')): errs.append(f'{n}: {pid} line needs speaker, fi and en')
            sit=part.get('situation') or {}
            if not (sit.get('fi') and sit.get('en')): errs.append(f'{n}: {pid} needs a situation in fi and en')
        elif part.get('type')=='reading':
            if not part.get('text','').strip(): errs.append(f'{n}: {pid} has no text')
        else: errs.append(f'{n}: {pid} unknown part type')
        qs=part.get('questions',[])
        if len(qs)<2: errs.append(f'{n}: {pid} needs at least 2 questions')
        if not any(q.get('answers') and not q.get('writing') for q in qs): errs.append(f'{n}: {pid} needs at least one checkable question')
        errs+=check_questions(n,pid,qs)
    return errs

def check_yki_speaking(n,st):
    """Original YKI speaking tasks: timing bounds, voices, and models that fit their time (about 2 words a second)."""
    e=[]; parts=st.get('parts') or []
    if not parts: e.append(f"{n}: yki-speaking step {st['id']} has no parts")
    if len({p.get('id') for p in parts})!=len(parts): e.append(f"{n}: duplicate yki part id")
    prompt_ids=set()
    for p in parts:
        pid=p.get('id','?')
        if not p.get('title','').strip(): e.append(f"{n}: yki part {pid} needs a title")
        for first,last in re.findall(r's\.\s*(\d+)(?:\s*[–-]\s*(\d+))?',p.get('bookRef','')):
            if not all(7<=int(x)<=125 for x in (first,last or first)): e.append(f"{n}: yki part {pid} bookRef page outside the book (7-125)")
        if p.get('type')=='dialogue':
            partner=p.get('partner',{})
            if partner.get('voice') not in VOICES or not partner.get('role','').strip(): e.append(f"{n}: yki dialogue {pid} partner needs a role and a native voice")
            if not 10<=p.get('readSeconds',0)<=20: e.append(f"{n}: yki dialogue {pid} readSeconds must be 10-20")
            if not (p.get('situation',{}).get('fi') and p.get('situation',{}).get('en')): e.append(f"{n}: yki dialogue {pid} situation needs fi and en")
            turns=p.get('turns',[])
            if not any(t.get('who')=='learner' for t in turns) or not any(t.get('who')=='partner' for t in turns): e.append(f"{n}: yki dialogue {pid} needs partner and learner turns")
            for t in turns:
                if t.get('who')=='partner':
                    if not (t.get('fi') and t.get('en')): e.append(f"{n}: yki dialogue {pid} partner turn needs fi and en")
                elif t.get('who')=='learner':
                    if not (t.get('cue',{}).get('fi') and t.get('cue',{}).get('en')): e.append(f"{n}: yki dialogue {pid} learner cue needs fi and en")
                    sec=t.get('seconds',0)
                    if not 5<=sec<=40: e.append(f"{n}: yki dialogue {pid} turn seconds must be 5-40")
                    models=t.get('models') or []
                    if not models or not all(isinstance(m,str) and m.strip() for m in models): e.append(f"{n}: yki dialogue {pid} learner turn needs a model")
                    for m in models:
                        if words(m)>sec*2.5: e.append(f"{n}: yki dialogue {pid} model too long for {sec} s: {m[:40]}")
                else: e.append(f"{n}: yki dialogue {pid} turn who must be partner or learner")
            for ph in p.get('phrases',[]):
                if not (ph.get('fi') and ph.get('en')): e.append(f"{n}: yki dialogue {pid} phrase needs fi and en")
        elif p.get('type')=='prompts':
            if p.get('format') not in ('react','tell','opinion'): e.append(f"{n}: yki prompts {pid} format must be react, tell or opinion")
            for key in ('prepSeconds','speakSeconds'):
                if not 10<=p.get(key,0)<=120: e.append(f"{n}: yki prompts {pid} {key} must be 10-120")
            prompts=p.get('prompts') or []
            if not prompts: e.append(f"{n}: yki prompts {pid} has no prompts")
            if p.get('format')=='react' and len(prompts)<5: e.append(f"{n}: yki react set {pid} needs at least 5 prompts")
            size=p.get('roundSize')
            if size is not None and not 1<=size<=len(prompts): e.append(f"{n}: yki prompts {pid} roundSize out of range")
            for q in prompts:
                if q.get('id') in prompt_ids: e.append(f"{n}: duplicate yki prompt id {q.get('id')}")
                prompt_ids.add(q.get('id'))
                if not all(q.get(k,'').strip() for k in ('id','fi','en','model','modelEn')): e.append(f"{n}: yki prompt {q.get('id')} needs id, fi, en, model and modelEn")
                if words(q.get('model',''))>p.get('speakSeconds',0)*2.5: e.append(f"{n}: yki prompt {q.get('id')} model too long for {p.get('speakSeconds')} s")
        else: e.append(f"{n}: yki part {pid} type must be dialogue or prompts")
    return e
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
            if 'audio' in a and not isinstance(a['audio'],bool): errs.append(f'{n}: sort audio must be true or false')
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
        if st['kind'] not in ('source-practice','yki-speaking','classroom-homework','yki-comprehension'): errs.append(f"{n}: unknown extra step kind {st['kind']}")
        if not (isinstance(st['minutes'],int) and 1<=st['minutes']<=60): errs.append(f"{n}: extra step minutes {st['id']}")
        for k in ('label','description','action'):
            if not st.get(k,'').strip(): errs.append(f"{n}: extra step {st['id']} missing {k}")
        if st['kind']=='source-practice':
            if not st.get('pages'): errs.append(f"{n}: extra step {st['id']} has no pages")
            pages+=st.get('pages',[])
        if st['kind']=='yki-speaking':
            errs+=check_yki_speaking(n,st)
        if st['kind']=='classroom-homework':
            errs+=check_homework(n,st)
        if st['kind']=='yki-comprehension':
            errs+=check_comprehension(n,st)
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
    # The chapter cast lists the recurring characters who speak in its dialogues;
    # one-scene roles (Servitör, Läkare…) stay in their lecture only.
    recurring={'Alex','Elin','Henrik','Maja'}
    actual={line['speaker'] for l in L if module['first']<=l['number']<=module['last'] for line in l.get('dialogue',[])}&recurring
    if set(story.get('cast',[]))!=actual: errs.append(f'module {module["number"]}: story cast must be the recurring characters in its dialogues')
    art=story.get('art')
    if art and (not art.startswith('/images/story/') or not os.path.isfile('public'+art)): errs.append('invalid chapter art '+art)
for l in L:
    art=l.get('story',{}).get('art')
    if art and (not art.startswith('/images/story/') or not os.path.isfile('public'+art)): errs.append('invalid lecture art '+art)
print('lectures:',[l['number'] for l in L],'errors:',errs)
sys.exit(1 if errs else 0)
