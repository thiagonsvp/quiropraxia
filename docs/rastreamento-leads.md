# Rastreamento de leads: do anúncio ao paciente

Como saber de qual anúncio veio cada pessoa que chama no WhatsApp.

## Por que isso precisa ser construído

Nos anúncios Click-to-WhatsApp da Meta o `ctwa_clid` vem pronto, porque a Meta é
dona do anúncio **e** do WhatsApp. No Google o caminho é anúncio → site →
`wa.me`, e nesse último salto nenhum dado da campanha viaja junto.

A ponte abaixo é o equivalente construído à mão. Ela vai além do que a Meta
entrega por padrão, porque habilita **conversão offline**: avisar ao Google quem
virou paciente de verdade, e não apenas quem clicou.

## O fluxo

```
1. Pessoa clica no anúncio
      ↓  chega em ...com.br/?gclid=Cj0KCQ...&utm_campaign=dor-lombar
2. O site guarda gclid + UTMs e sorteia um código: A7K2M9
      ↓
3. O código entra na mensagem: "...avaliação. (ref A7K2M9)"
      ↓
4. No clique, o site envia {A7K2M9, gclid, campanha} → webhook
      ↓
5. Pessoa manda a mensagem → UAZAPI → CRM
      ↓
6. O CRM lê "(ref A7K2M9)" e cruza com o registro do passo 4
      ↓
7. Lead virou paciente → devolve o gclid ao Google Ads
```

Os passos 1 a 4 já estão implementados em `js/main.js`. Os passos 5 a 7 são
configuração no n8n/Make, no CRM e no Google Ads.

## Passo 1 — Criar o webhook

**No n8n:** novo workflow → nó **Webhook** → método `POST` → copie a *Production
URL*. Ligue esse nó a um **Google Sheets** (append row) ou direto ao seu CRM.

**No Make:** novo cenário → **Webhooks → Custom webhook** → *Add* → copie a URL.

Salve o workflow/cenário **ativo**, senão a URL não responde.

## Passo 2 — Ligar o site ao webhook

Em [`js/main.js`](../js/main.js), no topo, cole a URL:

```js
const LEAD_WEBHOOK_URL = 'https://seu-n8n.com/webhook/lead-quiropraxia';
```

Vazio, nada é enviado e o site funciona igual. É o estado atual.

## Passo 3 — O que chega no webhook

### Primeiro: converter o corpo em JSON

O site envia o corpo declarado como `text/plain`, e isso é intencional.
`application/json` não é um *simple content type*: o navegador exige um
preflight CORS (`OPTIONS`) antes de enviar, o webhook do n8n não responde a ele,
e a requisição morre com `net::ERR_FAILED` sem nunca chegar. Com `text/plain`
não há preflight.

O preço é que o n8n **não faz o parse sozinho**. O corpo chega como string:

```json
"body": "{\"ref\":\"P2U5F9\",\"gclid\":\"CORS_OK\", ...}"
```

Ou seja, `{{ $json.body.ref }}` retorna vazio. Logo após o nó **Webhook**,
acrescente um nó **Code**:

```js
return [{ json: JSON.parse($input.first().json.body) }];
```

Depois desse nó os campos ficam acessíveis direto: `{{ $json.ref }}`,
`{{ $json.gclid }}`, `{{ $json.utm_campaign }}`, `{{ $json.click_location }}`.

Sem nó extra, também funciona na expressão: `{{ JSON.parse($json.body).ref }}`.

### O conteúdo do corpo

```json
{
  "ref": "A7K2M9",
  "gclid": "Cj0KCQjw_5i2BhDaARIsAJ...",
  "gbraid": "",
  "wbraid": "",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "dor-lombar",
  "utm_term": "quiropraxia barra da tijuca",
  "utm_content": "",
  "referrer": "",
  "landing_page": "https://quiropraxia.giselleguimaraes.com.br/?gclid=...",
  "created_at": "2026-09-08T23:40:00.000Z",
  "click_location": "hero"
}
```

`gbraid` e `wbraid` substituem o `gclid` quando a pessoa não aceita cookies.
Guarde os três: na hora de importar a conversão, use o que estiver preenchido.

`click_location` diz qual dos 4 botões foi clicado: `header`, `hero`,
`final_cta` ou `floating_button`.

## Passo 4 — Extrair o código no CRM

Na mensagem recebida pela UAZAPI, o código está no fim do texto. Regex:

```
\(ref ([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6})\)
```

O alfabeto não tem `0`, `O`, `1`, `I` nem `L`, para ninguém confundir ao ler.

Com o código em mãos, busque a linha correspondente na planilha (ou tabela) do
passo 3 e copie campanha, termo e `gclid` para o cadastro do lead.

## Passo 5 — Conversão offline no Google Ads

Quando o lead vira paciente:

1. **Objetivos → Conversões → Nova ação de conversão → Importar → Uploads manuais**
2. Nomeie, por exemplo, `Paciente agendado`, e defina um valor
3. Envie um CSV neste formato:

```csv
Parameters:TimeZone=America/Sao_Paulo
Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
Cj0KCQjw_5i2BhDaARIsAJ...,Paciente agendado,2026-09-10 14:30:00,400,BRL
```

O n8n/Make pode gerar e enviar esse arquivo automaticamente quando o status do
lead mudar no CRM.

> **Prazo:** o `gclid` precisa ser enviado em até **90 dias** após o clique.
> Depois disso o Google recusa o registro.

É esse passo que muda o jogo: o algoritmo para de perseguir cliques baratos e
passa a procurar quem vira paciente.

## Limitações honestas

- **A pessoa pode apagar o `(ref ...)`** antes de enviar a mensagem. Não há
  solução; o lead só perde a atribuição.
- **Bloqueadores de anúncio** impedem o GA4, mas **não** afetam o webhook nem o
  código na mensagem, que são do próprio site.
- **Navegação anônima** pode bloquear o `sessionStorage`. O código continua
  funcionando, mas não sobrevive a um recarregamento da página.
- **Tráfego que não vem de anúncio** (orgânico, Instagram, indicação) gera
  código normalmente, só com `gclid` vazio. Isso é útil: você passa a
  distinguir lead pago de lead orgânico.

## LGPD

O rodapé do site informa a coleta de origem e o armazenamento da conversa, com
e-mail para acesso, correção e exclusão dos dados.

Atenção: conversas sobre dor e saúde são **dado pessoal sensível** (LGPD, art.
5º, II). A base legal aplicável é a tutela da saúde por profissional de saúde
(art. 11, II, "f"). Na prática: use esses dados para atender e agendar, não para
outras finalidades, e não os compartilhe com terceiros sem consentimento
específico.
