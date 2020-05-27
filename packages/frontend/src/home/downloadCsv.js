// references https://davidwalsh.name/javascript-download
export function downloadCsv(data, fileName) {
  // Create an invisible A element
  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.appendChild(a);

  // Set the HREF to a Blob representation of the data to be downloaded
  a.href = window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }));

  // Use download attribute to set set desired file name
  a.setAttribute('download', fileName);

  // Trigger the download by simulating click
  a.click();

  // Cleanup
  window.URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
}
