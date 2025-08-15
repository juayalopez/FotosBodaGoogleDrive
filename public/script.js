const form = document.getElementById('myForm');
const input = document.getElementById('files');
const button = document.getElementById('btnSubmit');
const preview = document.getElementById('preview');
const message = document.getElementById('message');
const verQR = document.getElementById('verQR');
const popup = document.getElementById('popup');
const cerrarPopup = document.getElementById('cerrarPopup');

  verQR.addEventListener('click', (e) => {
    e.preventDefault();
    popup.style.display = 'flex';
  });

  cerrarPopup.addEventListener('click', () => {
    popup.style.display = 'none';
  });



function preventUnload(e) {
  e.preventDefault();
  e.returnValue = ''; // Requerido por algunos navegadores
}

let files = [];
let justUploaded = false;

const showMessage = (text, type = '') => {
  message.textContent = text;
  message.className = `message ${type}`;
  message.style.display = 'block';
};

const clearMessage = () => {
  message.style.display = 'none';
};

input.addEventListener('click', () => {
  if (justUploaded) {
    files = [];
    justUploaded = false;
    clearMessage();
  }
});

input.addEventListener('change', () => {
  const newFiles = Array.from(input.files);
  newFiles.forEach(file => {
    const exists = files.some(f => f.name === file.name && f.size === file.size);
    if (!exists) {
      files.push(file);
      addPreview(file);
    }
  });
  input.value = '';
});

function addPreview(file) {
  const previewItem = document.createElement('div');
  previewItem.className = 'preview-item';

  const media = document.createElement(file.type.startsWith('video') ? 'video' : 'img');
  media.src = URL.createObjectURL(file);
  if (media.tagName === 'VIDEO') {
    media.muted = true;
    media.autoplay = true;
    media.loop = true;
  }
  previewItem.appendChild(media);

  const fileName = document.createElement('p');
  fileName.textContent = file.name;
  previewItem.appendChild(fileName);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '❌';
  removeBtn.onclick = () => {
    previewItem.remove();
    files = files.filter(f => !(f.name === file.name && f.size === file.size));
  };
  previewItem.appendChild(removeBtn);

  preview.appendChild(previewItem);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  input.disabled = true;
  button.disabled = true;

  clearMessage();

  if (!files.length) {
    showMessage("Primero selecciona archivos para subir.");
    return;
  }

  const overlay = document.getElementById('uploadOverlay');
  const progressBar = document.getElementById('progressBar');

  overlay.style.display = 'flex';
  progressBar.style.width = '0%';

  window.addEventListener('beforeunload', preventUnload);

  let uploaded = 0;

  const fileNameDisplay = document.getElementById('currentFileName');

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append('files', files[i]);

    // Mostrar nombre del archivo actual
    fileNameDisplay.textContent = `Subiendo: ${files[i].name}`;

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentPerFile = (event.loaded / event.total);
            const totalPercent = ((uploaded + percentPerFile) / files.length) * 100;
            progressBar.style.width = `${totalPercent}%`;
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            uploaded += 1;
            progressBar.style.width = `${(uploaded / files.length) * 100}%`;
            resolve();
          } else {
            reject(new Error("Error en la subida"));
          }
        };

        xhr.onerror = () => reject(new Error("Error en la conexión"));

        xhr.send(formData);
      });
    } catch (err) {
      overlay.style.display = 'none';
      showMessage(err.message, 'error');
      return;
    }
  }

  // Limpiar nombre al terminar
  fileNameDisplay.textContent = '';

  overlay.style.display = 'none';
  input.disabled = false;
  button.disabled = false;
  window.removeEventListener('beforeunload', preventUnload);
  preview.innerHTML = '';
  showMessage("Todos los archivos fueron subidos correctamente. Puedes seleccionar más si deseas.", 'success');
  justUploaded = true;
});