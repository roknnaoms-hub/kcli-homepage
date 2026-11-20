'use strict';
const sheetDialog = document.getElementById('textbook-preview');
const imageStatus = document.getElementById('image-status');
for (const button of document.querySelectorAll('[data-preview-src]')) {
  button.addEventListener('click', () => {
    const image = new Image();
    const standard = button.closest('section').querySelector('h3').textContent;
    image.alt = standard + ' clauses 4–10. The same topics are listed in the expandable tables.';
    image.src = button.dataset.previewSrc;
    sheetDialog.querySelector('h2').textContent = standard + ' · Clauses 4–10';
    sheetDialog.querySelector('.textbook-preview-media').replaceChildren(image);
    sheetDialog.showModal();
  });
}

for (const button of document.querySelectorAll('[data-png]')) {
  button.addEventListener('click', async () => {
    button.disabled = true;
    imageStatus.textContent = 'Preparing the English PNG chart.';
    try {
      const image = new Image();
      image.src = button.dataset.png;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = image.src.split('/').pop().replace(/\.svg$/, '.png');
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 30000);
      imageStatus.textContent = 'The PNG chart is ready to save.';
    } catch {
      imageStatus.classList.remove('sr-only');
      imageStatus.textContent = 'This browser could not create the PNG. Use the Download SVG link for the same chart.';
      button.after(imageStatus);
    } finally {
      button.disabled = false;
    }
  });
}
