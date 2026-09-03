# Landing Page de Quiropraxia — Giselle Guimarães — Design Spec

## Contexto e objetivo

Giselle Guimarães é fisioterapeuta (Universidade Veiga de Almeida) especialista em Pilates e Quiropraxia, atendendo na Barra da Tijuca/RJ (O2 Corporate & Offices, Av. José Silva de Azevedo Neto, 200, BL 06 Sala 414). O site institucional (giselleguimaraes.com.br, WordPress na Hostinger) é focado em Pilates, sem conteúdo dedicado a quiropraxia.

O objetivo deste projeto é uma landing page **exclusiva para quiropraxia**, para alimentar uma campanha de Google Ads, otimizada para conversão via WhatsApp e com tracking configurado desde o primeiro deploy.

**Dados de contato (para os links `wa.me` e rodapé):**
- WhatsApp: +55 21 98474-3764
- E-mail: fisiogiselleguimaraes@gmail.com
- Instagram: @fisio_giselleguimaraes

## Escopo

- Página única (one-page), responsiva, mobile-first (tráfego de Ads local é majoritariamente mobile).
- Sem CMS — HTML/CSS/JS estático, sem framework, sem build step.
- Conversão 100% via clique no WhatsApp (sem formulário, sem clique-para-ligar).
- Sem exibição de preços.
- Sem oferta de desconto — copy focado em autoridade e confiança, não em promoção.
- Uma única página no funil, sem menu de navegação para outras páginas/site institucional.

## Stack técnica

- HTML5 + CSS3 + JS vanilla.
- Hospedagem: Vercel (projeto novo).
- Domínio: `quiropraxia.giselleguimaraes.com.br`, via registro CNAME apontando para a Vercel (DNS gerenciado no hPanel da Hostinger — não requer alteração no WordPress).
- Imagens em WebP com fallback JPEG; lazy loading em tudo abaixo da dobra inicial.

## Estrutura de conteúdo (ordem das seções)

1. **Header fixo** — nome + botão WhatsApp sempre visível. Sem menu de navegação completo.
2. **Hero** — headline sobre a dor ("Dor lombar, cervical ou ciática atrapalhando seu dia?"), subheadline com a proposta de valor, foto profissional, CTA WhatsApp primário. Layout split clássico (texto à esquerda, foto à direita no desktop; empilhado no mobile).
3. **Barra de confiança** — formação (Universidade Veiga de Almeida), especialização em quiropraxia, registro CREFITO (placeholder — pendente).
4. **"Você sente isso?"** — checklist visual dos 4 sintomas-alvo da campanha: dor lombar/coluna, dor cervical/torcicolo, dor ciática/irradiada para pernas, postura e dor por home office.
5. **"Como funciona a quiropraxia"** — explicação em 3 passos (avaliação → plano de tratamento → ajustes), com foto de apoio.
6. **Diferenciais** — ambiente moderno e seguro no O2 Corporate, atendimento personalizado, abordagem "técnica e acolhimento" (alinhado à bio do Instagram dela).
7. **Sobre a Giselle** — bio curta + foto.
8. **Depoimentos** — 3 a 4 depoimentos de pacientes de quiropraxia. **Placeholder até receber conteúdo real dela.**
9. **FAQ** — objeções comuns ("dói o ajuste?", "quantas sessões preciso?", "atende convênio?").
10. **Localização** — endereço do O2 Corporate & Offices + mapa embed.
11. **CTA final + rodapé** — contato, Instagram (@fisio_giselleguimaraes), aviso de cookies/privacidade (LGPD).
12. **Botão flutuante de WhatsApp** — fixo no mobile durante toda a rolagem, além do CTA do header.

## Assets visuais

Fotos profissionais já disponíveis na pasta do projeto (fundo de estúdio em tom terroso):

| Uso | Arquivo original | Observação |
|---|---|---|
| Hero (foto à direita) | `WhatsApp Image 2026-09-03 at 14.21.11 (1).jpeg` | Retrato com modelo de coluna vertebral e laptop, sorriso direto — conecta visualmente com quiropraxia desde o primeiro scroll. |
| "Como funciona a quiropraxia" | `WhatsApp Image 2026-09-03 at 14.21.12.jpeg` | Apontando para o modelo de coluna — gesto explicativo, reforça a seção educacional. |
| "Sobre a Giselle" | `WhatsApp Image 2026-09-03 at 14.21.12 (2).jpeg` | Foto candid trabalhando no laptop, orientação paisagem. |

As demais 5 fotos (retratos editoriais de corpo inteiro, sem o modelo de coluna) ficam como reserva — não usadas na v1, para manter a página leve e o número de imagens baixo (importa para velocidade de carregamento e Quality Score no Google Ads). Podem substituir qualquer uma das três acima se a Giselle preferir um visual mais editorial/menos clínico.

Na implementação, os arquivos serão renomeados para nomes técnicos em kebab-case (sem espaços/parênteses), ex.: `hero-giselle.webp`.

**Pendências de conteúdo:**
- Depoimentos de pacientes de quiropraxia (texto ou print).
- Número de registro CREFITO.

## Direção visual

- **Paleta:** navy (#12213B / #0E1B33) como cor de base, lime (#C7F464) como destaque/CTA, branco e cinza-claro (#E7EAF0) para respiro, coral (#FF5A5F) como apoio pontual.
- **Tipografia:** Sora (headlines, bold/geométrica) + Inter (corpo de texto).
- **Layout do hero:** split clássico — texto/CTA à esquerda, foto à direita.
- Seções alternam fundo claro e navy para dar ritmo à rolagem; o fundo terroso das fotos contrasta bem tanto contra blocos navy quanto brancos.

## Copywriting — princípios

- Mensagem pré-preenchida do botão WhatsApp: *"Olá Giselle! Vim pela página de Quiropraxia e gostaria de agendar uma avaliação."*
- Evitar alegações médicas absolutas ("cura garantida", "elimina a dor para sempre") — política de conteúdo de saúde do Google Ads pode reprovar o anúncio.
- Tom: técnico + acolhedor, alinhado à assinatura dela no Instagram ("Movimento com técnica e acolhimento").

## Tracking e analytics

- **Google Tag Manager** (container novo) como camada única de rastreamento — o código da página só dispara eventos via `dataLayer.push`; toda regra de conversão é configurada dentro do GTM, sem necessidade de redeploy para ajustes.
- **GA4:** propriedade nova, dedicada a esta landing page (separada do site institucional).
- **Google Ads:** conta já existente; nova ação de conversão "Clique no WhatsApp" criada e ligada ao GTM via Custom Event.
- **Evento principal:** `whatsapp_click`, disparado em todos os botões de WhatsApp da página (header, hero, botão flutuante, CTA final), com um parâmetro indicando a posição do botão clicado.
- **Scroll depth** (25/50/75/90%) como evento de engajamento no GA4 — não conta como conversão.
- Criação das contas (GTM, GA4, ação de conversão no Google Ads) será feita via automação de navegador (Chrome) com acesso à conta Google da Giselle, durante a fase de implementação.

## LGPD / Privacidade

Seção curta no rodapé explicando o uso de cookies de analytics (GA4) e anúncios (Google Ads). Sem banner de consentimento complexo — desnecessário para este caso de uso.

## Verificação antes de publicar

- Auditoria Lighthouse mobile (meta: 90+ em performance/SEO/acessibilidade).
- Teste manual dos 4 botões de WhatsApp em dispositivo real (abre corretamente, com mensagem pré-preenchida).
- Modo Preview do GTM: confirmar disparo do evento `whatsapp_click` e das tags de GA4 e conversão do Google Ads.
- Teste responsivo em mobile, tablet e desktop.
- Validação de todos os links (mapa, âncoras internas, WhatsApp).

## Limitações conhecidas

Bloqueadores de anúncios podem impedir o disparo do GTM/GA4 em parte dos visitantes — limitação inerente a esse tipo de tracking client-side, sem correção completa possível.

## Fora de escopo (v1)

- Formulário de contato alternativo ou clique-para-ligar.
- Exibição de preços ou tabela de valores.
- CMS ou painel de edição para a cliente.
- Múltiplos idiomas.
- A/B testing automatizado.
