/**
 * ZIP export utility for multiple SVG files
 */

export async function createZipFromSVGs(
  svgFiles: Array<{ filename: string; content: string }>
): Promise<Blob> {
  // Dynamically import jszip to avoid bundle bloat if not used
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add each SVG to the zip
  for (const file of svgFiles) {
    zip.file(file.filename, file.content);
  }

  // Generate and return blob
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Download ZIP file
 */
export async function downloadZip(
  svgFiles: Array<{ filename: string; content: string }>,
  zipName: string
): Promise<void> {
  const blob = await createZipFromSVGs(svgFiles);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
