/* PERSONAL STATEMENT WORKSHOP — DOCUMENT EXPORTS
   Public functions are at the end of this file. Edit buildBlocks() for document
   content, previewHTML() for print layout and createDocxBlob() for Word styles.
   The small ZIP writer at the bottom packages a real .docx without an online library. */
window.PSW_EXPORTS = (() => {
  'use strict';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const normalise = text => String(text ?? '').replace(/\r\n?/g, '\n');
  const dateLabel = date => new Date(date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const xml = value => escapeHTML(String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, ''));

  function filename(state, suffix, extension) {
    const name = (state.profile.title || 'My personal statement').replace(/[^\p{L}\p{N} _-]/gu, '').trim().replace(/\s+/g, '-').slice(0, 70) || 'personal-statement';
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    return `${name}-${suffix}-${stamp}.${extension}`;
  }

  // Download requests do not prove a file reached the device. The UI reminds users to check it.
  function download(blob, name) {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; anchor.style.display = 'none';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  // A shared document model keeps the on-screen preview, printout and Word file aligned.
  function buildBlocks(state, options = {}) {
    const blocks = [{ type: 'title', text: state.profile.title || 'My personal statement' }];
    const meta = ['Working draft', dateLabel()];
    if (state.profile.subject.trim()) meta.push(state.profile.subject.trim());
    if (options.includeName && state.profile.name.trim()) meta.push(state.profile.name.trim());
    blocks.push({ type: 'meta', text: meta.join('  |  ') });
    for (const q of window.PSW_CONTENT.questions) {
      blocks.push({ type: 'heading', text: `Question ${q.number}: ${q.official}`, pageBreak: !!options.feedback && q.number > 1 });
      blocks.push({ type: 'text', text: state.drafts[q.id] || 'Not drafted yet.' });
      if (options.feedback) {
        ['What is working?', 'What needs developing?', 'My next change'].forEach((label, index) => blocks.push({ type: 'feedback', text: label, keepNext: index < 2 }));
      }
    }
    if (options.includeNotes) {
      blocks.push({ type: 'notesHeading', text: 'Planning record — not part of the statement' });
      blocks.push({ type: 'meta', text: 'These are working notes and unused material. Review them before sharing. They are not included in the UCAS character count.' });
      if (state.profile.qualifications) blocks.push({ type: 'subheading', text: 'Current studies' }, { type: 'text', text: state.profile.qualifications });
      if (state.profile.courseNotes) blocks.push({ type: 'subheading', text: 'Course guidance notes' }, { type: 'text', text: state.profile.courseNotes });
      for (const idea of state.ideas) {
        const q = window.PSW_CONTENT.questions.find(q => q.id === idea.q);
        blocks.push({ type: 'subheading', text: idea.title || 'Untitled idea' });
        blocks.push({ type: 'meta', text: `Suggested section: Question ${q.number}. This idea may be unused or different from the edited draft.` });
        for (const [key, label] of [['detail','Specific detail'], ['learning','What I learned'], ['relevance','Why it matters']]) {
          if (idea.notes[key]) blocks.push({ type: 'text', text: `${label}:\n${idea.notes[key]}` });
        }
        if (idea.snippet) blocks.push({ type: 'text', text: `Short writing piece:\n${idea.snippet}` });
      }
      if (state.nextSteps) blocks.push({ type: 'subheading', text: 'My next steps / feedback notes' }, { type: 'text', text: state.nextSteps });
      if (!state.ideas.length && !state.profile.courseNotes && !state.profile.qualifications && !state.nextSteps) blocks.push({ type: 'text', text: 'No planning notes recorded.' });
    }
    return blocks;
  }

  function previewHTML(state, options = {}) {
    const html = buildBlocks(state, options).map(block => {
      const text = escapeHTML(block.text);
      if (block.type === 'title') return `<h2>${text}</h2>`;
      if (block.type === 'meta') return `<p class="doc-meta">${text}</p>`;
      if (block.type === 'heading') return `<h3${block.pageBreak ? ' class="new-question-page"' : ''}>${text}</h3>`;
      if (block.type === 'subheading') return `<h4>${text}</h4>`;
      if (block.type === 'notesHeading') return `<h2 class="notes-heading">${text}</h2>`;
      if (block.type === 'feedback') return `<div class="doc-feedback ${block.keepNext ? 'feedback-next' : ''}"><strong>${text}</strong><div class="feedback-space"></div></div>`;
      return `<p>${text}</p>`;
    }).join('');
    return `<article class="preview-document">${html}</article>`;
  }

  function exportText(state, options = {}) {
    const text = buildBlocks(state, options).map(block => block.type === 'feedback' ? `${block.text}\n\n______________________________\n` : normalise(block.text)).join('\n\n');
    download(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename(state, 'draft', 'txt'));
  }

  function createDocxBlob(state, options = {}) {
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const textRun = text => `<w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
    const paragraph = (text, style = 'Normal', extra = '') => `<w:p><w:pPr><w:pStyle w:val="${style}"/>${extra}</w:pPr>${normalise(text).split('\t').map(textRun).join('<w:r><w:tab/></w:r>')}</w:p>`;
    const body = buildBlocks(state, options).map(block => {
      if (block.type === 'title') return paragraph(block.text, 'Title');
      if (block.type === 'heading') return paragraph(block.text, 'Heading1', block.pageBreak ? '<w:pageBreakBefore/>' : '');
      if (block.type === 'subheading') return paragraph(block.text, 'Heading2');
      if (block.type === 'meta') return paragraph(block.text, 'Meta');
      if (block.type === 'notesHeading') return paragraph(block.text, 'Title', '<w:pageBreakBefore/>');
      if (block.type === 'feedback') return paragraph(block.text, 'Feedback', `${block.keepNext ? '<w:keepNext/>' : ''}<w:spacing w:before="140" w:after="1000"/>`);
      return normalise(block.text).split('\n').map(line => paragraph(line)).join('');
    }).join('');
    const documentXML = `${declaration}<w:document xmlns:w="${ns}" xmlns:r="${rel}"><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="540" w:footer="540" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const styles = `${declaration}<w:styles xmlns:w="${ns}">
      <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="300" w:lineRule="auto"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults>
      <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
      <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:after="180"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>
      <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="280" w:after="140"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/></w:rPr></w:style>
      <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/></w:rPr></w:style>
      <w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Metadata"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="555555"/><w:sz w:val="18"/></w:rPr></w:style>
      <w:style w:type="paragraph" w:styleId="Feedback"><w:name w:val="Feedback"/><w:basedOn w:val="Normal"/><w:pPr><w:keepLines/></w:pPr><w:rPr><w:b/><w:sz w:val="19"/></w:rPr></w:style>
    </w:styles>`;
    const files = {
      '[Content_Types].xml': `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
      '_rels/.rels': `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
      'word/document.xml': documentXML,
      'word/styles.xml': styles,
      'word/settings.xml': `${declaration}<w:settings xmlns:w="${ns}"><w:defaultTabStop w:val="720"/><w:compat/></w:settings>`,
      'word/_rels/document.xml.rels': `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="${rel}/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="${rel}/settings" Target="settings.xml"/><Relationship Id="rIdFooter" Type="${rel}/footer" Target="footer1.xml"/></Relationships>`,
      'word/footer1.xml': `${declaration}<w:ftr xmlns:w="${ns}"><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">Page </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`,
      'docProps/core.xml': `${declaration}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(state.profile.title || 'My personal statement')}</dc:title><dc:creator>${options.includeName ? xml(state.profile.name) : ''}</dc:creator><dc:description>Working draft exported from Personal Statement Workshop.</dc:description></cp:coreProperties>`
    };
    return new Blob([zipStored(files)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // ZIP "store" mode: interoperable, intentionally uncompressed (text drafts are tiny).
  // No server, external script or third-party licence is required for this code.
  function zipStored(files) {
    const encoder = new TextEncoder(), pieces = [], central = [];
    let offset = 0;
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
    const crc32 = bytes => { let crc = 0xFFFFFFFF; for (const b of bytes) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8); return (crc ^ 0xFFFFFFFF) >>> 0; };
    const header = size => { const bytes = new Uint8Array(size); return { bytes, view: new DataView(bytes.buffer) }; };
    const now = new Date(), dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds()/2);
    const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth()+1) << 5) | now.getDate();
    for (const [name, content] of Object.entries(files)) {
      const path = encoder.encode(name), data = encoder.encode(content), crc = crc32(data);
      const local = header(30), lv = local.view;
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x800, true);
      lv.setUint16(10, dosTime, true); lv.setUint16(12, dosDate, true); lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, path.length, true);
      pieces.push(local.bytes, path, data);
      const directory = header(46), dv = directory.view;
      dv.setUint32(0, 0x02014b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 20, true); dv.setUint16(8, 0x800, true);
      dv.setUint16(12, dosTime, true); dv.setUint16(14, dosDate, true); dv.setUint32(16, crc, true);
      dv.setUint32(20, data.length, true); dv.setUint32(24, data.length, true); dv.setUint16(28, path.length, true); dv.setUint32(42, offset, true);
      central.push(directory.bytes, path); offset += 30 + path.length + data.length;
    }
    const directorySize = central.reduce((sum, a) => sum + a.length, 0), end = header(22), ev = end.view, count = Object.keys(files).length;
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, count, true); ev.setUint16(10, count, true);
    ev.setUint32(12, directorySize, true); ev.setUint32(16, offset, true);
    const all = [...pieces, ...central, end.bytes], output = new Uint8Array(offset + directorySize + 22);
    let cursor = 0; for (const a of all) { output.set(a, cursor); cursor += a.length; }
    return output;
  }

  return {
    filename, download, previewHTML, buildBlocks, exportText, createDocxBlob,
    exportDocx: (state, options) => download(createDocxBlob(state, options), filename(state, 'draft', 'docx'))
  };
})();
