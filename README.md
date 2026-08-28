# AI RFP Response Assistant

A lightweight MVP web app that helps a vendor turn RFP text and a reusable answer library into:

- Opportunity brief
- Fit score
- Requirement/compliance matrix
- Evidence matches from prior content
- Risk notes
- Proposal response draft
- Markdown export

## Run locally

No build step is required.

```bash
cd rfp-response-assistant
python3 -m http.server 4173
```

Open: <http://localhost:4173>

## Current MVP behavior

This first version runs entirely in the browser. It uses local text extraction and matching heuristics rather than an external LLM API, so private RFP data stays local.

## Suggested next upgrades

1. Add an LLM provider behind a server endpoint for stronger drafting.
2. Add document upload/parsing for PDF, DOCX, XLSX, and CSV.
3. Store reusable answer libraries by customer, product, and compliance category.
4. Add citation-backed retrieval from approved source documents.
5. Add multi-user review workflow: sales, security, legal, executive approval.
6. Add CRM/storage integrations: HubSpot, Salesforce, Google Drive, SharePoint.

## Product positioning

Target users:

- B2B SaaS vendors
- IT consultancies
- Government contractors
- Managed service providers
- Security/compliance-heavy vendors

Suggested pricing:

- Starter: $99/month, 1 user, limited projects
- Team: $399/month, 5 users, answer library, exports
- Business: $999+/month, review workflow, integrations, audit trails
