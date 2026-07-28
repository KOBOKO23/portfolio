(function () {
  'use strict';

  function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  }

  function init() {
    var textarea = document.querySelector('.blog-content-editor');
    if (!textarea || typeof EasyMDE === 'undefined') return;

    var match = window.location.pathname.match(/blogarticle\/(\d+)\/change/);
    var articleId = match ? match[1] : null;

    var easyMDE = new EasyMDE({
      element: textarea,
      spellChecker: false,
      status: ['lines', 'words'],
      uploadImage: true,
      imagePathAbsolute: true,
      imageUploadFunction: function (file, onSuccess, onError) {
        if (!articleId) {
          onError('Save the article first, then come back to insert images here.');
          return;
        }
        var formData = new FormData();
        formData.append('image', file);
        fetch('/admin/blog/blogarticle/' + articleId + '/upload-editor-image/', {
          method: 'POST',
          headers: { 'X-CSRFToken': getCookie('csrftoken') },
          body: formData,
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.url) onSuccess(data.url);
            else onError(data.error || 'Upload failed.');
          })
          .catch(function () { onError('Upload failed.'); });
      },
      toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'upload-image', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide',
      ],
    });

    // Jazzmin/Bootstrap wraps admin fields in a way that can clip the
    // editor's fullscreen/side-by-side modes — keep it above everything.
    easyMDE.codemirror.getWrapperElement().style.zIndex = 1;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
