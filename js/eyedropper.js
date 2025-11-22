// js/eyedropper.js
// Handles image drag-and-drop, white point correction, and download logic

export function setupEyedropper({
  dropAreaId = 'dropArea',
  inputCanvasId = 'inputCanvas',
  outputCanvasId = 'outputCanvas',
  downloadBtnId = 'download',
} = {}) {
  const dropArea = document.getElementById(dropAreaId);
  const inputCanvas = document.getElementById(inputCanvasId);
  const outputCanvas = document.getElementById(outputCanvasId);
  const downloadBtn = document.getElementById(downloadBtnId);
  let originalImage = null;
  let correctedImageData = null;

  // Drag and drop handlers
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
  });
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  function handleImageFile(file) {
    const img = new Image();
    img.onload = () => {
      inputCanvas.width = img.width;
      inputCanvas.height = img.height;
      outputCanvas.width = img.width;
      outputCanvas.height = img.height;
      const ctx = inputCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      originalImage = ctx.getImageData(0, 0, img.width, img.height);
      // Clear output
      outputCanvas.getContext('2d').clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      downloadBtn.disabled = true;
      // Hide drop area, show canvas
      dropArea.style.display = 'none';
      inputCanvas.style.display = '';
      // Show reset button if not present
      if (!document.getElementById('resetBtn')) {
        const resetBtn = document.createElement('button');
        resetBtn.id = 'resetBtn';
        resetBtn.textContent = 'Upload New Image';
        resetBtn.style.marginTop = '1em';
        resetBtn.style.background = '#eee';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '6px';
        resetBtn.style.padding = '0.5em 1.5em';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.fontSize = '1em';
        inputCanvas.parentNode.insertBefore(resetBtn, inputCanvas.nextSibling);
        resetBtn.addEventListener('click', () => {
          inputCanvas.style.display = 'none';
          dropArea.style.display = '';
          outputCanvas.getContext('2d').clearRect(0, 0, outputCanvas.width, outputCanvas.height);
          downloadBtn.disabled = true;
          originalImage = null;
          correctedImageData = null;
          resetBtn.remove();
        });
      }
    };
    img.src = URL.createObjectURL(file);
  }

  // Canvas click for white point selection
  inputCanvas.addEventListener('click', (e) => {
    if (!originalImage) return;
    const rect = inputCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (inputCanvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (inputCanvas.height / rect.height));
    const idx = (y * originalImage.width + x) * 4;
    const r = originalImage.data[idx];
    const g = originalImage.data[idx + 1];
    const b = originalImage.data[idx + 2];
    // Avoid divide-by-zero
    const r_scale = r !== 0 ? 255 / r : 1;
    const g_scale = g !== 0 ? 255 / g : 1;
    const b_scale = b !== 0 ? 255 / b : 1;
    // Apply scaling
    const arr = new Uint8ClampedArray(originalImage.data);
    for (let i = 0; i < arr.length; i += 4) {
      arr[i] = Math.min(arr[i] * r_scale, 255);
      arr[i + 1] = Math.min(arr[i + 1] * g_scale, 255);
      arr[i + 2] = Math.min(arr[i + 2] * b_scale, 255);
      // Alpha stays the same
    }
    correctedImageData = new ImageData(arr, originalImage.width, originalImage.height);
    outputCanvas.getContext('2d').putImageData(correctedImageData, 0, 0);
    downloadBtn.disabled = false;
  });

  // Download button
  downloadBtn.addEventListener('click', () => {
    if (!correctedImageData) return;
    const link = document.createElement('a');
    outputCanvas.toBlob(blob => {
      link.href = URL.createObjectURL(blob);
      link.download = 'corrected_image.png';
      link.click();
    }, 'image/png');
  });

  // Optional: fallback file input for accessibility
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  dropArea.appendChild(fileInput);
  dropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
  });
  // Hide canvas initially
  inputCanvas.style.display = 'none';
}
