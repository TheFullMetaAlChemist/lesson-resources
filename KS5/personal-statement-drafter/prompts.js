/* PERSONAL STATEMENT WORKSHOP — TEACHING CONTENT
   Edit this file to change questions, prompts and examples.
   Use quotation marks around text and keep the commas between entries.
   IDs are permanent save-file references: keep existing IDs when changing wording.
   Official question wording: UCAS. All other prompts/examples are original.
   Guidance checked: 15 September 2026. See README for sources. */
window.PSW_CONTENT = {
  version: '1.0.0', guidanceChecked: '15 September 2026',
  limits: { minimum: 350, total: 4000 },
  links: {
    guidance: 'https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement-for-2026-entry-onwards',
    subjects: 'https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/personal-statement-guides',
    ai: 'https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/a-guide-to-using-ai-and-chatgpt-with-your-personal-statement'
  },
  questions: [
    {
      id: 'q1', number: 1, short: 'Your subject interest',
      official: 'Why do you want to study this course or subject?',
      purpose: 'Show what interests you, how you have explored it and what you would like to understand next.',
      reassurance: 'You do not need a dramatic origin story or a fixed career plan. Start with one specific thing that genuinely interests you.',
      suggested: ['interest', 'reading', 'exploration', 'future'],
      nudges: ['Name a topic or question, rather than saying you like the whole subject.', 'Explain what you took from an experience, not just that you did it.', 'Look ahead to what you would like to investigate through further study.'],
      example: {
        context: 'Fictional geography example — a thinking model, not text to copy.',
        before: 'I am passionate about geography and enjoyed my regeneration project.',
        after: 'Comparing land use on two nearby streets challenged my assumption that regeneration benefits an area evenly. It made me question how success should be measured and whose experiences should count.',
        why: 'The second version names a specific question and explains how the student’s thinking developed.'
      }
    },
    {
      id: 'q2', number: 2, short: 'Learning & studies',
      official: 'How have your qualifications and studies helped you to prepare for this course or subject?',
      purpose: 'Use a particular piece of learning to explain how your studies have prepared you for further study.',
      reassurance: 'You do not need to describe every subject or repeat your grades. A well-explained example is more useful than a list of skills.',
      suggested: ['project', 'practical', 'essay', 'problem', 'vocational'],
      nudges: ['Explain what you did yourself, rather than only describing the assignment.', 'Describe where you used a skill: what evidence did you compare or what problem did you solve?', 'Make a genuine connection to the way you will learn on your course.'],
      example: {
        context: 'Fictional science example — notice the specific action and reflection.',
        before: 'Chemistry has given me good practical and analytical skills.',
        after: 'When repeated titrations gave inconsistent results, I reviewed my technique and repeated the measurements more carefully. This helped me understand why a result needs to be evaluated, not simply recorded.',
        why: 'The student shows an action and what it taught them, rather than simply claiming to have a skill.'
      }
    },
    {
      id: 'q3', number: 3, short: 'Beyond education',
      official: 'What else have you done to prepare outside of education, and why are these experiences useful?',
      purpose: 'Reflect on experiences outside formal education and explain what they have helped you understand or develop.',
      reassurance: 'Paid work, independent learning and everyday responsibilities can provide useful material. You never have to disclose a difficult or private experience.',
      suggested: ['work', 'volunteering', 'placement', 'independent', 'responsibility', 'activity'],
      nudges: ['An experience does not need to sound impressive; explain why it matters.', 'For work experience, explain what you noticed and learned, not just where you went.', 'Protect other people’s privacy. Do not include names or identifying details about patients, clients or people you support.'],
      example: {
        context: 'Fictional part-time work example — the student still needs to connect it to their course.',
        before: 'Working in a café has improved my communication and teamwork.',
        after: 'Explaining unfamiliar tasks to a new colleague showed me that instructions which seem obvious to me are not always clear to someone else. I learned to check understanding and adapt how I explained each step.',
        why: 'This gives a specific example of learning from an ordinary responsibility, without inventing a prestigious placement.'
      }
    }
  ],
  // Each category supplies three follow-up prompts. Students may skip any field.
  categories: [
    { id: 'interest', label: 'A topic or question', q: 'q1', starter: 'What question would you like to understand better?', detail: 'What is the specific question, problem or idea that interests you?', learning: 'Why does it interest you? What have you started to understand or question?', relevance: 'What would you like to explore more deeply through your chosen course?', opener: 'I became particularly interested in…' },
    { id: 'reading', label: 'Reading, listening or watching', q: 'q1', starter: 'Think of an idea from an article, book, podcast or documentary.', detail: 'What did you read, hear or watch? Which particular idea stood out?', learning: 'What did you agree with, question or understand differently afterwards?', relevance: 'How did it develop your interest? What did you do, or want to investigate, next?', opener: 'An idea that made me reconsider…' },
    { id: 'exploration', label: 'A visit, talk or subject taster', q: 'q1', starter: 'What did you notice that made you think differently?', detail: 'What did you attend or explore, and what specific detail caught your attention?', learning: 'What did you learn that went beyond what you already knew?', relevance: 'How did this help you understand the subject or your reasons for studying it?', opener: 'During… I was interested by…' },
    { id: 'future', label: 'Something to explore next', q: 'q1', starter: 'No fixed career plan is needed. What would you like to learn?', detail: 'Which area of further study or possible career interests you?', learning: 'What have you already learned about it? What is still an open question for you?', relevance: 'How does this connect with the courses you are considering?', opener: 'I would like to explore… because…' },
    { id: 'project', label: 'A project, coursework or EPQ', q: 'q2', starter: 'Choose one project, not a list of everything you have studied.', detail: 'What did you investigate or create? What was your own contribution?', learning: 'What did you discover? How did you choose sources, evaluate evidence or change your approach?', relevance: 'How has this prepared you for the subject or the way you will study it?', opener: 'In my investigation into… I…' },
    { id: 'practical', label: 'Practical work or fieldwork', q: 'q2', starter: 'Think of a moment when you had to make a decision.', detail: 'What were you investigating? What did you measure, observe or test?', learning: 'What did you learn about the evidence or your method? What did you do when results were unexpected?', relevance: 'How will this understanding or approach help you in further study?', opener: 'When investigating… I noticed…' },
    { id: 'essay', label: 'An essay, argument or source', q: 'q2', starter: 'Was there an argument you had to weigh up?', detail: 'Which question or interpretation did you examine? What evidence did you use?', learning: 'Did comparing sources or viewpoints change your conclusion? Explain how.', relevance: 'How has this developed the way you read, reason or communicate about your subject?', opener: 'Comparing… with… led me to…' },
    { id: 'problem', label: 'Problem-solving, design or making', q: 'q2', starter: 'What did you try when your first approach did not work?', detail: 'Describe a particular problem, design brief, performance or technical task.', learning: 'What choices did you make? What did testing, practice or feedback teach you?', relevance: 'What does this show about how you learn or approach the work in your chosen field?', opener: 'To solve… I tried…' },
    { id: 'vocational', label: 'Training or a vocational unit', q: 'q2', starter: 'Choose a task that links knowledge with its application.', detail: 'What unit, training or assessed task did you complete? What did you do?', learning: 'How did applying your knowledge develop your understanding or judgement?', relevance: 'Which part of this preparation is relevant to your intended course?', opener: 'Applying… to… helped me understand…' },
    { id: 'work', label: 'Paid work', q: 'q3', starter: 'Think of a responsibility, not just your job title.', detail: 'What responsibility or situation did you handle? What did you actually do?', learning: 'What did it teach you about working with people, solving problems or managing responsibilities?', relevance: 'How might this help you with the demands of your intended course?', opener: 'Taking responsibility for… taught me…' },
    { id: 'volunteering', label: 'Volunteering or community work', q: 'q3', starter: 'What did you contribute, and what did you learn?', detail: 'Describe a specific task or contribution without identifying people you supported.', learning: 'What did you notice about people’s needs, working with others or the service itself?', relevance: 'How has this informed your understanding or helped you prepare for further study?', opener: 'Through helping with… I came to understand…' },
    { id: 'placement', label: 'Work experience or shadowing', q: 'q3', starter: 'Observation can be useful when you explain what it taught you.', detail: 'What did you observe or do? Focus on one relevant aspect, without confidential details.', learning: 'What did this reveal about the work, its challenges or the qualities it requires?', relevance: 'How did it affect your expectations or your preparation for the course?', opener: 'Observing… challenged my assumption that…' },
    { id: 'independent', label: 'An independent project or learning', q: 'q3', starter: 'This could be something you made, investigated or taught yourself.', detail: 'What did you choose to learn or create outside formal study?', learning: 'What obstacle did you encounter? How did you adapt, and what did you learn?', relevance: 'How does this connect with your subject interest or readiness for further study?', opener: 'Teaching myself… involved…' },
    { id: 'responsibility', label: 'Personal or caring responsibilities', q: 'q3', starter: 'Only share what you are comfortable discussing. Private details are not needed.', detail: 'Which responsibility are you comfortable describing in general terms?', learning: 'What has handling this responsibility helped you understand or develop?', relevance: 'How might that learning help you with your course or with independent study?', opener: 'Managing… has helped me develop…' },
    { id: 'activity', label: 'A club, sport or creative activity', q: 'q3', starter: 'Think about your contribution and sustained involvement.', detail: 'What did you contribute, practise, organise or create?', learning: 'What did feedback, collaboration or commitment help you learn?', relevance: 'Why is this useful preparation for your course? Keep the connection genuine.', opener: 'Working towards… taught me…' },
    { id: 'other', label: 'Another experience or idea', q: 'q1', starter: 'Start with something genuine, however small.', detail: 'What happened or what did you do? Include one concrete detail.', learning: 'What did you learn, notice or begin to question?', relevance: 'Why does this matter for the subject you want to study?', opener: 'One experience that changed my thinking was…' }
  ],
  reviewChecks: [
    { id: 'interest', title: 'My interest is specific.', detail: 'I explain what interests me about the subject, rather than only saying I am enthusiastic.' },
    { id: 'evidence', title: 'My claims have evidence.', detail: 'I describe what I did or noticed, and explain what I learned.' },
    { id: 'relevance', title: 'I connect examples to my course.', detail: 'The connections are genuine and relevant to the courses I am considering.' },
    { id: 'repetition', title: 'Each answer adds something.', detail: 'I have checked for repeated ideas, unnecessary lists and information already elsewhere in my application.' },
    { id: 'voice', title: 'This is accurate and in my own words.', detail: 'I have not copied model text or invented experiences. I could discuss the examples honestly.' },
    { id: 'privacy', title: 'I have checked privacy and readability.', detail: 'I have removed other people’s identifying details and proofread for clarity, spelling and punctuation.' },
    { id: 'course', title: 'I have checked course-specific advice.', detail: 'I have read relevant guidance from the universities or colleges I am applying to.' }
  ]
};
