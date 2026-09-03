window.dataLayer = window.dataLayer || [];

document.addEventListener('click', (event) => {
  const cta = event.target.closest('[data-whatsapp-cta]');
  if (!cta) return;
  window.dataLayer.push({
    event: 'whatsapp_click',
    click_location: cta.dataset.location,
  });
});
