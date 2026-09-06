# MetaForge — Metadata Generator

MetaForge is a lightweight browser-based metadata generator for creating structured metadata records and exporting them into multiple reusable formats.

The application works entirely on the client side. Metadata can be drafted in the browser, previewed instantly, stored temporarily in Local Storage, and downloaded without a server-side database.

## Features

- Create structured metadata records
- Live metadata preview
- Dublin Core-inspired metadata fields
- Add custom metadata fields
- Save and load a draft using Local Storage
- Export metadata as:
  - Dublin Core XML
  - Generic XML
  - CSV
  - JSON
  - YAML
  - RDF/XML
  - BibTeX
  - Plain Text
  - PDF
- Responsive interface for desktop and mobile
- No backend or database required
- Suitable for static hosting and GitHub Pages

## Metadata Fields

The default form includes:

- Title
- Creator
- Subject
- Description
- Publisher
- Contributor
- Date
- Type
- Format
- Identifier
- Source
- Language
- Relation
- Coverage
- Rights
- Keywords
- Custom fields

These fields are based primarily on common Dublin Core elements while still allowing custom metadata for other use cases.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Web Storage API
- jsPDF for client-side PDF export

## Export Formats

| Format | Extension | Purpose |
| --- | --- | --- |
| Dublin Core XML | `.xml` | Interoperable Dublin Core-style metadata |
| Generic XML | `.xml` | Simple structured XML metadata |
| CSV | `.csv` | Spreadsheet and tabular workflows |
| JSON | `.json` | APIs, applications, and structured data |
| YAML | `.yaml` | Human-readable structured data |
| RDF/XML | `.rdf` | Semantic web and linked-data workflows |
| BibTeX | `.bib` | Citation and reference workflows |
| Plain Text | `.txt` | Simple human-readable metadata |
| PDF | `.pdf` | Shareable metadata record |

## Run Locally

Clone or download the repository and open `index.html` in a modern browser.

For development, a static development server such as VS Code Live Server can also be used.

## Project Structure

```text
metaforge-metadata-generator/
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore
```

## Deployment

MetaForge is a static web application and can be deployed on:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- Any static web hosting

## Data and Privacy

Metadata records are processed in the browser.

The optional draft feature stores the current metadata record in browser Local Storage. No metadata is sent to a database by the application itself.

PDF export loads jsPDF from a public CDN.

## Notes

The Dublin Core XML and RDF/XML exports use standard Dublin Core element names. Custom fields are retained in generic formats such as JSON, CSV, YAML, TXT, and generic XML, but are not automatically mapped to formal external metadata schemas.
