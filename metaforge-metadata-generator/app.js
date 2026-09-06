const STORAGE_KEY = "metaforge.metadata.draft.v1";

const standardFields = [
  "title",
  "creator",
  "subject",
  "description",
  "publisher",
  "contributor",
  "date",
  "type",
  "format",
  "identifier",
  "source",
  "language",
  "relation",
  "coverage",
  "rights",
  "keywords"
];

const form = document.getElementById("metadataForm");
const customFieldsList = document.getElementById("customFieldsList");
const customFieldTemplate = document.getElementById("customFieldTemplate");
const previewCard = document.getElementById("previewCard");
const recordStatus = document.getElementById("recordStatus");
const toast = document.getElementById("toast");

standardFields.forEach((field) => {
  document.getElementById(field).addEventListener("input", renderPreview);
  document.getElementById(field).addEventListener("change", renderPreview);
});

document.getElementById("addFieldBtn").addEventListener("click", () => {
  addCustomField();
  renderPreview();
});

document.getElementById("saveDraftBtn").addEventListener("click", saveDraft);
document.getElementById("loadDraftBtn").addEventListener("click", loadDraft);
document.getElementById("clearFormBtn").addEventListener("click", clearForm);

document.querySelectorAll("[data-export]").forEach((button) => {
  button.addEventListener("click", () => exportMetadata(button.dataset.export));
});

function addCustomField(name = "", value = "") {
  const fragment = customFieldTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".custom-field-row");
  const nameInput = fragment.querySelector(".custom-name");
  const valueInput = fragment.querySelector(".custom-value");
  const removeButton = fragment.querySelector(".remove-field-btn");

  nameInput.value = name;
  valueInput.value = value;

  nameInput.addEventListener("input", renderPreview);
  valueInput.addEventListener("input", renderPreview);

  removeButton.addEventListener("click", () => {
    row.remove();
    renderPreview();
  });

  customFieldsList.appendChild(fragment);
}

function getMetadata() {
  const data = {};

  standardFields.forEach((field) => {
    const value = document.getElementById(field).value.trim();
    if (value) data[field] = value;
  });

  const customFields = [];
  customFieldsList.querySelectorAll(".custom-field-row").forEach((row) => {
    const name = row.querySelector(".custom-name").value.trim();
    const value = row.querySelector(".custom-value").value.trim();

    if (name && value) {
      customFields.push({ name, value });
    }
  });

  if (customFields.length) data.customFields = customFields;

  return data;
}

function setMetadata(data = {}) {
  form.reset();
  customFieldsList.innerHTML = "";

  standardFields.forEach((field) => {
    document.getElementById(field).value = data[field] || "";
  });

  if (Array.isArray(data.customFields)) {
    data.customFields.forEach((item) => addCustomField(item.name, item.value));
  }

  renderPreview();
}

function renderPreview() {
  const data = getMetadata();
  const hasAnyData = Object.keys(data).length > 0;

  recordStatus.textContent = data.title ? "Ready" : "Draft";

  if (!hasAnyData) {
    previewCard.innerHTML = `
      <div class="empty-preview">
        Start filling the form to build a metadata record.
      </div>
    `;
    return;
  }

  const title = escapeHtml(data.title || "Untitled metadata record");
  const subtitleParts = [data.creator, data.date, data.type].filter(Boolean);

  const rows = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key === "title" || key === "customFields") return;
    if (!value) return;

    rows.push({
      label: friendlyLabel(key),
      value
    });
  });

  (data.customFields || []).forEach((item) => {
    rows.push({
      label: item.name,
      value: item.value
    });
  });

  previewCard.innerHTML = `
    <div class="preview-title-block">
      <h3>${title}</h3>
      <p>${escapeHtml(subtitleParts.join(" · ") || "Metadata record")}</p>
    </div>
    <dl class="preview-list">
      ${rows
        .map(
          (row) => `
            <div class="preview-row">
              <dt>${escapeHtml(row.label)}</dt>
              <dd>${escapeHtml(row.value)}</dd>
            </div>
          `
        )
        .join("")}
    </dl>
  `;
}

function friendlyLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function saveDraft() {
  const data = getMetadata();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  showToast("Draft saved in Local Storage.");
}

function loadDraft() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    showToast("No saved draft found.");
    return;
  }

  try {
    setMetadata(JSON.parse(saved));
    showToast("Draft loaded.");
  } catch {
    showToast("Saved draft could not be loaded.");
  }
}

function clearForm() {
  const data = getMetadata();

  if (Object.keys(data).length && !confirm("Clear the current metadata record?")) {
    return;
  }

  setMetadata({});
  showToast("Metadata form cleared.");
}

function validateForExport(data) {
  if (!data.title) {
    showToast("Add a title before exporting.");
    document.getElementById("title").focus();
    return false;
  }

  return true;
}

function exportMetadata(format) {
  const data = getMetadata();
  if (!validateForExport(data)) return;

  const baseName = slugify(data.title) || "metadata-record";

  switch (format) {
    case "json":
      downloadText(`${baseName}.json`, JSON.stringify(data, null, 2), "application/json");
      break;
    case "csv":
      downloadText(`${baseName}.csv`, toCSV(data), "text/csv;charset=utf-8");
      break;
    case "xml":
      downloadText(`${baseName}.xml`, toGenericXML(data), "application/xml");
      break;
    case "dcxml":
      downloadText(`${baseName}-dublin-core.xml`, toDublinCoreXML(data), "application/xml");
      break;
    case "yaml":
      downloadText(`${baseName}.yaml`, toYAML(data), "text/yaml;charset=utf-8");
      break;
    case "rdf":
      downloadText(`${baseName}.rdf`, toRDFXML(data), "application/rdf+xml");
      break;
    case "bibtex":
      downloadText(`${baseName}.bib`, toBibTeX(data), "application/x-bibtex");
      break;
    case "txt":
      downloadText(`${baseName}.txt`, toPlainText(data), "text/plain;charset=utf-8");
      break;
    case "pdf":
      exportPDF(data, `${baseName}.pdf`);
      break;
  }
}

function flattenedEntries(data) {
  const entries = [];

  standardFields.forEach((field) => {
    if (data[field]) {
      entries.push([friendlyLabel(field), data[field]]);
    }
  });

  (data.customFields || []).forEach((item) => {
    entries.push([item.name, item.value]);
  });

  return entries;
}

function toCSV(data) {
  const header = ["Field", "Value"];
  const rows = flattenedEntries(data);

  return [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

function csvEscape(value) {
  const stringValue = String(value ?? "");

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function toGenericXML(data) {
  const rows = standardFields
    .filter((field) => data[field])
    .map((field) => `  <${field}>${xmlEscape(data[field])}</${field}>`);

  (data.customFields || []).forEach((item) => {
    rows.push(
      `  <field name="${xmlEscape(item.name)}">${xmlEscape(item.value)}</field>`
    );
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
${rows.join("\n")}
</metadata>
`;
}

function toDublinCoreXML(data) {
  const dcMap = {
    title: "title",
    creator: "creator",
    subject: "subject",
    description: "description",
    publisher: "publisher",
    contributor: "contributor",
    date: "date",
    type: "type",
    format: "format",
    identifier: "identifier",
    source: "source",
    language: "language",
    relation: "relation",
    coverage: "coverage",
    rights: "rights"
  };

  const rows = [];

  Object.entries(dcMap).forEach(([field, dcName]) => {
    if (data[field]) {
      rows.push(`  <dc:${dcName}>${xmlEscape(data[field])}</dc:${dcName}>`);
    }
  });

  if (data.keywords) {
    data.keywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((keyword) => {
        rows.push(`  <dc:subject>${xmlEscape(keyword)}</dc:subject>`);
      });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<oai_dc:dc
  xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/
  http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
${rows.join("\n")}
</oai_dc:dc>
`;
}

function toYAML(data) {
  const lines = [];

  standardFields.forEach((field) => {
    if (data[field]) {
      lines.push(`${field}: ${yamlQuote(data[field])}`);
    }
  });

  if (data.customFields?.length) {
    lines.push("customFields:");
    data.customFields.forEach((item) => {
      lines.push(`  - name: ${yamlQuote(item.name)}`);
      lines.push(`    value: ${yamlQuote(item.value)}`);
    });
  }

  return lines.join("\n") + "\n";
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function toRDFXML(data) {
  const dcRows = [];

  const dcFields = [
    "title",
    "creator",
    "subject",
    "description",
    "publisher",
    "contributor",
    "date",
    "type",
    "format",
    "identifier",
    "source",
    "language",
    "relation",
    "coverage",
    "rights"
  ];

  dcFields.forEach((field) => {
    if (data[field]) {
      dcRows.push(`    <dc:${field}>${xmlEscape(data[field])}</dc:${field}>`);
    }
  });

  if (data.keywords) {
    data.keywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((keyword) => {
        dcRows.push(`    <dc:subject>${xmlEscape(keyword)}</dc:subject>`);
      });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <rdf:Description rdf:about="${xmlEscape(data.identifier || "")}">
${dcRows.join("\n")}
  </rdf:Description>
</rdf:RDF>
`;
}

function toBibTeX(data) {
  const key = slugify(data.creator || "record").replace(/-/g, "") +
    (data.date ? data.date.slice(0, 4) : "");

  const fields = [];

  if (data.title) fields.push(["title", data.title]);
  if (data.creator) fields.push(["author", data.creator]);
  if (data.publisher) fields.push(["publisher", data.publisher]);
  if (data.date) fields.push(["year", data.date.slice(0, 4)]);
  if (data.identifier) fields.push(["identifier", data.identifier]);
  if (data.language) fields.push(["language", data.language]);
  if (data.keywords) fields.push(["keywords", data.keywords]);
  if (data.description) fields.push(["note", data.description]);

  const body = fields
    .map(([name, value]) => `  ${name} = {${bibEscape(value)}}`)
    .join(",\n");

  return `@misc{${key || "metadatarecord"},
${body}
}
`;
}

function toPlainText(data) {
  return flattenedEntries(data)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n") + "\n";
}

function exportPDF(data, filename) {
  if (!window.jspdf?.jsPDF) {
    showToast("PDF library is not available. Check your internet connection.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: "mm",
    format: "a4"
  });

  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Metadata Record", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 125);
  doc.text("Generated with MetaForge", margin, y);
  y += 12;

  flattenedEntries(data).forEach(([label, value]) => {
    const labelLines = doc.splitTextToSize(`${label}:`, 34);
    const valueLines = doc.splitTextToSize(String(value), contentWidth - 38);
    const blockHeight = Math.max(labelLines.length, valueLines.length) * 5 + 3;

    if (y + blockHeight > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 55, 70);
    doc.text(labelLines, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(65, 75, 90);
    doc.text(valueLines, margin + 38, y);

    y += blockHeight;
  });

  doc.save(filename);
  showToast("PDF exported.");
}

function downloadText(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  showToast(`${filename} exported.`);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function bibEscape(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

renderPreview();
