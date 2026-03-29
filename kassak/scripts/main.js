document.addEventListener('DOMContentLoaded', () => {
  // 1. Mode Switching Logic (Fakszimile nézetek)
  const modeTabs = document.querySelectorAll('.mode-tab');
  const container = document.querySelector('.tei-container');

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-mode');
      
      if (container) {
        container.setAttribute('data-mode', mode);
      }

      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // 2. Note Hover Highlighting
  const noteRefs = document.querySelectorAll('.note-ref');
  const marginalNotes = document.querySelectorAll('.marginal-note');

  // Hover over marker -> highlight marginal note
  noteRefs.forEach(ref => {
    ref.addEventListener('mouseenter', () => {
      const noteId = ref.getAttribute('data-note-id');
      const note = document.getElementById(noteId);
      if (note) {
        note.classList.add('bg-yellow-50', 'border-yellow-200');
      }
    });
    ref.addEventListener('mouseleave', () => {
      const noteId = ref.getAttribute('data-note-id');
      const note = document.getElementById(noteId);
      if (note) {
        note.classList.remove('bg-yellow-50', 'border-yellow-200');
      }
    });
  });

  // Hover over marginal note -> highlight marker
  marginalNotes.forEach(note => {
    note.addEventListener('mouseenter', () => {
      const refId = note.getAttribute('data-ref-id');
      const ref = document.getElementById(refId);
      if (ref) {
        ref.classList.add('ring-4', 'ring-yellow-200', 'rounded-full');
      }
    });
    note.addEventListener('mouseleave', () => {
      const refId = note.getAttribute('data-ref-id');
      const ref = document.getElementById(refId);
      if (ref) {
        ref.classList.remove('ring-4', 'ring-yellow-200', 'rounded-full');
      }
    });
  });
});
