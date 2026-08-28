const $ = (id) => document.getElementById(id);

const sampleRfp = `City of Northbridge seeks a secure cloud-based customer support and knowledge management platform.

Proposal deadline: September 30, 2026 at 5:00 PM ET.
Contract term: 12 months with two optional annual renewals. Estimated budget: $180,000 per year.

Vendor must provide:
1. SOC 2 Type II or equivalent security controls.
2. SSO with SAML 2.0 and role-based access control.
3. Data residency in the United States.
4. Migration support from Zendesk and CSV knowledge base exports.
5. Implementation completed within 60 days of award.
6. 99.9% uptime SLA and incident response process.
7. Training for up to 80 support agents and 15 managers.
8. Accessibility compliance with WCAG 2.1 AA.
9. Public-sector references or comparable enterprise references.
10. Pricing must include onboarding, support, and renewal terms.

Evaluation criteria: 35% technical fit, 25% implementation approach, 20% security and compliance, 10% cost, 10% references.`;

const sampleLibrary = `Acme Solutions provides a cloud-native support platform with knowledge base, workflow automation, and analytics.
Security: Acme maintains SOC 2 Type II controls, annual penetration testing, encryption in transit and at rest, SAML 2.0 SSO, MFA, RBAC, audit logs, and US data residency.
Implementation: Our standard migration package imports Zendesk tickets, users, macros, and CSV knowledge base articles. Typical deployment is 45 days using discovery, configuration, migration, UAT, training, and go-live phases.
Reliability: The platform has a 99.95% historical uptime record and a 99.9% contractual SLA with incident response, status-page communication, and post-incident reviews.
Accessibility: User and public help-center experiences are tested against WCAG 2.1 AA.
Training: We include live role-based training, admin enablement, recorded sessions, and launch office hours.
References: Acme supports two municipal agencies, a regional utility, and several regulated mid-market support teams.
Pricing: Annual subscriptions include onboarding, support, hosting, and upgrades. Premium migration and custom integrations can be scoped separately.`;

let lastResult = null;

const categories = [
  { name: 'Security', terms: ['soc', 'security', 'sso', 'saml', 'mfa', 'rbac', 'encryption', 'audit', 'incident', 'privacy', 'data residency'] },
  { name: 'Implementation', terms: ['implementation', 'migration', 'timeline', 'go-live', 'training', 'onboarding', 'deploy', 'support'] },
  { name: 'Commercial', terms: ['budget', 'pricing', 'cost', 'contract', 'renewal', 'terms', 'sla'] },
  { name: 'Compliance', terms: ['wcag', 'accessibility', 'compliance', 'public-sector', 'reference', 'references', 'regulatory'] },
  { name: 'Technical', terms: ['api', 'integration', 'cloud', 'platform', 'analytics', 'knowledge', 'zendesk', 'csv'] }
];

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s.:%-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  return text
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+|\n|;|\r/g)
    .map(s => s.trim())
    .filter(s => s.length > 18);
}

function extractRequirements(rfpText) {
  const lines = rfpText.split(/\n/).map(l => l.trim()).filter(Boolean);
  const numbered = lines
    .filter(l => /^(\d+[.)]|[-*•]|vendor must|must |shall |required|requirements?)/i.test(l))
    .map(l => l.replace(/^(\d+[.)]|[-*•])\s*/, '').trim());

  const sentenceReqs = splitSentences(rfpText).filter(s => /\b(must|shall|required|provide|include|completed|comply|support|pricing)\b/i.test(s));
  return [...new Set([...numbered, ...sentenceReqs])].slice(0, 40);
}

function categorize(text) {
  const n = normalize(text);
  let best = { name: 'General', score: 0 };
  for (const cat of categories) {
    const score = cat.terms.reduce((sum, term) => sum + (n.includes(term) ? 1 : 0), 0);
    if (score > best.score) best = { name: cat.name, score };
  }
  return best.name;
}

function tokenSet(text) {
  const stop = new Set(['the','and','for','with','must','shall','provide','include','from','that','this','will','are','our','your','into','within','type','data','support']);
  return new Set(normalize(text).split(' ').filter(w => w.length > 2 && !stop.has(w)));
}

function matchEvidence(requirement, librarySentences) {
  const reqTokens = tokenSet(requirement);
  const scored = librarySentences.map(sentence => {
    const sentTokens = tokenSet(sentence);
    let overlap = 0;
    reqTokens.forEach(t => { if (sentTokens.has(t)) overlap++; });
    return { sentence, overlap, score: overlap / Math.max(reqTokens.size, 1) };
  }).sort((a,b) => b.score - a.score);
  return scored[0] || { sentence: '', score: 0, overlap: 0 };
}

function extractMeta(rfpText) {
  const deadline = rfpText.match(/(?:deadline|due date|due)[:\s]+([^\.\n]+)/i)?.[1]?.trim() || 'Not found';
  const budget = rfpText.match(/(?:budget|estimated budget|not to exceed)[:\s]+([^\.\n]+)/i)?.[1]?.trim() || 'Not found';
  const term = rfpText.match(/(?:contract term|term)[:\s]+([^\.\n]+)/i)?.[1]?.trim() || 'Not found';
  const criteria = rfpText.match(/evaluation criteria[:\s]+([^\n]+)/i)?.[1]?.trim() || 'Not found';
  return { deadline, budget, term, criteria };
}

function analyze() {
  const rfpText = $('rfpText').value.trim();
  const library = $('answerLibrary').value.trim();
  const company = $('companyName').value.trim() || 'Our company';
  const product = $('productName').value.trim() || 'our solution';

  if (!rfpText) {
    alert('Paste an RFP first, or load the sample.');
    return;
  }

  const requirements = extractRequirements(rfpText);
  const librarySentences = splitSentences(library || `${company} provides ${product}.`);
  const matrix = requirements.map((requirement, index) => {
    const evidence = matchEvidence(requirement, librarySentences);
    const status = evidence.score >= 0.22 ? 'Covered' : evidence.score >= 0.10 ? 'Partial' : 'Gap';
    return { index: index + 1, requirement, category: categorize(requirement), evidence: evidence.sentence || 'No matching evidence found.', status, score: evidence.score };
  });

  const covered = matrix.filter(m => m.status === 'Covered').length;
  const partial = matrix.filter(m => m.status === 'Partial').length;
  const gaps = matrix.filter(m => m.status === 'Gap').length;
  const fitScore = requirements.length ? Math.round(((covered + partial * 0.5) / requirements.length) * 100) : 0;
  const meta = extractMeta(rfpText);
  const risks = buildRisks(matrix, meta);
  const winThemes = buildWinThemes(matrix, company, product);
  const draft = buildDraft({ company, product, matrix, meta, risks, winThemes });

  lastResult = { company, product, requirements, matrix, fitScore, meta, risks, winThemes, draft };
  render(lastResult);
}

function buildRisks(matrix, meta) {
  const risks = [];
  const gaps = matrix.filter(m => m.status === 'Gap').slice(0, 5);
  if (gaps.length) risks.push(`${gaps.length} requirement(s) have no clear supporting evidence in the answer library.`);
  if (/not found/i.test(meta.deadline)) risks.push('Submission deadline was not automatically detected.');
  if (matrix.some(m => /security|soc|saml|privacy|data/i.test(m.requirement) && m.status !== 'Covered')) risks.push('Security/compliance responses need review before submission.');
  if (matrix.some(m => /reference|public-sector/i.test(m.requirement) && m.status !== 'Covered')) risks.push('Reference requirements may need customer proof points.');
  return risks.length ? risks : ['No major gaps detected by the local analyzer. Human review still required.'];
}

function buildWinThemes(matrix, company, product) {
  const coveredCats = [...new Set(matrix.filter(m => m.status === 'Covered').map(m => m.category))];
  const themes = [
    `${company} should position ${product} around fast implementation, low procurement risk, and measurable operational improvement.`,
    coveredCats.length ? `Strongest evidenced areas: ${coveredCats.join(', ')}.` : 'Add more answer-library evidence to identify strongest win themes.',
    'Use exact RFP language in headings and maintain a compliance-first structure.'
  ];
  return themes;
}

function buildDraft({ company, product, matrix, meta, risks, winThemes }) {
  const covered = matrix.filter(m => m.status === 'Covered');
  const partial = matrix.filter(m => m.status === 'Partial');
  const gaps = matrix.filter(m => m.status === 'Gap');

  const requirementSections = matrix.map(m => `### ${m.index}. ${m.requirement}\n**Response status:** ${m.status}\n**Proposed response:** ${m.status === 'Gap'
    ? 'We recommend adding a specific response and supporting proof point for this requirement before submission.'
    : `${company} can address this requirement. Supporting evidence: ${m.evidence}`}
`).join('\n');

  return `# RFP Response Draft\n\n## Executive Summary\n${company} is pleased to respond with ${product}. Based on the provided RFP, our response should emphasize compliance, implementation confidence, security, and measurable value.\n\n## Opportunity Snapshot\n- Deadline: ${meta.deadline}\n- Budget: ${meta.budget}\n- Contract term: ${meta.term}\n- Evaluation criteria: ${meta.criteria}\n\n## Recommended Win Themes\n${winThemes.map(t => `- ${t}`).join('\n')}\n\n## Compliance Summary\n- Covered requirements: ${covered.length}\n- Partial requirements: ${partial.length}\n- Gaps requiring review: ${gaps.length}\n\n## Risk Notes\n${risks.map(r => `- ${r}`).join('\n')}\n\n## Requirement-by-Requirement Draft\n${requirementSections}\n## Next Steps\n1. Fill every Gap item with approved product/legal/security language.\n2. Add customer references and metrics where requested.\n3. Confirm pricing, implementation assumptions, and exceptions.\n4. Perform legal, security, and executive review before submission.\n`;
}

function render(result) {
  $('scorecards').innerHTML = `
    <div class="card"><span>Fit score</span><strong>${result.fitScore}%</strong></div>
    <div class="card"><span>Requirements</span><strong>${result.requirements.length}</strong></div>
    <div class="card"><span>Gaps</span><strong>${result.matrix.filter(m => m.status === 'Gap').length}</strong></div>
  `;

  $('summary').className = 'summary-grid';
  $('summary').innerHTML = `
    <div class="summary-block"><h3>Key dates / terms</h3><ul>
      <li><strong>Deadline:</strong> ${escapeHtml(result.meta.deadline)}</li>
      <li><strong>Budget:</strong> ${escapeHtml(result.meta.budget)}</li>
      <li><strong>Term:</strong> ${escapeHtml(result.meta.term)}</li>
      <li><strong>Evaluation:</strong> ${escapeHtml(result.meta.criteria)}</li>
    </ul></div>
    <div class="summary-block"><h3>Win themes</h3><ul>${result.winThemes.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>
    <div class="summary-block"><h3>Risks</h3><ul>${result.risks.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>
  `;

  $('matrixBody').innerHTML = result.matrix.map(m => `
    <tr>
      <td>${m.index}</td>
      <td>${escapeHtml(m.requirement)}</td>
      <td>${m.category}</td>
      <td>${escapeHtml(m.evidence)}</td>
      <td><span class="badge ${badgeClass(m.status)}">${m.status}</span></td>
    </tr>
  `).join('');

  $('draftOutput').value = result.draft;
  $('exportBtn').disabled = false;
  $('copyDraft').disabled = false;
  $('copyMatrix').disabled = false;
}

function badgeClass(status) {
  return status === 'Covered' ? 'good' : status === 'Partial' ? 'warn' : 'bad';
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function exportMarkdown() {
  if (!lastResult) return;
  const blob = new Blob([lastResult.draft], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rfp-response-${new Date().toISOString().slice(0,10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyMatrix() {
  if (!lastResult) return;
  const text = ['#\tRequirement\tCategory\tEvidence\tStatus', ...lastResult.matrix.map(m => `${m.index}\t${m.requirement}\t${m.category}\t${m.evidence}\t${m.status}`)].join('\n');
  navigator.clipboard.writeText(text);
}

function clearAll() {
  $('rfpText').value = '';
  $('answerLibrary').value = '';
  $('draftOutput').value = '';
  $('scorecards').innerHTML = '';
  $('summary').className = 'empty';
  $('summary').textContent = 'Run analysis to see fit score, deadlines, requirements, risks, and win themes.';
  $('matrixBody').innerHTML = '<tr><td colspan="5" class="empty-cell">No analysis yet.</td></tr>';
  ['exportBtn','copyDraft','copyMatrix'].forEach(id => $(id).disabled = true);
  lastResult = null;
}

$('loadSample').addEventListener('click', () => { $('rfpText').value = sampleRfp; $('answerLibrary').value = sampleLibrary; });
$('analyzeBtn').addEventListener('click', analyze);
$('exportBtn').addEventListener('click', exportMarkdown);
$('copyDraft').addEventListener('click', () => navigator.clipboard.writeText($('draftOutput').value));
$('copyMatrix').addEventListener('click', copyMatrix);
$('clearBtn').addEventListener('click', clearAll);
