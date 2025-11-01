// Injected into every page
document.addEventListener('mouseup', () => {
  const sel = window.getSelection().toString().trim();
  if (sel.length > 30) {
    chrome.runtime.sendMessage({
      type: 'SELECTION',
      text: sel,
      url: location.href,
      title: document.title
    });
  }
});