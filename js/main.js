window.dataLayer = window.dataLayer || [];

document.addEventListener('click', (event) => {
  const cta = event.target.closest('[data-whatsapp-cta]');
  if (!cta) return;
  window.dataLayer.push({
    event: 'whatsapp_click',
    click_location: cta.dataset.location,
  });
});

const testimonials = [];
window.__testimonials = testimonials;

function renderTestimonials(items) {
  const section = document.querySelector('[data-testid="testimonials-section"]');
  const grid = document.getElementById('testimonials-grid');
  if (!section || !grid) return;

  if (items.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  grid.innerHTML = '';
  for (const item of items) {
    const card = document.createElement('blockquote');
    card.className = 'testimonial-card';
    card.innerHTML = `<p>&ldquo;${item.quote}&rdquo;</p><cite>${item.name}</cite>`;
    grid.appendChild(card);
  }
}

renderTestimonials(testimonials);

document.querySelectorAll('.faq__question').forEach((button) => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(!expanded));
    answer.hidden = expanded;
  });
});

const floatingCta = document.querySelector('[data-testid="whatsapp-cta-floating"]');
const heroSection = document.querySelector('.hero');

if (floatingCta && heroSection) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      floatingCta.hidden = entry.isIntersecting;
    },
    { threshold: 0 }
  );
  observer.observe(heroSection);
}
