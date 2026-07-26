/* Portafile i18n — European Portuguese (pt-PT).

   ponytail: the ENGLISH STRING IS THE KEY. No key namespace to invent, no English
   dictionary to keep in sync, and a missing translation renders readable English
   instead of `undefined` or a raw key. Placeholders are %s, filled in argument order.

   Currency follows language: en → USD, pt → EUR. That is deliberate — it covers both
   real cases (Ethan's US shops, the Lisbon testers) with one setting instead of two.
   Upgrade path if a pt-BR or pt-PT/GBP shop ever appears: split S.shop.currency out
   of S.shop.lang and give money() its own switch. Don't do it before then. */
'use strict';

const I18N = {
  pt: {
    /* ---- chrome ---- */
    'Portafile — your whole shop, dialed in': 'Portafile — o seu café todo, afinado',
    'Shop name': 'Nome do café',
    'Recipes': 'Receitas',
    'Prices': 'Preços',
    'Dial-in': 'Dial-in',
    'Training': 'Formação',
    'Print': 'Imprimir',
    'Help': 'Ajuda',
    'Backup, restore, reset': 'Cópia de segurança, restauro, reinício',
    'Data ▾': 'Dados ▾',
    'Language': 'Idioma',

    /* ---- sync badge & footer ---- */
    'sync…': 'a sincronizar…',
    'synced': 'sincronizado',
    'sync offline — working locally': 'sincronização offline — a trabalhar localmente',
    'this link no longer works — ask the owner for a new one': 'este link já não funciona — peça um novo ao proprietário',
    'this shop was removed — sync is off': 'este café foi removido — a sincronização está desligada',
    'Staff view — this device shows recipes and dial-ins. Ingredient costs and margins stay with the owner.':
      'Vista de equipa — este dispositivo mostra receitas e dial-ins. Os custos dos ingredientes e as margens ficam com o proprietário.',
    'Synced: your shop also has a cloud copy so staff devices share it. Export a backup from Data.':
      'Sincronizado: o seu café tem também uma cópia na nuvem para os dispositivos da equipa a partilharem. Exporte uma cópia de segurança em Dados.',
    'Everything lives in this browser. Export a backup from Data.':
      'Tudo fica neste navegador. Exporte uma cópia de segurança em Dados.',

    /* ---- lock screen ---- */
    'Link turned off — Portafile': 'Link desligado — Portafile',
    'This link has been turned off': 'Este link foi desligado',
    "The shop owner reset the staff link, so this device no longer has access to the shop's recipes, prices or training records. The copy that was stored on this device has been removed.":
      'O proprietário reiniciou o link da equipa, pelo que este dispositivo já não tem acesso às receitas, preços ou registos de formação do café. A cópia guardada neste dispositivo foi removida.',
    'Ask the owner for the new link and open it on this device.':
      'Peça o novo link ao proprietário e abra-o neste dispositivo.',

    /* ---- recipes dashboard ---- */
    'drinks': 'bebidas',
    'beans on the board': 'cafés no quadro',
    'baristas': 'baristas',
    'avg cost of goods': 'custo médio das bebidas',
    'over %s% target': 'acima do objetivo de %s%',
    'thinnest margin': 'margem mais baixa',
    '%s cost on %s — %s': '%s de custo sobre %s — %s',
    'no menu price': 'sem preço de menu',
    'COGS target': 'objetivo de custo',
    'Recipe cards': 'Fichas técnicas',
    '+ New drink': '+ Nova bebida',

    /* ---- recipe card ---- */
    'menu': 'menu',
    'costs you': 'custa-lhe',
    '%s% COGS': '%s% de custo',
    'underwater': 'dá prejuízo',
    'keeps %s': 'margem %s',
    'Edit': 'Editar',
    'Duplicate': 'Duplicar',
    'Delete': 'Eliminar',
    '%s: %sg in → %sg out, %ss (grind %s)': '%s: %sg dentro → %sg fora, %ss (moagem %s)',
    '%s: no dial-in logged yet': '%s: ainda sem dial-in registado',

    /* ---- recipe form ---- */
    'New drink': 'Nova bebida',
    'Edit — %s': 'Editar — %s',
    'Name': 'Nome',
    'Category': 'Categoria',
    'Size': 'Tamanho',
    'Menu price': 'Preço de menu',
    'Espresso bean (for dial-in ref)': 'Café espresso (para referência de dial-in)',
    '— none —': '— nenhum —',
    'Build (ingredient + quantity)': 'Composição (ingrediente + quantidade)',
    '+ add ingredient': '+ adicionar ingrediente',
    'Steps (one per line)': 'Passos (um por linha)',
    'Cancel': 'Cancelar',
    'Save drink': 'Guardar bebida',
    'Untitled': 'Sem nome',
    'espresso + milk': 'espresso + leite',
    '12 oz': '350 ml',

    /* ---- prices ---- */
    'Ingredient prices': 'Preços dos ingredientes',
    "This page is the owner's. Ask them if a build looks wrong.":
      'Esta página é do proprietário. Fale com ele se alguma composição parecer errada.',
    "Starter numbers are estimates — put in what you actually pay. Every card re-prices the moment you change a number here. That laminated price list from 2023? This is the version that can't go stale.":
      'Os valores iniciais são estimativas — introduza o que paga na realidade. Todas as fichas são recalculadas no momento em que altera um número aqui. Aquela lista de preços plastificada de 2023? Esta é a versão que não fica desatualizada.',
    'Ingredient': 'Ingrediente',
    'Unit': 'Unidade',
    'Cost / unit': 'Custo / unidade',
    'Used in': 'Usado em',
    '+ Add ingredient': '+ Adicionar ingrediente',
    'New ingredient': 'Novo ingrediente',
    'each': 'un.',

    /* ---- dial-in ---- */
    'Dial-in board': 'Quadro de dial-in',
    '+ Add bean': '+ Adicionar café',
    'The morning question — "what\'s the grind today?" — answered without asking. Log every adjustment; the history is your shop\'s memory when that bean comes back next season.':
      'A pergunta da manhã — "qual é a moagem hoje?" — respondida sem perguntar. Registe cada ajuste; o histórico é a memória do seu café quando aquele lote voltar na próxima estação.',
    'grind': 'moagem',
    'dose in': 'dose',
    'yield out': 'extração',
    'time': 'tempo',
    'set %s': 'definido %s',
    'no dial-in yet — log the first one below': 'ainda sem dial-in — registe o primeiro abaixo',
    'dose g': 'dose g',
    'yield g': 'extração g',
    'sec': 'seg',
    'note (optional)': 'nota (opcional)',
    'Log': 'Registar',
    'remove bean': 'remover café',
    'New bean': 'Novo café',
    'Bean name': 'Nome do lote',
    'e.g. Colombia Huila decaf': 'ex. Colômbia Huila descafeinado',
    'Roaster': 'Torrefação',
    'who roasts it': 'quem o torra',
    'Add bean': 'Adicionar café',

    /* ---- training ---- */
    'Training path': 'Percurso de formação',
    'The new-hire pack, alive. Reorder the path, then track sign-offs per barista. Print it from the Print tab before their first shift.':
      'O manual de acolhimento, vivo. Reordene o percurso e registe as validações por barista. Imprima-o no separador Imprimir antes do primeiro turno.',
    'The path': 'O percurso',
    '(deleted drink)': '(bebida eliminada)',
    '+ drink…': '+ bebida…',
    "+ custom skill, e.g. 'Closing checklist'": "+ competência própria, ex. 'Checklist de fecho'",
    'Add': 'Adicionar',
    'Sign-offs': 'Validações',
    '+ barista': '+ barista',
    'remove': 'remover',
    '%s/%s signed off': '%s/%s validadas',
    'Add a barista to start tracking.': 'Adicione um barista para começar a registar.',

    /* ---- print ---- */
    'Print packs': 'Dossiês para imprimir',
    'Paper survives the rush. Print, laminate, tape where the work happens. Cards and the new-hire pack never show your costs — the Margin Report is the owner-only page.':
      'O papel sobrevive à hora de ponta. Imprima, plastifique, cole onde se trabalha. As fichas e o manual de acolhimento nunca mostram os seus custos — o Relatório de margens é a página só do proprietário.',
    'Every drink as a 4×6-style card: build, steps, current dial-in. Two per page.':
      'Cada bebida numa ficha estilo 10×15: composição, passos, dial-in atual. Duas por página.',
    'Print cards': 'Imprimir fichas',
    'Station sheet': 'Folha de posto',
    'The whole menu on one dense page. Tape it to the low-boy.':
      'O menu completo numa página densa. Cole-a na bancada frigorífica.',
    'Print sheet': 'Imprimir folha',
    'New-hire pack': 'Manual de acolhimento',
    "Cover + training checklist + every card + today's dial-ins. Ready before Monday.":
      'Capa + checklist de formação + todas as fichas + os dial-ins de hoje. Pronto antes de segunda-feira.',
    'Print pack': 'Imprimir manual',
    'Margin report': 'Relatório de margens',
    'Owner-only: cost, margin and COGS% per drink, flagged against your target.':
      'Só para o proprietário: custo, margem e % de custo por bebida, sinalizados face ao seu objetivo.',
    'Print report': 'Imprimir relatório',
    'recipe cards': 'fichas técnicas',
    'station sheet': 'folha de posto',
    'Drink': 'Bebida',
    'Build': 'Composição',
    'Steps': 'Passos',
    'Welcome to the bar.': 'Bem-vindo ao balcão.',
    'Your training pack — printed %s by portafile': 'O seu manual de formação — impresso a %s pelo portafile',
    'training path': 'percurso de formação',
    'Day %s': 'Dia %s',
    "today's dial-ins": 'dial-ins de hoje',
    'grind %s · %sg in → %sg out · %ss': 'moagem %s · %sg dentro → %sg fora · %ss',
    '%s — check the board': '%s — confirme no quadro',
    'margin report — owner copy': 'relatório de margens — cópia do proprietário',
    'Menu': 'Menu',
    'Cost': 'Custo',
    'Keeps': 'Margem',
    'COGS%': '% custo',
    'vs %s% target': 'face ao objetivo de %s%',
    'OK': 'OK',
    'OVER — reprice or rebuild': 'ACIMA — reveja o preço ou a composição',
    'Ingredient prices as entered on %s. Excludes labor and rent — this is drink-level COGS only.':
      'Preços dos ingredientes conforme introduzidos a %s. Exclui mão de obra e renda — este é apenas o custo da bebida.',

    /* ---- relative time ---- */
    'just now': 'agora mesmo',
    '%sh ago': 'há %sh',
    '%sd ago': 'há %sd',

    /* ---- data menu ---- */
    'Your data': 'Os seus dados',
    'This shop has a cloud copy so every device on the staff link shares it. Export a JSON backup too — that file is yours and needs no internet.':
      'Este café tem uma cópia na nuvem, partilhada por todos os dispositivos com o link da equipa. Exporte também uma cópia JSON — esse ficheiro é seu e não precisa de internet.',
    'Everything lives in this browser only. Export a JSON backup and keep it with the shop docs; import it on any other machine.':
      'Tudo fica apenas neste navegador. Exporte uma cópia JSON e guarde-a com os documentos do café; importe-a em qualquer outra máquina.',
    'Export backup': 'Exportar cópia',
    'Import': 'Importar',
    'Reset to demo': 'Voltar à demonstração',
    'Sync (share with your staff)': 'Sincronização (partilhar com a equipa)',
    'This device is synced. Anyone who opens this secret link sees and edits the same live data — no account needed:':
      'Este dispositivo está sincronizado. Quem abrir este link secreto vê e edita os mesmos dados em direto — sem conta:',
    'Copy link': 'Copiar link',
    'Copied!': 'Copiado!',
    'Reset staff link': 'Reiniciar link da equipa',
    'Turn off sync on this device': 'Desligar a sincronização neste dispositivo',
    'Owner?': 'É o proprietário?',
    'This device is on the staff link, so ingredient costs and margins are hidden. If the shop is yours, paste your owner code to see them here. Find it on the device where you first turned on sync, under Data ▾.':
      'Este dispositivo usa o link da equipa, por isso os custos e as margens estão escondidos. Se o café é seu, cole o seu código de proprietário para os ver aqui. Encontra-o no dispositivo onde ligou a sincronização pela primeira vez, em Dados ▾.',
    'owner code': 'código de proprietário',
    'Unlock': 'Desbloquear',
    'Owner code': 'Código de proprietário',
    'Unlocks the cost pages on your <em>own</em> other devices. Treat it like a key: anyone who has it can also reset the staff link. Never give it to staff.':
      'Desbloqueia as páginas de custos nos seus <em>próprios</em> outros dispositivos. Trate-o como uma chave: quem o tiver pode também reiniciar o link da equipa. Nunca o dê à equipa.',
    "Turn on sync to get a secret link: open it on any phone or laptop and everyone shares the same live data. Your data then also lives in Portafile's cloud storage.":
      'Ligue a sincronização para obter um link secreto: abra-o em qualquer telemóvel ou portátil e todos partilham os mesmos dados em direto. Os seus dados passam então a existir também no armazenamento na nuvem do Portafile.',
    'Turn on sync': 'Ligar sincronização',
    'Reset the staff link?\n\nEvery phone and laptop using the old link loses access immediately, and the shop data stored on those devices is erased. Your own device keeps everything. You cannot undo this.':
      'Reiniciar o link da equipa?\n\nTodos os telemóveis e portáteis com o link antigo perdem o acesso imediatamente, e os dados do café guardados nesses dispositivos são apagados. O seu dispositivo mantém tudo. Não é possível anular.',
    'New staff link created. Every old link has stopped working and those devices have been wiped — share the new link with your staff.':
      'Novo link da equipa criado. Todos os links antigos deixaram de funcionar e esses dispositivos foram limpos — partilhe o novo link com a sua equipa.',
    'Could not reset the link — check your connection and try again.':
      'Não foi possível reiniciar o link — verifique a ligação e tente novamente.',
    'That does not look like an owner code.': 'Isto não parece um código de proprietário.',
    'Checking…': 'A verificar…',
    "That is not this shop's owner code.": 'Esse não é o código de proprietário deste café.',
    'Could not check right now — try again when you have signal.':
      'Não foi possível verificar agora — tente novamente quando tiver rede.',
    'Replace everything with the demo shop?': 'Substituir tudo pelo café de demonstração?',
    'Could not import: %s': 'Não foi possível importar: %s',
    'not a portafile backup': 'não é uma cópia do portafile',
    'backup is damaged: %s': 'a cópia está danificada: %s',

    /* ---- help ---- */
    'How Portafile works': 'Como funciona o Portafile',
    'Every card shows what the drink <em>costs you</em> next to its menu price. The badge goes red when cost-of-goods passes your target (set it on the dashboard). Espresso drinks carry the live dial-in for their bean.':
      'Cada ficha mostra o que a bebida <em>lhe custa</em> ao lado do preço de menu. A etiqueta fica vermelha quando o custo passa o seu objetivo (defina-o no painel). As bebidas de espresso trazem o dial-in em direto do seu café.',
    "One table of what you pay. Change a number → every card re-prices. When milk or beans jump, you'll see which drinks went underwater the same minute.":
      'Uma tabela do que paga. Altere um número e todas as fichas são recalculadas. Quando o leite ou o café sobem, vê no mesmo minuto quais as bebidas que passaram a dar prejuízo.',
    'Log grind/dose/yield/time per bean. The newest entry is "the board" — it appears on cards and print packs. History stays forever.':
      'Registe moagem/dose/extração/tempo por café. O registo mais recente é "o quadro" — aparece nas fichas e nos dossiês impressos. O histórico fica para sempre.',
    'Order the path (drinks + custom skills, grouped by day), pick a barista, tick sign-offs. Progress is saved per barista.':
      'Ordene o percurso (bebidas + competências próprias, agrupadas por dia), escolha um barista, marque as validações. O progresso é guardado por barista.',
    'Cards and the new-hire pack hide costs on purpose — they get taped where customers can see. The margin report is the owner-only page.':
      'As fichas e o manual de acolhimento escondem os custos de propósito — ficam colados onde os clientes veem. O relatório de margens é a página só do proprietário.',
    'Lives in this browser (localStorage). <strong>Data → Export backup</strong> before switching machines. No account, no bill. If you turn on <strong>Sync</strong> (Data menu), your data also lives in Portafile\'s cloud storage so staff phones share it via a secret link.':
      'Ficam neste navegador (localStorage). <strong>Dados → Exportar cópia</strong> antes de mudar de máquina. Sem conta, sem fatura. Se ligar a <strong>Sincronização</strong> (menu Dados), os seus dados passam a existir também no armazenamento na nuvem do Portafile para os telemóveis da equipa os partilharem por um link secreto.',
    'Devices that join through the staff link see recipes, dial-ins and training — never ingredient costs, margins or the price table. Those stay on the owner\'s devices (the ones holding the owner code, under Data ▾).':
      'Os dispositivos que entram pelo link da equipa veem receitas, dial-ins e formação — nunca custos de ingredientes, margens ou a tabela de preços. Esses ficam nos dispositivos do proprietário (os que têm o código de proprietário, em Dados ▾).',
    'Staff view': 'Vista de equipa',
    'Got it': 'Entendido',
    'Send feedback': 'Enviar comentário',

    /* ---- feedback ---- */
    "How's Portafile working?": 'Como está a correr o Portafile?',
    'This goes straight to the person who builds it. Nothing from your recipes, prices or staff list is attached — only what you write here.':
      'Isto vai diretamente para quem o constrói. Nada das suas receitas, preços ou lista de pessoal é anexado — apenas o que escrever aqui.',
    '👍 Working well': '👍 Está a funcionar bem',
    "👎 Something's wrong": '👎 Algo está mal',
    'What happened?': 'O que aconteceu?',
    '(optional)': '(opcional)',
    'Email, if you want a reply': 'Email, se quiser resposta',
    'Send': 'Enviar',
    'Pick 👍 or 👎 first.': 'Escolha 👍 ou 👎 primeiro.',
    'Sending…': 'A enviar…',
    'Thanks — got it.': 'Obrigado — recebido.',
    'Could not send — try again when you have signal.':
      'Não foi possível enviar — tente novamente quando tiver rede.',

    /* ---- confirms & alerts ---- */
    'Delete "%s"?': 'Eliminar "%s"?',
    '%s (copy)': '%s (cópia)',
    "Can't delete — used in: %s. Remove it from those drinks first.":
      'Não é possível eliminar — usado em: %s. Retire-o dessas bebidas primeiro.',
    'Grind, dose, yield and time all need numbers.':
      'Moagem, dose, extração e tempo precisam todos de números.',
    'This bean is on: %s. Point those drinks at another bean first.':
      'Este café está em: %s. Aponte essas bebidas para outro café primeiro.',
    'Remove bean and its dial-in history?': 'Remover o café e o seu histórico de dial-in?',
    'Barista name:': 'Nome do barista:',
    'Remove %s and their sign-offs?': 'Remover %s e as suas validações?',

    /* ---- access gate ---- */
    'Before you brew…': 'Antes de começar…',
    'Portafile is free. Tell us who\'s using it so we know which shops to build for — and so we can help if something breaks.':
      'O Portafile é gratuito. Diga-nos quem o está a usar para sabermos para que cafés construir — e para podermos ajudar se algo falhar.',
    'Email': 'Email',
    'e.g. Northside Espresso': 'ex. Café da Baixa',
    'Your role': 'A sua função',
    'Owner': 'Proprietário',
    'Manager': 'Gerente',
    'Barista': 'Barista',
    'Roaster|role': 'Torrefador',
    'Just curious': 'Só curiosidade',
    'City / country': 'Cidade / país',
    'Phone (optional)': 'Telefone (opcional)',
    'Open Portafile': 'Abrir o Portafile',
    'No password, no verification email — this browser stays unlocked.':
      'Sem palavra-passe, sem email de verificação — este navegador fica desbloqueado.',
    'How we handle your details': 'Como tratamos os seus dados',
  },
};

/* pt only when the browser actually asks for Portuguese — pt-PT, pt-BR and bare pt all count.
   Everything else (including Ethan's en-US and every Playwright run) stays English. */
function detectLang() {
  const ls = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  return [...ls].some(l => String(l).toLowerCase().startsWith('pt')) ? 'pt' : 'en';
}

let APP_LANG = 'en';
const setLang = l => { APP_LANG = l === 'pt' ? 'pt' : 'en'; };
const getLang = () => APP_LANG;

/* t('Delete "%s"?', name) — %s placeholders fill in argument order.
   A missing pt entry returns the English key, so nothing ever renders as undefined.

   'Word|context' disambiguates one English word that needs two translations — "Roaster" is the
   company on the bean form but a person in the signup role list. Only the fallback strips the
   suffix, so English shows "Roaster" and pt picks the right word. */
function t(s, ...a) {
  const d = I18N[APP_LANG];
  const out = (d && d[s]) || s.split('|')[0];
  return a.length ? out.replace(/%s/g, () => (a.length ? String(a.shift()) : '')) : out;
}

/* Intl does the decimal comma and the trailing € for pt-PT ("1,22 €") and the leading $ for
   en-US, so no format strings live here. Cached because money() runs per card per render. */
const MONEY_FMT = {};
function money(n) {
  const l = APP_LANG;
  if (!MONEY_FMT[l]) {
    MONEY_FMT[l] = new Intl.NumberFormat(l === 'pt' ? 'pt-PT' : 'en-US',
      { style: 'currency', currency: l === 'pt' ? 'EUR' : 'USD' });
  }
  return MONEY_FMT[l].format(Number(n) || 0);
}
const currencySymbol = () => (APP_LANG === 'pt' ? '€' : '$');
const localeTag = () => (APP_LANG === 'pt' ? 'pt-PT' : 'en-US');
/* Percentages with a decimal need the comma too — "24,6%" not "24.6%" in a Portuguese figure. */
const num = (n, d) => Number(n || 0).toLocaleString(localeTag(), { minimumFractionDigits: d, maximumFractionDigits: d });

/* Dial-in figures ("moagem 12,2"). These are the ONE set of numbers that are not guaranteed to be
   numbers: parseFloat only runs when a value is typed locally, so a synced or imported shop can
   hold any string in dialins. So format only what is genuinely finite and pass anything else
   through untouched — callers still esc() the result, and must keep doing so. Never dec(esc(x)). */
const dec = v => (v !== '' && v !== null && v !== undefined && isFinite(v))
  ? Number(v).toLocaleString(localeTag())
  : v;
