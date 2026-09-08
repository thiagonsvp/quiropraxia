window.dataLayer = window.dataLayer || [];

document.addEventListener('click', (event) => {
  const cta = event.target.closest('[data-whatsapp-cta]');
  if (!cta) return;
  window.dataLayer.push({
    event: 'whatsapp_click',
    click_location: cta.dataset.location,
  });
});

// Avaliações públicas do perfil da Giselle no Google (5,0 · 5 avaliações).
// Texto reproduzido como aparece no perfil. Ao trocar por depoimentos coletados
// direto com pacientes, ajuste também o campo `source`.
const testimonials = [
  {
    quote: 'Profissional comprometida com o bem estar do paciente.',
    name: 'Suely Teixeira',
    source: 'Avaliação no Google',
  },
  {
    quote: 'Profissionalismo e atendimento excelente!',
    name: 'Marco Antônio',
    source: 'Avaliação no Google',
  },
  {
    quote: 'Sou muito grato pelo cuidado e recomendo de olhos fechados!',
    name: 'Pedro Dias',
    source: 'Avaliação no Google',
  },
];
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
    card.className = 'testimonial-card glass';
    card.dataset.testid = 'testimonial-card';

    const quote = document.createElement('p');
    quote.textContent = `“${item.quote}”`;

    const cite = document.createElement('cite');
    cite.textContent = item.name;

    const source = document.createElement('span');
    source.className = 'testimonial-card__source';
    source.textContent = item.source;
    cite.appendChild(source);

    card.append(quote, cite);
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

const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const toggleHeaderShadow = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  toggleHeaderShadow();
  window.addEventListener('scroll', toggleHeaderShadow, { passive: true });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTargets = document.querySelectorAll('.reveal');
if (revealTargets.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}
