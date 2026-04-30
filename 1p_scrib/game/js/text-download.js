function downloadTxtFile(filename, htmlContent) {
  const contentWithNewlines = String(htmlContent || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>\s*<div>/gi, "\n")
    .replace(/<\/?div>/gi, "")
    .trim();

  const blob = new Blob([contentWithNewlines], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
