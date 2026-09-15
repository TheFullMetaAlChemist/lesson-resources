/* PERSONAL STATEMENT WORKSHOP — APPLICATION
   1. State & small helpers       2. Page rendering       3. Drafts & versions
   4. Saving & importing          5. Dialogs              6. Event handlers
   Teaching text lives in prompts.js; document generation lives in exports.js.
   No student text is sent to a server. Default storage is this open tab only. */
(() => {
  'use strict';
  const C = window.PSW_CONTENT, E = window.PSW_EXPORTS;
  if (!C || !E) { document.querySelector('#main').textContent = 'A supporting file did not load. Keep index.html, styles.css, prompts.js, exports.js and app.js together, then reload.'; return; }
  const VERSION = '1.0.0', FORMAT = 'personal-statement-workshop', STORAGE_KEY = 'sidcot-personal-statement-workshop-v1';
  const QIDS = C.questions.map(q => q.id), MAX_VERSIONS = 60, MAX_FILE_BYTES = 4 * 1024 * 1024;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const tabID = uid();
  const question = id => C.questions.find(q => q.id === id) || C.questions[0];
  const category = id => C.categories.find(c => c.id === id) || C.categories.find(c => c.id === 'other');
  const charCount = text => Array.from(String(text || '').replace(/\r\n?/g, '\n')).length;
  const nice = n => n.toLocaleString('en-GB');
  const timeLabel = date => new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = date => new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const answersEmpty = () => QIDS.every(q => !state.drafts[q].trim());
  const totalCount = () => QIDS.reduce((sum, q) => sum + charCount(state.drafts[q]), 0);
  const getIdea = id => state.ideas.find(i => i.id === id);
  const shortText = (value, length = 160) => value.length > length ? `${value.slice(0,length)}…` : value;
  const blankQuestions = value => Object.fromEntries(QIDS.map(q => [q, typeof value === 'function' ? value() : value]));
  const externalLink = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens a new tab)</span></a>`;

  function blankState() {
    return {
      format: FORMAT, schemaVersion: 1, appVersion: VERSION, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      profile: { title: 'My personal statement', subject: '', qualifications: '', name: '', courseNotes: '' },
      ideas: [], drafts: blankQuestions(''), selected: blankQuestions(() => []), reviewed: blankQuestions(false), checks: {},
      versions: [], nextSteps: '', exportOptions: { includeName: false, includeNotes: false, feedback: false },
      ui: { view: 'focus', ideaId: '', ideaStep: 0, draftQuestion: 'q1' }
    };
  }
  let state = blankState(), started = false, remember = false, cached = null, revision = 0, backupRevision = 0;
  let storageTimer, toastTimer, downloadedAt = '', deviceSavedAt = '', storageError = '', modalCallback = null;
  const views = [
    ['focus', 'Your focus', '01'], ['ideas', 'Idea bank', '02'],
    ['q1', 'Your subject interest', '1'], ['q2', 'Learning & studies', '2'], ['q3', 'Beyond education', '3'],
    ['draft', 'Build your answers', '03'], ['review', 'Review & export', '04']
  ];

  function hasWork() {
    return state.ideas.length > 0 || !answersEmpty() || state.nextSteps.trim() || Object.entries(state.profile).some(([key, value]) => value.trim() && !(key === 'title' && value === 'My personal statement'));
  }
  function toast(message, duration = 6500) {
    clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, duration);
  }
  function changed() {
    revision++; state.updatedAt = new Date().toISOString();
    scheduleStorage(); updateIndicators();
  }
  function scheduleStorage() {
    clearTimeout(storageTimer);
    if (remember) storageTimer = setTimeout(saveToDevice, 450);
  }
  function statusFor(q) {
    if (state.reviewed[q] && state.drafts[q].trim()) return 'Reviewed';
    if (state.drafts[q].trim()) return 'Draft written';
    if (state.ideas.some(i => i.q === q && i.snippet.trim())) return 'Writing pieces ready';
    if (state.ideas.some(i => i.q === q)) return 'Ideas recorded';
    return 'Not started';
  }
  function updateIndicators() {
    $('#header-save').disabled = !started;
    const strip = $('#storage-strip'); strip.hidden = !started;
    if (started) {
      const modeText = remember ? `Personal device · browser copy ${deviceSavedAt ? 'saved at ' + timeLabel(deviceSavedAt) : 'pending'}` : 'Shared-computer mode · work is in this open tab only';
      const backupText = downloadedAt ? `Progress download requested at ${timeLabel(downloadedAt)}${revision !== backupRevision ? ' · newer changes need saving' : ''}` : 'Download a progress file before leaving.';
      strip.innerHTML = `<span>${esc(storageError || modeText)} <span aria-hidden="true">·</span> ${esc(backupText)}</span><button class="text-button" data-action="settings">Device settings</button>`;
    }
    const total = totalCount();
    document.querySelectorAll('[data-total]').forEach(el => { el.textContent = nice(total); });
    document.querySelectorAll('[data-total-progress]').forEach(el => { el.value = Math.min(total, C.limits.total); el.setAttribute('aria-valuetext', `${total} of ${C.limits.total} characters used`); });
    document.querySelectorAll('.draft-meter').forEach(el => el.classList.toggle('over', total > C.limits.total));
    document.querySelectorAll('[data-total-message]').forEach(el => { el.textContent = total > C.limits.total ? `${nice(total - C.limits.total)} over the overall limit` : `${nice(C.limits.total - total)} characters available`; });
    for (const q of QIDS) {
      const count = charCount(state.drafts[q]);
      document.querySelectorAll(`[data-count="${q}"]`).forEach(el => { el.textContent = nice(count); });
      document.querySelectorAll(`[data-status="${q}"]`).forEach(el => { el.textContent = statusFor(q); });
      document.querySelectorAll(`[data-minimum="${q}"]`).forEach(el => { el.textContent = count >= C.limits.minimum ? 'Minimum reached' : `${nice(C.limits.minimum - count)} more to reach 350`; });
    }
    const snippetCounter = $('[data-snippet-count]');
    if (snippetCounter) snippetCounter.textContent = `${nice(charCount(getIdea(state.ui.ideaId)?.snippet))} characters · not counted until added to an answer`;
  }
  function go(view, options = {}) {
    if (!views.some(v => v[0] === view)) view = 'focus';
    state.ui.view = view; started = true;
    if (QIDS.includes(view) && getIdea(state.ui.ideaId)?.q !== view) { state.ui.ideaId = state.ideas.find(i => i.q === view)?.id || ''; state.ui.ideaStep = 0; }
    scheduleStorage(); render(options);
  }
  function render({ focus = true, scroll = true } = {}) {
    const app = $('#app');
    if (!started) { app.className = 'app-shell'; app.innerHTML = `<main id="main" tabindex="-1">${renderWelcome()}</main>`; }
    else {
      app.className = 'app-shell workspace';
      app.innerHTML = `${renderSidebar()}<main id="main" tabindex="-1">${renderMobileNav()}${renderView()}</main>`;
    }
    updateIndicators();
    if (focus) $('#main').focus({ preventScroll: true });
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function renderWelcome() {
    return `<section class="welcome">
      <div class="welcome-hero"><div class="hero-story">
        <div class="eyebrow">YOUR UNIVERSITY APPLICATION · 2026 ENTRY ONWARDS</div>
        <h1>Your story.<br><span>One piece at a time.</span></h1>
        <p>You do not need the perfect opening sentence. Start with an idea, explore what it means, and build a draft in your own words.</p>
        <div class="hero-facts"><div><strong>3</strong><span>UCAS questions</span></div><div><strong>4,000</strong><span>characters in total</span></div><div><strong>Your</strong><span>voice throughout</span></div></div>
      </div><div class="hero-start">
        <div class="eyebrow">LET’S GET SOMETHING ON THE PAGE</div><h2>Where would you like to start?</h2><p class="muted small-text">A guided workspace, not an automatic writer.</p>
        ${cached ? `<button class="start-option featured" data-action="resume"><span class="option-icon" aria-hidden="true">↻</span><span><strong>Resume work on this device</strong><small>A browser copy is available. Only open it if it is yours.</small></span><span class="option-arrow" aria-hidden="true">→</span></button>` : ''}
        <button class="start-option ${cached ? '' : 'featured'}" data-action="start"><span class="option-icon" aria-hidden="true">＋</span><span><strong>Start a new statement</strong><small>Find useful ideas and develop them step by step.</small></span><span class="option-arrow" aria-hidden="true">→</span></button>
        <button class="start-option" data-action="open"><span class="option-icon" aria-hidden="true">↥</span><span><strong>Continue from a progress file</strong><small>Open the .ucas.json file you saved previously.</small></span><span class="option-arrow" aria-hidden="true">→</span></button>
        <button class="text-button spacer" data-action="existing">I already have a draft — take me to the editor</button>
        <p class="welcome-note">No account. No AI-generated writing. Work stays in this tab unless you choose to save it. ${cached ? '<button class="text-button" data-action="clear-cached">Remove the browser copy</button>' : ''}</p>
      </div></div>
      <div class="three-steps"><div class="step-description"><span>01</span><div><h3>Find your material</h3><p>Collect genuine interests and experiences. Rough notes are enough.</p></div></div><div class="step-description"><span>02</span><div><h3>Develop your thinking</h3><p>Explain what happened, what you learned and why it matters.</p></div></div><div class="step-description"><span>03</span><div><h3>Make it a draft</h3><p>Bring your writing together, edit it and export a document.</p></div></div></div>
    </section>`;
  }
  function renderSidebar() {
    return `<aside class="sidebar"><nav aria-label="Workshop stages">${views.map(([id, label, icon], n) => `${n === 0 ? '<div class="sidebar-label">GET STARTED</div>' : n === 2 ? '<div class="sidebar-label">DEVELOP YOUR WRITING</div>' : n === 5 ? '<div class="sidebar-label">BRING IT TOGETHER</div>' : ''}<button class="nav-item" data-action="nav" data-view="${id}" ${state.ui.view === id ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${icon}</span><span><strong>${label}</strong>${QIDS.includes(id) ? `<small data-status="${id}">${statusFor(id)}</small>` : ''}</span></button>`).join('')}</nav>
      <div class="draft-meter"><div class="eyebrow">YOUR ASSEMBLED DRAFT</div><div><span class="meter-number" data-total>0</span><span class="small-text muted"> / 4,000</span></div><progress data-total-progress max="4000" value="0" aria-label="Characters used in the assembled draft"></progress><p class="small-text muted no-margin" data-total-message></p><p class="small-text muted spacer">Notes and short writing pieces do not count here.</p><button class="text-button small-text" data-action="finish">Finish &amp; clear this session</button></div></aside>`;
  }
  function renderMobileNav() {
    return `<div class="mobile-navigation"><label for="stage-select">JUMP TO A STAGE — YOU CAN SKIP AND RETURN</label><select id="stage-select" data-nav-select>${views.map(([id,label]) => `<option value="${id}" ${id === state.ui.view ? 'selected' : ''}>${label}${QIDS.includes(id) ? ' · ' + statusFor(id) : ''}</option>`).join('')}</select></div>`;
  }
  function pageHeading(kicker, title, lead) { return `<div class="page-heading"><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="lead">${lead}</p></div>`; }
  function focusBanner() { return state.profile.subject.trim() ? `<div class="focus-banner">YOUR SUBJECT FOCUS <strong>${esc(state.profile.subject)}</strong> · <button class="text-button" data-action="nav" data-view="focus">Change</button></div>` : ''; }
  function renderView() {
    if (state.ui.view === 'focus') return renderFocus();
    if (state.ui.view === 'ideas') return renderIdeas();
    if (QIDS.includes(state.ui.view)) return renderWriting(state.ui.view);
    if (state.ui.view === 'draft') return renderDraft();
    return renderReview();
  }
  function profileField(key, label, hint, placeholder = '', multiline = false) {
    return `<div class="field"><label for="profile-${key}">${label}</label><p class="field-hint" id="hint-${key}">${hint}</p>${multiline ? `<textarea id="profile-${key}" data-profile="${key}" aria-describedby="hint-${key}" placeholder="${esc(placeholder)}" rows="3">${esc(state.profile[key])}</textarea>` : `<input id="profile-${key}" data-profile="${key}" type="text" value="${esc(state.profile[key])}" aria-describedby="hint-${key}" placeholder="${esc(placeholder)}" autocomplete="off">`}</div>`;
  }
  function renderFocus() {
    return `${pageHeading('01 / CHOOSE YOUR FOCUS', 'A little direction. No perfect answers.', 'What would you like to study? You can change this later, and every field here is optional.')}
      <div class="two-columns"><section class="panel">
        ${profileField('subject', 'Which subject or related courses are you considering?', 'Focus on what connects your choices. You do not need to name a particular university.', 'For example, geography or environmental science')}
        ${profileField('qualifications', 'What are you studying now, or what have you studied?', 'This is a planning reminder, not a list to copy into your statement.', 'For example, A levels, a BTEC, an Access course or other training')}
        ${profileField('title', 'Give this piece of work a name', 'Used for your exported document and progress filename.', 'My personal statement')}
        <details class="help-details"><summary>Optional: your name and course guidance notes</summary>
          ${profileField('name', 'Your name (optional)', 'Not included in draft exports unless you select the name option. It will be kept in your progress file.', 'Your name')}
          ${profileField('courseNotes', 'What do your courses ask you to demonstrate?', 'Keep any course-specific advice here. These notes are not part of your statement.', 'Check the course pages for any particular expectations…', true)}
        </details>
        <div class="form-actions"><button class="button ghost" data-action="nav" data-view="draft">I have a draft already</button><button class="button primary" data-action="nav" data-view="ideas">Gather some ideas <span aria-hidden="true">→</span></button></div>
      </section><aside class="stack side-panel"><section class="panel soft"><div class="eyebrow">A USEFUL WAY TO THINK</div><h3>Evidence, then meaning.</h3><p class="small-text muted">“I am interested in this” is a starting point. Your next job is to explain what you have explored and what you took from it.</p><div class="notice info">You can start with whichever question feels easiest. There is no need to work in order.</div></section><section class="panel"><h3>Keep the course in view</h3><p class="small-text muted">Use this workshop alongside advice from your chosen universities or colleges.</p><p class="small-text no-margin">${externalLink(C.links.subjects, 'Explore UCAS subject guides')}</p></section></aside></div>`;
  }
  function renderIdeas() {
    return `${pageHeading('02 / GATHER IDEAS', 'Start small. Collect what might matter.', 'An interesting question, a piece of work, a responsibility or something you explored. You can decide what to use later.')}${focusBanner()}
      <div class="row between spacer" style="margin-bottom:20px"><span class="tag">${state.ideas.length} ${state.ideas.length === 1 ? 'IDEA' : 'IDEAS'} IN YOUR BANK</span><button class="button primary" data-action="new-idea">Add an idea <span aria-hidden="true">＋</span></button></div>
      ${state.ideas.length ? `<div class="ideas-grid">${state.ideas.map(idea => `<article class="panel idea-card"><div class="row gap-small"><span class="tag">QUESTION ${question(idea.q).number}</span><span class="tag ${idea.snippet.trim() ? 'green' : ''}">${idea.snippet.trim() ? 'Writing piece ready' : 'Working notes'}</span></div><h3>${esc(idea.title || 'Untitled idea')}</h3><p>${esc(shortText(idea.notes.detail || idea.snippet || category(idea.category).starter))}</p><div class="row between"><button class="button secondary small" data-action="edit-idea" data-id="${idea.id}">${idea.snippet.trim() ? 'Edit this piece' : 'Develop this idea'} <span aria-hidden="true">→</span></button><button class="button ghost small" data-action="delete-idea" data-id="${idea.id}" aria-label="Delete idea: ${esc(idea.title || 'Untitled idea')}">Delete</button></div></article>`).join('')}</div>` : `<section class="empty-state"><span class="empty-symbol" aria-hidden="true">＋</span><h2>Your idea bank is ready.</h2><p>You do not need a polished sentence. Capture a title and a few rough notes, or try one of these starting points.</p><div class="category-choices" style="justify-content:center">${['interest','project','work','independent'].map(id => `<button data-action="new-idea" data-category="${id}">${esc(category(id).label)}</button>`).join('')}</div></section>`}
      <div class="notice info spacer">This bank is optional. You can also add ideas directly under any of the three questions. The same experience can fit more than one question; choose its most useful home rather than repeating it.</div>
      <div class="form-actions"><button class="button secondary" data-action="nav" data-view="focus">Back to your focus</button><button class="button primary" data-action="nav" data-view="q1">Start developing your writing <span aria-hidden="true">→</span></button></div>`;
  }

  function renderWriting(qid) {
    const q = question(qid), list = state.ideas.filter(i => i.q === qid);
    let idea = list.find(i => i.id === state.ui.ideaId) || list[0];
    if (idea) state.ui.ideaId = idea.id;
    const step = state.ui.ideaStep, cat = category(idea?.category);
    const intro = `${focusBanner()}<div class="question-header"><span class="question-number" aria-hidden="true">${q.number}</span><div><div class="eyebrow">DEVELOP YOUR WRITING / QUESTION ${q.number}</div><h1>${esc(q.official)}</h1><p class="lead no-margin">${esc(q.purpose)}</p></div></div><div class="notice info">${esc(q.reassurance)}</div>`;
    const choices = `<div class="category-choices">${q.suggested.map(id => `<button data-action="add-template" data-category="${id}" data-q="${qid}">${esc(category(id).label)} <span aria-hidden="true">＋</span></button>`) .join('')}<button data-action="new-idea" data-q="${qid}">Another starting point…</button></div>`;
    if (!idea) return `${intro}<section class="panel spacer"><div class="eyebrow">PICK ONE STARTING POINT</div><h2>What could you write about?</h2><p class="muted small-text">Choose something genuine. These are options, not a checklist you have to complete.</p>${choices}</section><div class="form-actions"><button class="button secondary" data-action="nav" data-view="ideas">Go to your idea bank</button><button class="button ghost" data-action="nav" data-view="${qid === 'q3' ? 'draft' : 'q' + (q.number + 1)}">Leave this question for later <span aria-hidden="true">→</span></button></div>`;
    const labels = ['The detail', 'Your learning', 'Why it matters', 'Your writing'];
    const keys = ['detail','learning','relevance'];
    const noteLabel = step < 3 ? cat[keys[step]] : 'Use the useful details to write a short passage in your own words.';
    return `${intro}
      <div class="idea-tabs" aria-label="Ideas for this question">${list.map(i => `<button class="idea-tab" data-action="choose-idea" data-id="${i.id}" aria-pressed="${i.id === idea.id}">${esc(shortText(i.title || 'Untitled idea', 45))}${i.snippet.trim() ? ' · writing ready' : ''}</button>`).join('')}<button class="idea-tab" data-action="new-idea" data-q="${qid}">＋ Add another idea</button></div>
      <div class="two-columns"><section class="panel">
        <div class="row between" style="margin-bottom:18px"><span class="tag gold">${step < 3 ? 'THINKING NOTES — NOT YOUR STATEMENT' : 'A SHORT PIECE FOR YOUR DRAFT'}</span><button class="text-button small-text" data-action="idea-settings" data-id="${idea.id}">Move / change type</button></div>
        <div class="prompt-steps" aria-label="Develop this idea">${labels.map((label,n) => `<button class="prompt-step" data-action="prompt-step" data-step="${n}" aria-pressed="${step === n}"><span>STEP ${n+1}</span>${label}</button>`).join('')}</div>
        ${step === 0 ? `<div class="field" style="margin-bottom:22px"><label for="idea-title">Give this idea a short title</label><input id="idea-title" data-idea-field="title" type="text" value="${esc(idea.title)}" placeholder="For example, my regeneration investigation" autocomplete="off"></div>` : ''}
        <div class="field"><label class="prompt-label" for="idea-response">${esc(noteLabel)}</label><p class="field-hint" id="response-hint">${step < 3 ? 'Fragments and rough notes are fine. You can skip this step or come back to it.' : 'Your notes are a thinking aid, not a script. Choose what matters; vary the structure and leave out anything unhelpful.'}</p><textarea id="idea-response" ${step < 3 ? `data-note="${keys[step]}"` : 'data-idea-field="snippet"'} class="${step === 3 ? 'writing-area' : ''}" aria-describedby="response-hint" placeholder="${step < 3 ? 'Jot down your thoughts here…' : 'Write your passage here. It does not need to be perfect.'}" rows="${step === 3 ? 8 : 6}">${esc(step < 3 ? idea.notes[keys[step]] : idea.snippet)}</textarea></div>
        ${step === 3 ? `<div class="counter" data-snippet-count></div>` : ''}
        <details class="help-details"><summary>Help me get started</summary><p>${esc(cat.starter)}</p><p><strong>Optional opening:</strong> ${esc(cat.opener)}</p><p>You do not have to use this wording. Keep your example truthful and focus on what it taught you.</p></details>
        <div class="form-actions"><button class="button secondary" data-action="${step === 0 ? 'nav' : 'prompt-step'}" ${step === 0 ? 'data-view="ideas"' : `data-step="${step-1}"`}>${step === 0 ? 'Back to idea bank' : 'Previous step'}</button><button class="button primary" data-action="${step === 3 ? 'keep-piece' : 'prompt-step'}" ${step < 3 ? `data-step="${step+1}"` : ''}>${step === 3 ? 'Keep this piece' : 'Next step'} <span aria-hidden="true">${step === 3 ? '✓' : '→'}</span></button></div>
        <p class="small-text muted spacer no-margin">Your changes are kept as you type in this session. Use <strong>Save progress</strong> to take them away.</p>
      </section><aside class="stack side-panel"><section class="panel soft"><div class="eyebrow">YOUR THINKING SO FAR</div><h3>${esc(idea.title || 'Untitled idea')}</h3>${keys.map((key,n) => `<div class="note-preview"><strong>${['Specific detail','What I learned','Why it matters'][n]}</strong><p data-note-preview="${key}">${esc(idea.notes[key] || 'Nothing recorded yet — this is optional.')}</p></div>`).join('')}</section>
        <section class="panel"><h3>Make the example do some work</h3><ul class="guide-list">${q.nudges.map(n => `<li>${esc(n)}</li>`).join('')}</ul><details class="help-details"><summary>See description become reflection</summary><p>${esc(q.example.context)}</p><div class="eyebrow spacer">A CLAIM WITHOUT MUCH DETAIL</div><div class="quote-example">${esc(q.example.before)}</div><div class="eyebrow spacer">MORE SPECIFIC THINKING</div><div class="quote-example">${esc(q.example.after)}</div><p>${esc(q.example.why)}</p></details></section></aside></div>
      <div class="form-actions"><button class="button ghost" data-action="nav" data-view="${qid === 'q3' ? 'q1' : 'q' + (q.number+1)}">Try ${qid === 'q3' ? 'Question 1' : 'Question ' + (q.number+1)} instead</button><button class="button secondary" data-action="draft-for-question" data-q="${qid}">Build my answer to Question ${q.number} <span aria-hidden="true">→</span></button></div>`;
  }
  function renderDraft() {
    const qid = state.ui.draftQuestion, q = question(qid);
    const snippets = state.ideas.filter(i => i.q === qid && i.snippet.trim());
    const selected = state.selected[qid].filter(id => snippets.some(i => i.id === id));
    const ordered = [...selected.map(getIdea), ...snippets.filter(i => !selected.includes(i.id))];
    return `${pageHeading('03 / BRING IT TOGETHER', 'Build an answer. Then make it flow.', 'Select the pieces you want to use, put them in order, then edit the answer as a whole. You can also write or paste directly into the editor.')}${focusBanner()}
      <div class="answer-tabs" aria-label="Choose an answer">${C.questions.map(x => `<button class="answer-tab" data-action="draft-tab" data-q="${x.id}" aria-pressed="${x.id === qid}"><strong>QUESTION ${x.number}</strong>${x.short}<br><span data-count="${x.id}">${nice(charCount(state.drafts[x.id]))}</span> characters</button>`).join('')}</div>
      <div class="two-columns"><section class="panel">
        <div class="row between" style="margin-bottom:15px"><span class="tag">YOUR EDITABLE ANSWER</span><button class="text-button small-text" data-action="copy" data-q="${qid}">Copy answer</button></div>
        <h2 class="question-caption" id="answer-question">${esc(q.official)}</h2>
        <div class="field"><label class="sr-only" for="answer-editor">Your answer to Question ${q.number}</label><textarea id="answer-editor" class="answer-editor" data-draft="${qid}" aria-describedby="answer-question answer-hint" placeholder="Build from your writing pieces, write here, or paste an existing answer. It is fine to draft beyond the limit and trim it later." rows="13">${esc(state.drafts[qid])}</textarea><p class="field-hint" id="answer-hint">Only this answer text counts towards the UCAS total. Nothing is cut off when you go over the limit.</p></div>
        <div class="char-status"><span><strong data-count="${qid}">${nice(charCount(state.drafts[qid]))}</strong> characters · <span data-minimum="${qid}"></span></span><span data-total-message></span></div>
        <div class="divider"></div><label class="check-label"><input type="checkbox" data-reviewed="${qid}" ${state.reviewed[qid] ? 'checked' : ''} ${!state.drafts[qid].trim() ? 'disabled' : ''}><span><strong>I have reviewed this answer.</strong><small>Editing it again will reset this flag and the final review checklist.</small></span></label>
        <div class="form-actions"><button class="button secondary small" data-action="save-version">Save a draft version</button><button class="button ghost small" data-action="versions">View versions (${state.versions.length})</button></div>
      </section><aside class="stack side-panel"><section class="panel"><div class="eyebrow">YOUR WRITING PIECES</div><h3>Choose &amp; order</h3><p class="small-text muted">Tick the pieces for this answer. Selections are for the <strong>next build</strong>, not a live link to your edited text.</p>
        ${ordered.length ? ordered.map(idea => `<div class="assembly-card"><label class="check-label"><input id="select-${idea.id}" type="checkbox" data-select-piece="${idea.id}" data-q="${qid}" ${selected.includes(idea.id) ? 'checked' : ''}><span><strong>${esc(idea.title || 'Untitled idea')}</strong><small>${selected.includes(idea.id) ? 'Position ' + (selected.indexOf(idea.id)+1) + ' in the next build' : 'Not selected'}</small></span></label><p>${esc(idea.snippet)}</p><div class="row gap-small">${selected.includes(idea.id) ? `<button class="button secondary order-button" data-action="move-piece" data-id="${idea.id}" data-direction="-1" ${selected.indexOf(idea.id) === 0 ? 'disabled' : ''} aria-label="Move ${esc(idea.title || 'this piece')} up">↑ Up</button><button class="button secondary order-button" data-action="move-piece" data-id="${idea.id}" data-direction="1" ${selected.indexOf(idea.id) === selected.length-1 ? 'disabled' : ''} aria-label="Move ${esc(idea.title || 'this piece')} down">↓ Down</button>` : ''}<button class="text-button small-text" data-action="edit-idea" data-id="${idea.id}">Edit piece</button></div></div>`).join('') : `<div class="notice info">No short writing pieces for this question yet. You can still write directly in the answer box.</div>`}
        <button class="button primary full spacer" data-action="build-answer" data-q="${qid}" ${!selected.length ? 'disabled' : ''}>Build from ${selected.length} selected ${selected.length === 1 ? 'piece' : 'pieces'}</button>
        <p class="small-text muted spacer">Building does not rewrite your words. Replacing an existing answer asks first and keeps a draft version.</p><button class="text-button small-text" data-action="nav" data-view="${qid}">Develop another writing piece <span aria-hidden="true">→</span></button>
      </section><div class="notice">Changing notes or a writing piece never changes the edited answer automatically.</div></aside></div>
      <div class="form-actions"><button class="button secondary" data-action="nav" data-view="${qid}">Back to guided writing</button><button class="button primary" data-action="nav" data-view="review">Review &amp; export <span aria-hidden="true">→</span></button></div>`;
  }
  function repeatedParagraphs() {
    const seen = new Map(), repeats = [];
    for (const q of QIDS) {
      for (const text of state.drafts[q].split(/\n+/)) {
        const normal = text.trim().replace(/\s+/g, ' ').toLowerCase();
        if (normal.length < 60) continue;
        if (seen.has(normal)) repeats.push({ first: seen.get(normal), second: q, text: shortText(text.trim(), 110) });
        else seen.set(normal, q);
      }
    }
    return repeats;
  }
  function lengthIssues() {
    const issues = C.questions.filter(q => charCount(state.drafts[q.id]) < C.limits.minimum).map(q => `Question ${q.number} needs ${nice(C.limits.minimum-charCount(state.drafts[q.id]))} more characters to reach 350.`);
    if (totalCount() > C.limits.total) issues.push(`The draft is ${nice(totalCount()-C.limits.total)} characters over the overall limit. Nothing has been removed.`);
    return issues;
  }
  function renderReview() {
    const issues = lengthIssues(), repeated = repeatedParagraphs(), opts = state.exportOptions;
    return `${pageHeading('04 / REVIEW & EXPORT', 'A draft you can take forward.', 'Read it as a whole. Export whatever you have achieved, then keep polishing or discuss it with someone you trust.')}
      <div class="review-summary"><div class="stat-box ${totalCount() > C.limits.total ? 'warn' : ''}"><span class="eyebrow">TOTAL CHARACTERS</span><span class="stat">${nice(totalCount())}<span class="small-text muted"> / 4,000</span></span><small>Across your three answers</small></div>${C.questions.map(q => `<div class="stat-box ${charCount(state.drafts[q.id]) >= C.limits.minimum ? 'ok' : 'warn'}"><span class="eyebrow">QUESTION ${q.number}</span><span class="stat">${nice(charCount(state.drafts[q.id]))}</span><small>${charCount(state.drafts[q.id]) >= C.limits.minimum ? '350 minimum reached' : (C.limits.minimum-charCount(state.drafts[q.id])) + ' more to reach 350'}</small></div>`).join('')}</div>
      <div class="notice ${issues.length ? '' : 'success'}">${issues.length ? `<strong>Still a work in progress — that is fine.</strong><br>${issues.map(esc).join('<br>')}<br>You can export a partial or over-length draft at any time.` : '<strong>The length checks pass.</strong> This checks length only, not quality or suitability. You do not have to use all 4,000 characters.'}</div>
      <p class="small-text muted" style="margin-top:9px">Counts include spaces and line breaks, but not the question headings. Line endings are normalised and Unicode characters counted individually. Check the counts in UCAS after pasting; its handling of pasted text may differ.</p>
      ${repeated.length ? `<div class="notice review-warning"><strong>Possible repetition: an exact paragraph appears more than once.</strong>${repeated.slice(0,5).map(r => `<p class="small-text">Question ${question(r.first).number} / Question ${question(r.second).number}: “${esc(r.text)}”</p>`).join('')}</div>` : ''}
      <div class="two-columns spacer"><section class="panel"><div class="eyebrow">YOUR JUDGEMENT, NOT AN AUTOMATIC SCORE</div><h2>Read with a purpose.</h2><p class="small-text muted">These checks are optional and reset when you change an answer. The tool only detects exact repeated paragraphs of 60 or more characters; check repeated ideas yourself.</p><div class="checklist">${C.reviewChecks.map(check => `<label class="check-label"><input type="checkbox" data-check="${check.id}" ${state.checks[check.id] ? 'checked' : ''}><span><strong>${esc(check.title)}</strong><small>${esc(check.detail)}</small></span></label>`).join('')}</div>
        <div class="field spacer"><label for="next-steps">What will you change next?</label><p class="field-hint" id="next-hint">Keep your own next steps or tutor feedback here. Only exported when planning notes are included.</p><textarea id="next-steps" data-next-steps aria-describedby="next-hint" placeholder="My next change will be…" rows="4">${esc(state.nextSteps)}</textarea></div>
      </section><aside class="stack side-panel"><section class="panel"><div class="eyebrow">TAKE YOUR WRITING WITH YOU</div><h2>Export your draft</h2><div class="stack" style="gap:14px">
        <label class="check-label"><input type="checkbox" data-export-option="includeName" ${opts.includeName ? 'checked' : ''}><span><strong>Include my name</strong><small>${state.profile.name ? esc(state.profile.name) : 'No name entered. Add it under Your focus.'}</small></span></label>
        <label class="check-label"><input type="checkbox" data-export-option="feedback" ${opts.feedback ? 'checked' : ''}><span><strong>Add space for feedback</strong><small>Starts each question on a new page, with three reflection spaces.</small></span></label>
        <label class="check-label"><input type="checkbox" data-export-option="includeNotes" ${opts.includeNotes ? 'checked' : ''}><span><strong>Include all planning notes</strong><small>Includes unused ideas and feedback notes. Review the preview before sharing.</small></span></label>
      </div><div class="export-buttons"><button class="button primary full" data-action="export-word">Download editable Word document <span aria-hidden="true">↓</span></button><button class="button secondary full" data-action="print">Print / save as PDF</button><button class="button ghost full small" data-action="export-text">Download plain text</button></div><p class="small-text muted no-margin">Word and PDF are for editing or feedback. They do not reopen your notes in this tool. Use <strong>Save progress</strong> as well.</p></section>
      <section class="panel"><h3>Copy or return to an answer</h3>${C.questions.map(q => `<div class="row between" style="padding:8px 0"><strong class="small-text">Question ${q.number}</strong><div class="row gap-small"><button class="text-button small-text" data-action="draft-for-question" data-q="${q.id}">Edit</button><button class="button secondary small" data-action="copy" data-q="${q.id}" ${!state.drafts[q.id] ? 'disabled' : ''}>Copy</button></div></div>`).join('')}<p class="small-text muted spacer no-margin">Copy includes only the answer, not its heading or any guidance.</p></section></aside></div>
      <div class="row between spacer" style="margin-bottom:16px"><div><div class="eyebrow">CHECK WHAT YOU ARE SHARING</div><h2 class="no-margin">Document preview</h2></div><button class="button secondary" data-action="save">Save progress file <span aria-hidden="true">↓</span></button></div><div id="export-preview">${E.previewHTML(state, opts)}</div>
      <div class="form-actions"><button class="button secondary" data-action="nav" data-view="draft">Keep editing</button><button class="text-button small-text" data-action="finish">Finish &amp; clear this session</button></div>`;
  }

  // ── 3. Drafts, ideas and version snapshots ───────────────────────────────────
  function setDraft(qid, text) {
    state.drafts[qid] = text; state.reviewed[qid] = false; state.checks = {};
    const flag = $(`[data-reviewed="${qid}"]`);
    if (flag) { flag.checked = false; flag.disabled = !text.trim(); }
    changed();
  }
  function addVersion(label) {
    if (state.versions.length >= MAX_VERSIONS) { toast('The version list is full. Download your progress file, then remove an old version before saving another.', 10000); return false; }
    state.versions.push({ id: uid(), label, date: new Date().toISOString(), drafts: clone(state.drafts), selected: clone(state.selected), reviewed: clone(state.reviewed), checks: clone(state.checks) });
    changed(); return true;
  }
  function requestBuild(qid) {
    const pieces = state.selected[qid].map(getIdea).filter(i => i && i.q === qid && i.snippet.trim());
    if (!pieces.length) { toast('Select at least one writing piece first.'); return; }
    const text = pieces.map(i => i.snippet).join('\n\n');
    if (text === state.drafts[qid]) { toast('The selected pieces already match this answer.'); return; }
    const apply = () => {
      if (state.drafts[qid].trim() && !addVersion(`Before rebuilding Question ${question(qid).number}`)) return;
      setDraft(qid, text); render({ scroll: false }); toast('Your pieces have been joined without rewriting them. Now edit the answer so it flows.');
    };
    showDialog('Build this answer?', `<p>${state.drafts[qid].trim() ? '<strong>This will replace the current answer.</strong> A version of all three current answers will be kept first. Your notes and short pieces are unchanged.' : 'Your selected pieces will be joined below. You can then edit the full answer.'}</p><div class="quote-example" style="white-space:pre-wrap;max-height:240px;overflow:auto">${esc(text)}</div><p class="small-text">${nice(charCount(text))} characters. No wording has been generated or added between the pieces.</p>`, [
      { label: 'Cancel', kind: 'secondary' }, { label: 'Use these pieces', kind: 'primary', run: apply }
    ]);
  }
  function newIdea(catID = 'other', qid = '', direct = false) {
    const cat = category(catID), target = qid || cat.q;
    if (state.ideas.length >= 200) { toast('This project has 200 ideas. Save a backup and remove an unused idea before adding more.'); return; }
    if (direct) {
      const idea = { id: uid(), title: '', category: cat.id, q: target, notes: { detail: '', learning: '', relevance: '' }, snippet: '' };
      state.ideas.push(idea); state.ui.ideaId = idea.id; state.ui.ideaStep = 0; changed(); go(target); return;
    }
    showDialog('Capture an idea', `<p>A short title and a few rough notes are enough. You can decide what to use later.</p>
      <div class="field"><label for="new-title">A short title</label><input id="new-title" type="text" placeholder="For example, helping a new colleague" autocomplete="off"></div>
      <div class="inline-fields spacer"><div class="field"><label for="new-category">Type of experience</label><select id="new-category">${C.categories.map(c => `<option value="${c.id}" ${c.id === cat.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></div><div class="field"><label for="new-question">Suggested home</label><select id="new-question">${C.questions.map(q => `<option value="${q.id}" ${q.id === target ? 'selected' : ''}>Question ${q.number}</option>`).join('')}</select></div></div>
      <div class="field"><label for="new-detail">Rough notes (optional)</label><p class="field-hint" id="new-starter">${esc(cat.starter)}</p><textarea id="new-detail" rows="4" aria-describedby="new-starter" placeholder="What happened, what interested you, or what you did…"></textarea></div>`, [
      { label: 'Cancel', kind: 'ghost' },
      { label: 'Keep in idea bank', kind: 'secondary', run: () => createIdeaFromDialog(false) },
      { label: 'Develop this idea', kind: 'primary', run: () => createIdeaFromDialog(true) }
    ]);
  }
  function createIdeaFromDialog(develop) {
    const title = $('#new-title').value, detail = $('#new-detail').value;
    if (!title.trim() && !detail.trim()) { $('#new-title').setCustomValidity('Add a short title or a few notes so you can recognise this idea.'); $('#new-title').reportValidity(); $('#new-title').setCustomValidity(''); return false; }
    const idea = { id: uid(), title, category: $('#new-category').value, q: $('#new-question').value, notes: { detail, learning: '', relevance: '' }, snippet: '' };
    state.ideas.push(idea); state.ui.ideaId = idea.id; state.ui.ideaStep = 0; changed(); go(develop ? idea.q : 'ideas');
  }
  function deleteIdea(id) {
    const idea = getIdea(id); if (!idea) return;
    showDialog('Delete this idea?', `<p><strong>${esc(idea.title || 'Untitled idea')}</strong></p><p>This removes its notes and short writing piece. Text already assembled in an answer is not removed. Save a progress backup first if you might need this idea later.</p>`, [
      { label: 'Cancel', kind: 'secondary' }, { label: 'Delete idea', kind: 'danger', run: () => { state.ideas = state.ideas.filter(i => i.id !== id); for (const q of QIDS) state.selected[q] = state.selected[q].filter(x => x !== id); changed(); render({ scroll: false }); } }
    ]);
  }
  function ideaSettings(id) {
    const idea = getIdea(id); if (!idea) return;
    showDialog('Where does this idea fit?', `<p>Changing the type changes the prompts, not your notes. Moving the idea changes where you can select its writing piece. Edited answer text is never moved or deleted automatically.</p>
      <div class="field"><label for="move-category">Type of experience</label><select id="move-category">${C.categories.map(c => `<option value="${c.id}" ${c.id === idea.category ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></div>
      <div class="field"><label for="move-question">Use with</label><select id="move-question">${C.questions.map(q => `<option value="${q.id}" ${q.id === idea.q ? 'selected' : ''}>Question ${q.number}: ${q.short}</option>`).join('')}</select></div>`, [
      { label: 'Cancel', kind: 'secondary' }, { label: 'Keep these changes', kind: 'primary', run: () => {
        const newQ = $('#move-question').value; idea.category = $('#move-category').value;
        if (newQ !== idea.q) { for (const q of QIDS) state.selected[q] = state.selected[q].filter(x => x !== id); idea.q = newQ; }
        changed(); go(newQ);
      } }
    ]);
  }
  function saveVersionDialog() {
    if (answersEmpty()) { toast('Write or assemble at least one answer before saving a draft version.'); return; }
    showDialog('Keep a draft version', `<p>A snapshot of your three answers will be kept inside this project. Your idea bank is not rolled back when you restore a draft version.</p><div class="field"><label for="version-label">Version name</label><input id="version-label" type="text" maxlength="160" value="Draft ${state.versions.length+1}" autocomplete="off"></div><p class="small-text spacer">This is not a separate file or backup. Download your progress file afterwards to keep the version beyond this session.</p>`, [
      { label: 'Cancel', kind: 'secondary' }, { label: 'Keep version', kind: 'primary', run: () => { if (addVersion($('#version-label').value.trim() || 'Untitled version')) { render({ scroll: false }); toast('Draft version kept. Save progress to include it in your take-away file.'); } } }
    ]);
  }
  function versionsDialog() {
    showDialog('Your draft versions', `<p>Restoring a version replaces the three answers, not your notes. The current answers are saved as another version first.</p>${state.versions.length ? `<div class="versions-list">${[...state.versions].reverse().map(v => `<div class="version-item"><strong>${esc(v.label)}</strong><p>${esc(dateLabel(v.date))} · ${nice(QIDS.reduce((n,q) => n+charCount(v.drafts[q]),0))} characters</p><div class="row"><button class="button secondary small" data-action="restore-version" data-id="${v.id}">Restore</button><button class="button ghost small" data-action="delete-version" data-id="${v.id}">Delete</button></div></div>`).join('')}</div>` : '<div class="notice info">No versions yet. Use “Save a draft version” before a substantial edit.</div>'}`, [{ label: 'Close', kind: 'secondary' }]);
  }
  function restoreVersion(id) {
    const version = state.versions.find(v => v.id === id); if (!version) return;
    showDialog('Restore this draft?', `<p><strong>${esc(version.label)}</strong></p><p>Your current answers will be kept as a version before this one is restored. The idea bank stays as it is now.</p>`, [
      { label: 'Cancel', kind: 'secondary', run: versionsDialog }, { label: 'Restore version', kind: 'primary', run: () => {
        if (!addVersion('Before restoring an earlier version')) return;
        state.drafts = clone(version.drafts); state.reviewed = clone(version.reviewed); state.checks = clone(version.checks);
        state.selected = Object.fromEntries(QIDS.map(q => [q, version.selected[q].filter(id => getIdea(id)?.q === q)]));
        changed(); go('draft'); toast('Earlier answers restored. Your notes and writing pieces are unchanged.');
      } }
    ]);
  }

  // ── 4. Progress files and optional browser storage ───────────────────────────
  function saveProgress() {
    if (!started) return;
    state.updatedAt = new Date().toISOString();
    const json = JSON.stringify(state, null, 2);
    E.download(new Blob([json], { type: 'application/json;charset=utf-8' }), E.filename(state, 'progress', 'ucas.json'));
    backupRevision = revision; downloadedAt = new Date().toISOString(); updateIndicators();
    toast('Progress-file download requested. Check your Downloads or chosen save location before closing. This file contains all notes and draft versions.', 10000);
  }
  function saveToDevice() {
    clearTimeout(storageTimer); if (!remember || !started) return;
    try {
      const savedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ session: tabID, savedAt, data: state }));
      deviceSavedAt = savedAt; storageError = ''; cached = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      remember = false; storageError = 'Browser saving failed. Your current work is still in this tab — download a progress file.';
      toast(storageError, 12000);
    }
    updateIndicators();
  }
  function removeBrowserCopy() {
    clearTimeout(storageTimer);
    try { localStorage.removeItem(STORAGE_KEY); cached = null; deviceSavedAt = ''; storageError = ''; return true; }
    catch { toast('The browser copy could not be removed. Use your browser’s site-data controls before leaving a shared device.', 12000); return false; }
  }
  function resumeBrowserCopy() {
    try {
      const saved = JSON.parse(cached), restored = validateState(saved.data);
      state = restored; started = true; remember = true; revision = 0; backupRevision = -1; downloadedAt = ''; deviceSavedAt = saved.savedAt || '';
      render(); toast('Browser copy opened. Download a progress file as a portable backup.');
    } catch {
      showDialog('This browser copy could not be opened', '<p>Your stored copy has not been changed. Download it for safekeeping before removing it or starting again.</p>', [
        { label: 'Close', kind: 'secondary' }, { label: 'Download the stored copy', kind: 'primary', run: () => E.download(new Blob([cached || ''], { type: 'text/plain' }), 'personal-statement-browser-copy.txt') }
      ]);
    }
  }
  async function openProgressFile(file) {
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('This file is too large. The maximum progress-file size is 4 MB.');
      const restored = validateState(JSON.parse(await file.text()));
      const apply = () => {
        clearTimeout(storageTimer);
        // Opening a different project switches to shared mode and clears an older browser copy.
        // The confirmation below explains this before anything is replaced.
        if (cached && !removeBrowserCopy()) return;
        state = restored; started = true; remember = false; revision = 0; backupRevision = 0; downloadedAt = ''; deviceSavedAt = ''; storageError = '';
        render(); toast('Progress file opened. Further changes stay in this tab until you save again.');
      };
      if ((started && hasWork()) || cached) {
        showDialog('Open this progress file?', `<p><strong>${esc(file.name)}</strong></p><p>This replaces the current workspace and removes any older browser copy of this tool’s work. Download anything you need first. The selected file and previous downloaded files are not changed.</p>`, [
          { label: 'Cancel', kind: 'secondary' },
          ...(started ? [{ label: 'Download current work first', kind: 'secondary', run: () => { saveProgress(); return false; } }] : []),
          { label: 'Open selected file', kind: 'primary', run: apply }
        ]);
      } else apply();
    } catch (error) {
      showDialog('That progress file could not be opened', `<p>${esc(error instanceof SyntaxError ? 'This is not a valid JSON progress file. Choose a .ucas.json file downloaded from this workshop, not a Word or PDF document.' : error.message)}</p><p>Your current work has not been changed.</p>`, [{ label: 'Keep working', kind: 'primary' }]);
    }
  }
  function validateState(raw) {
    const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
    const fail = message => { throw new Error(message); };
    if (!object(raw) || raw.format !== FORMAT) fail('This is not a Personal Statement Workshop progress file.');
    if (raw.schemaVersion !== 1) fail('This file uses a different save format. Keep the file and use the matching or a newer version of the workshop.');
    const text = (x, fallback = '', max = 150000) => { if (x === undefined) return fallback; if (typeof x !== 'string' || x.length > max) fail('A text field is invalid or unusually large. The file has not been loaded.'); return x; };
    const id = x => { if (typeof x !== 'string' || !/^[a-zA-Z0-9_-]{1,90}$/.test(x)) fail('An item identifier in this file is invalid.'); return x; };
    const date = x => { if (typeof x !== 'string' || !Number.isFinite(Date.parse(x))) fail('A date in this progress file is invalid.'); return x; };
    const qMap = (source, transform) => { if (!object(source)) fail('A question section is missing or invalid.'); return Object.fromEntries(QIDS.map(q => [q, transform(source[q],q)])); };
    const selectedMap = source => qMap(source, x => { if (!Array.isArray(x) || x.length > 200) fail('The selected writing pieces are invalid.'); const items = x.map(id); if (new Set(items).size !== items.length) fail('The file has repeated item identifiers.'); return items; });
    const reviewMap = source => qMap(source, x => { if (typeof x !== 'boolean') fail('A review flag is invalid.'); return x; });
    const checksMap = source => { if (!object(source)) fail('The review checklist is invalid.'); const checks = {}; for (const c of C.reviewChecks) if (Object.hasOwn(source, c.id)) { if (typeof source[c.id] !== 'boolean') fail('A checklist flag is invalid.'); checks[c.id] = source[c.id]; } return checks; };
    const out = blankState(); out.createdAt = date(raw.createdAt); out.updatedAt = date(raw.updatedAt);
    if (!object(raw.profile)) fail('This file is missing its subject information.');
    for (const key of Object.keys(out.profile)) out.profile[key] = text(raw.profile[key], out.profile[key], 20000);
    if (!Array.isArray(raw.ideas) || raw.ideas.length > 200) fail('This file has an invalid idea bank.');
    out.ideas = raw.ideas.map(i => {
      if (!object(i) || !object(i.notes) || !QIDS.includes(i.q)) fail('An idea in this file is incomplete.');
      return { id: id(i.id), title: text(i.title), category: category(i.category).id, q: i.q, notes: { detail: text(i.notes.detail), learning: text(i.notes.learning), relevance: text(i.notes.relevance) }, snippet: text(i.snippet) };
    });
    if (new Set(out.ideas.map(i => i.id)).size !== out.ideas.length) fail('This file has duplicate ideas with the same identifier.');
    out.drafts = qMap(raw.drafts, x => text(x)); out.selected = selectedMap(raw.selected); out.reviewed = reviewMap(raw.reviewed); out.checks = checksMap(raw.checks || {});
    for (const q of QIDS) if (out.selected[q].some(id => !out.ideas.some(i => i.id === id && i.q === q))) fail('A selected writing piece is missing or assigned to the wrong question.');
    if (!Array.isArray(raw.versions) || raw.versions.length > MAX_VERSIONS) fail('This file has an invalid draft-version list.');
    out.versions = raw.versions.map(v => {
      if (!object(v)) fail('A draft version is invalid.');
      return { id: id(v.id), label: text(v.label, 'Draft version', 1000), date: date(v.date), drafts: qMap(v.drafts, x => text(x)), selected: selectedMap(v.selected), reviewed: reviewMap(v.reviewed), checks: checksMap(v.checks || {}) };
    });
    if (new Set(out.versions.map(v => v.id)).size !== out.versions.length) fail('This file has duplicate version identifiers.');
    out.nextSteps = text(raw.nextSteps);
    if (object(raw.exportOptions)) for (const key of Object.keys(out.exportOptions)) out.exportOptions[key] = raw.exportOptions[key] === true;
    if (object(raw.ui)) {
      out.ui.view = views.some(v => v[0] === raw.ui.view) ? raw.ui.view : 'focus';
      out.ui.ideaId = out.ideas.some(i => i.id === raw.ui.ideaId) ? raw.ui.ideaId : '';
      out.ui.ideaStep = Number.isInteger(raw.ui.ideaStep) && raw.ui.ideaStep >= 0 && raw.ui.ideaStep <= 3 ? raw.ui.ideaStep : 0;
      out.ui.draftQuestion = QIDS.includes(raw.ui.draftQuestion) ? raw.ui.draftQuestion : 'q1';
    }
    return out;
  }

  // ── 5. Dialogs, help and privacy controls ────────────────────────────────────
  function showDialog(title, body, actions) {
    const modal = $('#modal'); if (modal.open) modal.close();
    modalCallback = actions;
    modal.innerHTML = `<div class="modal-inner"><h2 id="modal-title">${esc(title)}</h2><div class="modal-body">${body}</div><div class="modal-actions">${actions.map((a,n) => `<button type="button" class="button ${a.kind || 'secondary'}" data-modal-index="${n}">${esc(a.label)}</button>`).join('')}</div></div>`;
    modal.showModal();
    modal.querySelector('[data-modal-index="0"]')?.focus();
  }
  function closeDialog() { $('#modal').close(); modalCallback = null; }
  function startNew(view = 'focus') {
    const apply = () => {
      clearTimeout(storageTimer);
      if (cached && !removeBrowserCopy()) return false;
      state = blankState(); remember = false; started = true; revision = 0; backupRevision = 0; downloadedAt = ''; deviceSavedAt = ''; storageError = '';
      go(view);
    };
    if ((started && hasWork()) || cached) showDialog('Start a new piece of work?', '<p>This clears the current workspace and any browser copy for this tool. Download your current progress first. From the welcome screen, cancel and resume the browser copy first to save it.</p>', [
      { label: 'Cancel', kind: 'secondary' }, { label: 'Start a new statement', kind: 'primary', run: apply }
    ]); else apply();
  }
  function settingsDialog() {
    showDialog('Where should this work be kept?', `<p>The application does not upload your writing. These settings only affect this browser.</p>
      <label class="check-label spacer"><input type="radio" name="device-mode" value="shared" ${!remember ? 'checked' : ''}><span><strong>Shared computer — recommended at school</strong><small>Keep work in this open tab only. Applying this mode removes this tool’s browser copy, but keeps the open workspace.</small></span></label>
      <label class="check-label spacer"><input type="radio" name="device-mode" value="personal" ${remember ? 'checked' : ''}><span><strong>My private device — remember my work</strong><small>Keep a browser copy for later. Anyone using this browser profile may be able to open it. Enabling this overwrites any existing browser copy for this tool.</small></span></label>
      <div class="notice spacer">A browser copy is not a portable backup. It can be cleared or become unavailable. Download a progress file regularly, especially before changing devices.</div>`, [
      { label: 'Cancel', kind: 'secondary' }, { label: 'Apply setting', kind: 'primary', run: () => {
        const personal = $('input[name="device-mode"]:checked').value === 'personal';
        if (!personal && cached && !removeBrowserCopy()) return false;
        remember = personal; storageError = ''; if (remember) saveToDevice(); else clearTimeout(storageTimer);
        updateIndicators(); if (!storageError) toast(remember ? 'Browser saving enabled on this device. Keep downloading progress files as backups.' : 'Shared-computer mode enabled. Your open work has not been deleted.');
      } }
    ]);
  }
  function privacyDialog() {
    showDialog('Privacy & saving', `<p><strong>The tool itself does not send your answers to a server.</strong> There are no accounts, analytics, AI calls or external fonts. External UCAS links open only when you choose them.</p>
      <p>In shared-computer mode, the tool does not write your answers to browser storage. Do not rely on closing a tab or a browser warning to protect work: save a progress file, check it exists, and use <strong>Finish &amp; clear this session</strong>.</p>
      <p>Optional personal-device saving keeps an unencrypted browser copy. Anyone with access to the same browser profile, and other scripts running on the same site, may be able to access it. Do not enable this on a shared profile.</p>
      <p><strong>Progress files contain all your notes, drafts and saved versions</strong>, even if those items are excluded from a Word export. Store them somewhere private and share only with people you trust.</p>
      <p>Clearing a session does not delete downloaded files, browser backups, operating-system backups or your browser’s own form/spelling data. Manage those separately on shared devices.</p>
      <p class="small-text">This is an independent school resource, not UCAS software. Guidance checked ${esc(C.guidanceChecked)}. ${externalLink(C.links.guidance, 'Read the official guidance')}</p>`, [{ label: 'Close', kind: 'primary' }]);
  }
  function helpDialog() {
    showDialog('How the workshop fits together', `<div class="stack"><div><h3>1. Collect ideas</h3><p>Use the idea bank or start under any question. Brief notes are enough. You can skip any prompt.</p></div><div><h3>2. Develop one small piece</h3><p>Work through detail, learning and relevance, then write your own short passage. The prompts do not generate or rewrite sentences.</p></div><div><h3>3. Build and edit</h3><p>Select writing pieces under “Build your answers”, or paste an existing draft. Edit the joined text until it flows. Nothing is cut off at the limit.</p></div><div><h3>4. Save the right thing</h3><p><strong>Save progress</strong> downloads a .ucas.json file containing the whole project. Use <strong>Open work</strong> to continue from it. <strong>Export</strong> creates a document for editing or feedback; a Word document is not a progress file.</p></div></div><div class="notice">Three separate answers. At least 350 characters each; no more than 4,000 in total including spaces. There is no required equal split. Check the final text in UCAS.</div><p class="small-text spacer">On a computer, Ctrl+S / ⌘S downloads your progress while the workshop is open. Browser print can produce a PDF; select “Save as PDF” where available.</p><p class="small-text">${externalLink(C.links.guidance, 'UCAS personal statement guidance')} · ${externalLink(C.links.ai, 'UCAS guidance on using AI')}</p>`, [{ label: 'Back to the workshop', kind: 'primary' }]);
  }
  function finishDialog() {
    showDialog('Finish & clear this session', `<p>This clears the open workspace and this tool’s browser copy. It does not delete any files you have already downloaded.</p>
      <div class="notice"><strong>Save before clearing.</strong> A Word document does not contain your whole project. Check that your latest progress file is in Downloads or your chosen folder.</div>
      <label class="check-label spacer"><input id="clear-ack" type="checkbox"><span>I have kept everything I need, or I am happy to discard this work.</span></label>
      <p class="small-text spacer">On a shared device, also remove any private files left in Downloads and close document previews.</p>`, [
      { label: 'Cancel', kind: 'secondary' }, { label: 'Download progress first', kind: 'secondary', run: () => { saveProgress(); return false; } },
      { label: 'Clear this session', kind: 'danger', run: () => {
        if (!$('#clear-ack').checked) { $('#clear-ack').focus(); toast('Confirm that you have kept the work you need before clearing.'); return false; }
        clearTimeout(storageTimer);
        if (cached && !removeBrowserCopy()) return false;
        state = blankState(); started = false; remember = false; cached = null; revision = 0; backupRevision = 0; downloadedAt = ''; deviceSavedAt = ''; storageError = '';
        $('#print-root').innerHTML = ''; render(); toast('This session and the tool’s browser copy have been cleared. Downloaded files have not been deleted.');
      } }
    ]);
  }
  async function copyAnswer(qid) {
    const text = state.drafts[qid]; if (!text) { toast('There is no answer to copy yet.'); return; }
    try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text); toast(`Question ${question(qid).number} copied — answer text only.`); }
    catch {
      showDialog('Copy your answer', `<p>Automatic clipboard access is unavailable. The answer below is selected so you can copy it manually.</p><div class="field"><label for="copy-answer">Question ${question(qid).number} — answer text only</label><textarea id="copy-answer" readonly rows="10">${esc(text)}</textarea></div>`, [{ label: 'Done', kind: 'primary' }]);
      $('#copy-answer').focus(); $('#copy-answer').select();
    }
  }
  function refreshPreview() { const preview = $('#export-preview'); if (preview) preview.innerHTML = E.previewHTML(state, state.exportOptions); }
  function preparePrint() { $('#print-root').innerHTML = E.previewHTML(state, state.exportOptions); }

  // ── 6. Event handlers (delegation keeps the render functions simple) ──────────
  document.addEventListener('click', event => {
    const modalButton = event.target.closest('[data-modal-index]');
    if (modalButton && modalCallback) {
      const current = modalCallback, action = current[Number(modalButton.dataset.modalIndex)];
      try { const result = action.run?.(); if (result !== false && modalCallback === current) closeDialog(); }
      catch (error) { toast(`The action could not finish: ${error.message}. Your open work is still here.`, 10000); }
      return;
    }
    const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
    const d = button.dataset;
    try {
      switch (d.action) {
        case 'home': if (started) go('focus'); break;
        case 'start': startNew('focus'); break;
        case 'existing': startNew('draft'); break;
        case 'resume': resumeBrowserCopy(); break;
        case 'nav': go(d.view); break;
        case 'help': helpDialog(); break;
        case 'privacy': privacyDialog(); break;
        case 'settings': settingsDialog(); break;
        case 'save': saveProgress(); break;
        case 'open': $('#open-file').click(); break;
        case 'finish': finishDialog(); break;
        case 'clear-cached': showDialog('Remove the browser copy?', '<p>This removes only this tool’s stored browser copy. Downloaded progress files are not affected. Resume and save it first if you need it.</p>', [{ label: 'Cancel', kind: 'secondary' }, { label: 'Remove browser copy', kind: 'danger', run: () => { if (removeBrowserCopy()) render(); } }]); break;
        case 'new-idea': newIdea(d.category || 'other', d.q || ''); break;
        case 'add-template': newIdea(d.category, d.q, true); break;
        case 'edit-idea': { const idea = getIdea(d.id); if (idea) { state.ui.ideaId = idea.id; state.ui.ideaStep = idea.snippet.trim() ? 3 : 0; go(idea.q); } break; }
        case 'choose-idea': state.ui.ideaId = d.id; state.ui.ideaStep = 0; scheduleStorage(); render({ scroll: false }); break;
        case 'prompt-step': state.ui.ideaStep = Math.max(0, Math.min(3, Number(d.step))); scheduleStorage(); render({ scroll: false }); $('#idea-response')?.focus({ preventScroll: true }); break;
        case 'keep-piece': toast(getIdea(state.ui.ideaId)?.snippet.trim() ? 'Your writing piece is kept in this session. It is ready to select under “Build your answers”. Save progress before leaving.' : 'Your notes are kept in this session. You can return to write the passage later.'); break;
        case 'idea-settings': ideaSettings(d.id); break;
        case 'delete-idea': deleteIdea(d.id); break;
        case 'draft-for-question': state.ui.draftQuestion = d.q; go('draft'); break;
        case 'draft-tab': state.ui.draftQuestion = d.q; scheduleStorage(); render({ scroll: false }); break;
        case 'build-answer': requestBuild(d.q); break;
        case 'move-piece': {
          const list = state.selected[state.ui.draftQuestion], index = list.indexOf(d.id), target = index + Number(d.direction);
          if (index >= 0 && target >= 0 && target < list.length) { [list[index],list[target]] = [list[target],list[index]]; changed(); render({ focus: false, scroll: false }); $(`#select-${d.id}`)?.focus({ preventScroll: true }); }
          break;
        }
        case 'save-version': saveVersionDialog(); break;
        case 'versions': versionsDialog(); break;
        case 'restore-version': restoreVersion(d.id); break;
        case 'delete-version': {
          const v = state.versions.find(v => v.id === d.id); if (!v) break;
          showDialog('Delete this saved version?', `<p>${esc(v.label)}</p><p>Your current answers are not changed. This saved version will be removed from the project.</p>`, [{ label: 'Cancel', kind: 'secondary', run: versionsDialog }, { label: 'Delete version', kind: 'danger', run: () => { state.versions = state.versions.filter(v => v.id !== d.id); changed(); render({ focus: false, scroll: false }); versionsDialog(); } }]); break;
        }
        case 'copy': void copyAnswer(d.q); break;
        case 'export-word': E.exportDocx(state, state.exportOptions); toast('Word download requested. Check your download, and also save a progress file to keep your notes and versions.'); break;
        case 'export-text': E.exportText(state, state.exportOptions); toast('Plain-text download requested. Your progress file is saved separately.'); break;
        case 'print': preparePrint(); window.print(); break;
      }
    } catch (error) { toast(`Something could not finish: ${error.message}. Save your progress before trying again.`, 10000); }
  });
  document.addEventListener('input', event => {
    const el = event.target, d = el.dataset;
    if (d.profile && Object.hasOwn(state.profile, d.profile)) { state.profile[d.profile] = el.value; changed(); }
    else if (d.note) {
      const idea = getIdea(state.ui.ideaId); if (!idea || !Object.hasOwn(idea.notes,d.note)) return;
      idea.notes[d.note] = el.value; changed(); const preview = $(`[data-note-preview="${d.note}"]`); if (preview) preview.textContent = el.value || 'Nothing recorded yet — this is optional.';
    } else if (d.ideaField) {
      const idea = getIdea(state.ui.ideaId); if (!idea || !['title','snippet'].includes(d.ideaField)) return;
      idea[d.ideaField] = el.value;
      if (d.ideaField === 'snippet' && !el.value.trim()) for (const q of QIDS) state.selected[q] = state.selected[q].filter(id => id !== idea.id);
      changed();
    } else if (d.draft && QIDS.includes(d.draft)) setDraft(d.draft, el.value);
    else if (Object.hasOwn(d, 'nextSteps')) { state.nextSteps = el.value; changed(); if (state.exportOptions.includeNotes) refreshPreview(); }
  });
  document.addEventListener('change', event => {
    const el = event.target, d = el.dataset;
    if (Object.hasOwn(d, 'navSelect')) { go(el.value); return; }
    if (el.id === 'new-category') { const cat = category(el.value); $('#new-question').value = cat.q; $('#new-starter').textContent = cat.starter; return; }
    if (d.selectPiece) {
      const list = state.selected[d.q];
      if (el.checked && !list.includes(d.selectPiece)) list.push(d.selectPiece);
      if (!el.checked) state.selected[d.q] = list.filter(id => id !== d.selectPiece);
      changed(); render({ focus: false, scroll: false }); $(`#select-${d.selectPiece}`)?.focus({ preventScroll: true });
    } else if (d.reviewed && QIDS.includes(d.reviewed)) { state.reviewed[d.reviewed] = el.checked; changed(); }
    else if (d.check && C.reviewChecks.some(c => c.id === d.check)) { state.checks[d.check] = el.checked; changed(); }
    else if (d.exportOption && Object.hasOwn(state.exportOptions,d.exportOption)) { state.exportOptions[d.exportOption] = el.checked; changed(); refreshPreview(); }
  });
  $('#open-file').addEventListener('change', event => { const file = event.target.files[0]; event.target.value = ''; void openProgressFile(file); });
  $('#modal').addEventListener('cancel', () => { modalCallback = null; });
  document.addEventListener('keydown', event => {
    if (started && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveProgress(); }
  });
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('beforeunload', event => {
    if (remember) saveToDevice();
    if (started && hasWork() && revision !== backupRevision && !remember) { event.preventDefault(); event.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && remember) saveToDevice(); });
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    cached = event.newValue;
    if (remember) {
      clearTimeout(storageTimer); remember = false; storageError = 'Another tab changed the browser copy. This tab is now in shared-computer mode; save a progress file.';
      updateIndicators(); toast(storageError, 12000);
    } else if (!started) render({ focus: false, scroll: false });
  });
  try { cached = localStorage.getItem(STORAGE_KEY); } catch { cached = null; }
  // Read-only helpers for maintenance and browser tests. They do not transmit data.
  window.PSW_APP = Object.freeze({ version: VERSION, getSnapshot: () => clone(state), countCharacters: charCount, validateProgress: validateState });
  render({ focus: false });
})();
