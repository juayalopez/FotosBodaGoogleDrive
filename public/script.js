const form = document.getElementById('myForm');
const input = document.getElementById('files');
const preview = document.getElementById('preview');
const message = document.getElementById('message');

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
        preview.innerHTML = '';
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
      clearMessage();

      if (!files.length) {
        showMessage("Primero selecciona archivos para subir.");
        return;
      }

      showMessage("Subiendo archivos...", '');

      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      try {
        const res = await fetch('/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          showMessage("Todos los archivos fueron subidos correctamente. Puedes seleccionar más si deseas.", 'success');
          justUploaded = true;
        } else {
          showMessage("Error en la subida", 'error');
        }
      } catch (err) {
        showMessage(`Error: ${err.message}`, 'error');
      }
    });
