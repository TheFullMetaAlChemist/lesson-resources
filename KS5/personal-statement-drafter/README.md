# Personal Statement Workshop

**Version 1.0.0 · 15 September 2026**

A self-contained writing tool for the three-question UCAS personal statement. Students gather ideas, develop short pieces in their own words, assemble editable answers, then export a draft. There is no AI writer, account system, server-side application or build process.

## 1. Put it on your existing GitHub Pages site

Extract the ZIP. Upload the **personal-statement** folder into your existing **tools** folder. The result should be:

```text
your-repository/
├── index.html                    Your existing homepage — do not replace it
├── assets/                       Your existing site assets
└── tools/
    ├── loan-desk/                Your other tools stay as they are
    └── personal-statement/
        ├── index.html
        ├── styles.css
        ├── prompts.js
        ├── app.js
        ├── exports.js
        └── README.md
```

The tool’s index.html is **not** a replacement for the repository’s homepage. Do not upload the ZIP itself as the tool; upload its extracted contents.

Use this path in the link field of your existing homepage card:

```text
tools/personal-statement/index.html
```

An ordinary HTML link from your root homepage would be:

```html
<a href="tools/personal-statement/index.html">Personal Statement Workshop</a>
```

If uploading in the GitHub website, open the `tools` folder, choose **Add file → Upload files**, and upload the extracted `personal-statement` folder. Check the resulting paths before committing. If your browser does not retain the folder structure, create `tools/personal-statement/index.html` first and upload the other five files into that same folder.

Keep your existing GitHub Pages publishing settings. Put the folder within the area that your current site publishes. Wait for the deployment to finish, then test the published page. No npm commands, installation or API keys are needed. The files can also live in a different topic folder: internal links are relative.

## 2. What each file does

| File | Responsibility |
|---|---|
| `index.html` | The page shell, header, footer, script links and common dialog/print containers. |
| `styles.css` | Colours, typography, spacing, responsive layouts, controls and print presentation. |
| `prompts.js` | UCAS question labels, original teaching prompts, experience categories, examples and review checklist. |
| `app.js` | Views and navigation, idea-bank editing, answer assembly, character counts, versions, saving, importing and privacy controls. |
| `exports.js` | The shared document content model, preview, plain-text export and a real `.docx` exporter. |
| `README.md` | These installation, maintenance and testing notes. Not used by the student interface. |

There are no external fonts, JavaScript libraries or image dependencies. The document exporter includes its own small ZIP packaging routine. The exported Word file is an Office Open XML document, not HTML renamed as `.docx`.

## 3. The student journey

**Your focus:** enter intended subjects and current studies. A document title, name and course-guidance notes are optional. The name is excluded from draft exports unless explicitly selected.

**Idea bank:** capture a short title and rough notes. The bank is optional: students can start directly under any question.

**Guided writing:** choose an experience type and work through specific detail, learning, relevance and a short passage. Every prompt is optional. A student can have several ideas per question, revisit them, or move an idea to another question.

**Build your answers:** select and reorder short pieces, then explicitly assemble them. Alternatively, write or paste directly into the answer editor. Assembly uses the selected text without rewriting it. Replacing an existing answer asks first and saves the current answers as a draft version.

**Review & export:** check length and content, record next steps, preview the document, and export. Partial and over-length drafts are allowed. Editing an answer resets its reviewed flag and the final review checklist.

Notes, short pieces and edited answers are separate. Editing, moving or deleting an idea never automatically changes an assembled answer. Saved draft versions restore answers, selections and review flags; they do not roll the idea bank back.

## 4. Save progress is different from export

### Save progress

Downloads a timestamped `.ucas.json` file containing the **whole project**: profile details, all notes, short pieces, answers, selections, review checks and draft versions. Use **Open work** to load that file later. Ctrl+S / Command+S also requests a progress download while the workspace is open.

Saving uses the browser’s download system. The browser controls the destination and whether a location prompt appears. The tool does not automatically overwrite a file, choose a school-drive folder or synchronise between devices. Download the newest file, check that it exists, and keep it in an appropriate private location.

The tool reports **“download requested”**, not a guaranteed successful disk save. Browsers can cancel or block a download.

### Export a document

**Word:** editable answers with the three question headings. **Print / save as PDF:** a clean black-and-white print layout. **Plain text:** a text document. **Copy answer:** just that answer, without headings or counters.

By default, draft exports exclude the name and planning notes. Optional feedback layout starts each question on a new page and adds three reflection spaces. Optional planning notes include **all** ideas, including unused material and feedback notes, in a separate planning section. Preview before sharing.

A Word or PDF export is **not** a progress file. Editing a downloaded document does not update the tool: paste revised answers back into the editors when returning.

## 5. Storage and privacy

The default is **shared-computer mode**: the application holds the current work in memory and does not write it to browser storage. Download a progress file before leaving. Browser closing warnings are only a convenience, not a backup guarantee.

**Device settings** can enable a browser copy on a private device. This copy is unencrypted and can be read by someone using the same browser profile or by other scripts on the same website origin. It can also be cleared by browser settings or become unavailable. Browser storage is not a portable backup.

A stored copy is not automatically displayed on the welcome screen. Students must choose to resume it. If another tab changes the browser copy, an actively saving tab switches to shared mode and warns rather than continuing to overwrite it.

**Finish & clear this session** clears the open project and this tool’s stored copy after confirmation. It does not remove downloaded files, operating-system backups or browser-managed data. Manage those separately on shared devices. The tool never clears storage belonging to your other applications.

The application contains no analytics, remote saving or AI requests. External UCAS links are opened only when clicked. Browser extensions, enhanced spellchecking, browser synchronisation and operating-system services are outside the tool’s control.

Never upload student progress files or personal statements to the public GitHub repository. The repository contains the empty tool, not student work. Progress files include all material even when a document export excludes notes.

## 6. Making changes later

For wording or examples, begin with `prompts.js`. For spacing or colours, use `styles.css` (the palette is at the top). For saving or interactive behaviour, use `app.js`. For document content or Word formatting, use `exports.js`.

Keep existing question, category and checklist **IDs** when changing wording: saved projects use those IDs. Adding or changing features may legitimately require two or three files, but unchanged files do not need to be recreated.

The rendering functions in `app.js` generate most of the workspace HTML. Changing a form field or navigation view may therefore involve `app.js`, not just `index.html`.

Save files carry `schemaVersion: 1`. Newer or unrecognised formats are rejected without replacing the current project. Future structural changes should include a deliberate migration and a test with an older progress file. Do not silently reinterpret old data.

The scripts and stylesheet have a `?v=1.0.0` cache label in `index.html`. After updating, force-refresh the page. For a packaged release, increase the cache labels alongside the changed files so browsers request the new versions. Check that filenames have not accidentally become `app.js.txt` or `styles.css.txt`.

Guidance figures are defined in `prompts.js`; accompanying interface wording must also be reviewed if UCAS changes its requirements. This version counts Unicode characters individually and normalises line endings; spaces and line breaks count, headings and notes do not. Students must check their pasted text and counts in UCAS itself.

Defensive import limits are 4 MB per file, 200 ideas, 60 saved draft versions and 150,000 characters in a normal text field. Oversized or malformed files are rejected rather than partially imported. The application does not silently delete older versions when the list is full.

## 7. Testing and first rollout

The core workflow was exercised in Chromium using the actual local HTML/CSS/JavaScript sources: guided writing, multiple ideas, reordering, building, rebuilding, version restore, moving/deleting ideas without changing answers, JSON round trips, malformed imports, optional export contents, Unicode counts, clipboard fallback and over-limit drafts. No uncaught application errors were recorded. Layout overflow and field labels were checked at viewport widths from 320 to 1,440 pixels.

Generated Word files were checked as ZIP/XML packages, read back and rendered through LibreOffice for visual review. The browser print layout was rendered to PDF and inspected. Default exports were checked to exclude planning notes and names; opted-in exports were checked to include them.

**Testing limitation:** the testing browser blocks ordinary website navigation. Sources were therefore loaded directly into a Chromium document for UI testing, and a simulated Web Storage adapter was used for browser-copy tests. This does not establish real GitHub Pages deployment behaviour, native storage persistence, school security-policy compatibility, physical printing or Safari/iOS behaviour. Those still need a brief check on the actual devices and published site. No claim of a formal accessibility audit or universal browser compatibility is made.

Before students use it, create a fictional project on the published page, save a progress file, close and reopen it, and export both Word and print/PDF. Repeat on a representative school-managed device. If private-device storage will be used, check a real reload/resume cycle and then clear it. Do not trial with real student information until the saving workflow is understood.

## 8. Guidance sources

Official guidance checked on **15 September 2026**. This is an independent school resource, not an official UCAS product. The three question labels come from UCAS; the workshop prompts and fictional examples are original teaching material.

- [UCAS: personal statements for 2026 entry onwards](https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement-for-2026-entry-onwards) — structure, minimum answer length, overall limit and flexibility across sections.
- [UCAS: adviser personal statement toolkit](https://www.ucas.com/advisers/help-and-training/toolkits/personal-statement-toolkit) — question wording and adviser guidance.
- [UCAS: personal statement builder](https://www.ucas.com/applying/applying-to-university/writing-personal-statement/personal-statement-builder) — three-question structure and applicant support.
- [UCAS: subject guides](https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/personal-statement-guides) — linked as supplementary guidance, not automatically imported into this tool.
- [UCAS: AI and personal statements](https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/a-guide-to-using-ai-and-chatgpt-with-your-personal-statement) — authorship and appropriate use of writing support.
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — browser persistence, storage exceptions and local-file limitations.
- [GitHub: About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) — hosting static HTML, CSS and JavaScript.
