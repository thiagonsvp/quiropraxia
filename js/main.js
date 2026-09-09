window.dataLayer = window.dataLayer || [];

// ---------------------------------------------------------------------------
// Atribuição de leads
// ---------------------------------------------------------------------------
// O Google não tem equivalente ao ctwa_clid da Meta: no salto do site para o
// WhatsApp nenhum dado da campanha viaja junto. Esta ponte é construída à mão.
//
// 1. Na chegada, guardamos gclid/UTMs e sorteamos um código curto.
// 2. O código entra na mensagem pré-preenchida: "(ref A7K2M9)".
// 3. No clique, mandamos {código + gclid + campanha} para o webhook.
// 4. O CRM lê o código na mensagem recebida e cruza com esse registro.
// 5. Quando o lead vira paciente, o gclid volta ao Google Ads como conversão
//    offline — o passo que faz o algoritmo otimizar por paciente, não por clique.
//
// COLE AQUI a URL do seu webhook (n8n ou Make). Vazio = nada é enviado, e o
// resto da página segue funcionando normalmente.
const LEAD_WEBHOOK_URL = 'https://n8n.vps7584.panel.icontainer.run/webhook/quiro';

// Sem 0/O e 1/I/L: o código é lido por humanos quando chega no CRM.
const REF_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const REF_LENGTH = 6;
const STORAGE_KEY = 'gg_lead_attribution';

let attribution = null;

function newRef() {
  const bytes = new Uint8Array(REF_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');
}

// A atribuição é capturada UMA vez, na primeira visita da sessão: o gclid chega
// só na URL de entrada e some se a pessoa recarregar sem os parâmetros.
function getAttribution() {
  if (attribution) return attribution;

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      attribution = JSON.parse(saved);
      return attribution;
    }
  } catch {
    // Navegação anônima pode bloquear sessionStorage: seguimos em memória.
  }

  const params = new URLSearchParams(window.location.search);
  attribution = {
    ref: newRef(),
    // gbraid/wbraid substituem o gclid quando o usuário não aceita cookies.
    gclid: params.get('gclid') || '',
    gbraid: params.get('gbraid') || '',
    wbraid: params.get('wbraid') || '',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
    referrer: document.referrer || '',
    landing_page: window.location.href,
    created_at: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Idem: sem persistência, o código vale só para esta página.
  }

  return attribution;
}

// Os href já vêm prontos no HTML e funcionam sem JS. Aqui só acrescentamos o
// código — se algo abaixo falhar, o botão continua abrindo o WhatsApp.
function stampRefOnCtas() {
  const { ref } = getAttribution();

  document.querySelectorAll('[data-whatsapp-cta]').forEach((cta) => {
    try {
      const url = new URL(cta.href);
      const text = url.searchParams.get('text') || '';
      if (text.includes('(ref ')) return;
      url.searchParams.set('text', `${text} (ref ${ref})`);
      cta.href = url.toString();
    } catch {
      // href malformado: deixa o original em paz.
    }
  });
}

// Testes automatizados e navegação local clicam nos CTAs várias vezes. Sem esta
// trava, cada execução criaria leads falsos no n8n e sujaria o CRM.
function isLocalEnvironment() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '';
}

function sendLeadToWebhook(clickLocation) {
  if (!LEAD_WEBHOOK_URL || isLocalEnvironment()) return;

  const payload = JSON.stringify({ ...getAttribution(), click_location: clickLocation });

  // sendBeacon sobrevive à navegação e não bloqueia a abertura do WhatsApp.
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon(LEAD_WEBHOOK_URL, blob)) return;
  } catch {
    // Cai no fetch abaixo.
  }

  try {
    fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      mode: 'no-cors',
    }).catch(() => { });
  } catch {
    // Rastreamento nunca pode derrubar a conversão.
  }
}

stampRefOnCtas();

document.addEventListener('click', (event) => {
  const cta = event.target.closest('[data-whatsapp-cta]');
  if (!cta) return;

  window.dataLayer.push({
    event: 'whatsapp_click',
    click_location: cta.dataset.location,
    lead_ref: getAttribution().ref,
  });

  sendLeadToWebhook(cta.dataset.location);
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
