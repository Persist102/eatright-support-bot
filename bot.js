/**
 * EatRight Support Bot
 * @eatright_support_bot
 */

const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8764186930:AAEyTY9YD5-EWTUI-7-Sggd5bODRln3JXN0';
const ADMIN_ID = 508840638;
const ADMIN_LINK = 'https://t.me/persist1';

const bot = new TelegramBot(TOKEN, { polling: true });

const userState = {};

// ── Matnlar ───────────────────────────────────────────────
const T = {
  uz: {
    welcome:      "👋 EatRight qo'llab-quvvatlash botiga xush kelibsiz!\n\nQuyidagi variantlardan birini tanlang:",
    askMsg:       '✍️ Muammoni batafsil yozing, tez orada javob beramiz:',
    sent:         '✅ Xabaringiz qabul qilindi! Tez orada javob beramiz.',
    back:         '⬅️ Orqaga',
    langPrompt:   'Tilni tanlang:',

    // To'lov sub-menyu
    paymentMenu:  "💳 To'lov bo'limi. Quyidagi variantlardan birini tanlang:",
    payUzb:       "🇺🇿 O'zbekistondan sotib olish",
    payAbroad:    '🌍 Chet eldan sotib olish',
    payProblem:   "⚠️ To'lov bo'yicha muammo",

    // To'lov yo'naltirish xabari
    payRedirect:  "💬 To'lov masalasi bo'yicha to'g'ridan-to'g'ri murojaat qiling:",
    payBtn:       "💬 Admin bilan bog'lanish",
  },
  ru: {
    welcome:      '👋 Добро пожаловать в бот поддержки EatRight!\n\nВыберите один из вариантов:',
    askMsg:       '✍️ Опишите проблему подробнее, мы ответим вам быстро:',
    sent:         '✅ Ваше сообщение получено! Ответим в ближайшее время.',
    back:         '⬅️ Назад',
    langPrompt:   'Выберите язык:',

    paymentMenu:  '💳 Раздел оплаты. Выберите один из вариантов:',
    payUzb:       '🇺🇿 Купить из Узбекистана',
    payAbroad:    '🌍 Купить из-за рубежа',
    payProblem:   '⚠️ Проблема с оплатой',

    payRedirect:  '💬 По вопросам оплаты обращайтесь напрямую:',
    payBtn:       '💬 Связаться с администратором',
  },
};

const TOPIC_LABELS = {
  bug:     { uz: '🐛 Ilova muammosi',  ru: '🐛 Проблема с приложением' },
  suggest: { uz: '💡 Taklif',          ru: '💡 Предложение' },
};

function getLang(chatId) {
  return userState[chatId]?.lang || 'uz';
}

// ── Klaviaturalar ─────────────────────────────────────────
function mainKeyboard(lang) {
  const t = T[lang];
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🐛 Ilova muammosi' }, { text: "💳 To'lov masalasi" }],
        [{ text: '💡 Taklif' },         { text: '🌐 Tilni o\'zgartirish' }],
      ],
      resize_keyboard: true,
    },
  };
}

function mainKeyboardRu() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🐛 Проблема с приложением' }, { text: '💳 Вопрос по оплате' }],
        [{ text: '💡 Предложение' },             { text: '🌐 Изменить язык' }],
      ],
      resize_keyboard: true,
    },
  };
}

function paymentKeyboard(lang) {
  const t = T[lang];
  return {
    reply_markup: {
      keyboard: [
        [{ text: t.payUzb }],
        [{ text: t.payAbroad }],
        [{ text: t.payProblem }],
        [{ text: t.back }],
      ],
      resize_keyboard: true,
    },
  };
}

function backKeyboard(lang) {
  return {
    reply_markup: {
      keyboard: [[{ text: T[lang].back }]],
      resize_keyboard: true,
    },
  };
}

function langKeyboard() {
  return {
    reply_markup: {
      keyboard: [[{ text: "🇺🇿 O'zbek" }, { text: '🇷🇺 Русский' }]],
      resize_keyboard: true,
    },
  };
}

function adminInlineBtn(lang) {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: T[lang].payBtn, url: ADMIN_LINK },
      ]],
    },
  };
}

// ── /start ────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!userState[chatId]) userState[chatId] = { lang: 'uz' };
  userState[chatId].step = 'menu';
  const lang = getLang(chatId);
  const kb = lang === 'ru' ? mainKeyboardRu() : mainKeyboard(lang);
  bot.sendMessage(chatId, T[lang].welcome, kb);
});

// ── Xabarlar ──────────────────────────────────────────────
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith('/')) return;

  if (!userState[chatId]) userState[chatId] = { lang: 'uz', step: 'menu' };
  const state = userState[chatId];
  const lang = getLang(chatId);
  const t = T[lang];

  // ── Til tanlash ──
  if (state.step === 'chooseLang') {
    if (text.includes("O'zbek") || text.includes('Uzbek')) {
      userState[chatId].lang = 'uz';
    } else if (text.includes('Русский')) {
      userState[chatId].lang = 'ru';
    }
    userState[chatId].step = 'menu';
    const nl = getLang(chatId);
    const kb = nl === 'ru' ? mainKeyboardRu() : mainKeyboard(nl);
    return bot.sendMessage(chatId, T[nl].welcome, kb);
  }

  // ── Orqaga ──
  if (text === t.back) {
    userState[chatId].step = 'menu';
    const kb = lang === 'ru' ? mainKeyboardRu() : mainKeyboard(lang);
    return bot.sendMessage(chatId, t.welcome, kb);
  }

  // ── To'lov sub-menyu ichida tanlov ──
  if (state.step === 'paymentMenu') {
    if (text === t.payUzb || text === t.payAbroad || text === t.payProblem) {
      userState[chatId].step = 'menu';
      return bot.sendMessage(chatId, t.payRedirect, adminInlineBtn(lang));
    }
  }

  // ── Asosiy menyu tanlovlari ──
  const isPayment = text === "💳 To'lov masalasi" || text === '💳 Вопрос по оплате';
  const isBug     = text === '🐛 Ilova muammosi'  || text === '🐛 Проблема с приложением';
  const isSuggest = text === '💡 Taklif'           || text === '💡 Предложение';
  const isLang    = text.includes('Tilni') || text.includes('Изменить язык');

  if (isPayment) {
    userState[chatId].step = 'paymentMenu';
    return bot.sendMessage(chatId, t.paymentMenu, paymentKeyboard(lang));
  }

  if (isLang) {
    userState[chatId].step = 'chooseLang';
    return bot.sendMessage(chatId, t.langPrompt, langKeyboard());
  }

  if (isBug || isSuggest) {
    userState[chatId].step = 'typing';
    userState[chatId].topic = isBug ? 'bug' : 'suggest';
    return bot.sendMessage(chatId, t.askMsg, backKeyboard(lang));
  }

  // ── Foydalanuvchi xabar yozdi ──
  if (state.step === 'typing') {
    const topicLabel = TOPIC_LABELS[state.topic]?.[lang] || state.topic;
    const userName = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    const userId = msg.from.id;

    bot.sendMessage(
      ADMIN_ID,
      `📩 *Yangi murojaat*\n\n👤 ${userName} (ID: \`${userId}\`)\n📌 ${topicLabel}\n\n💬 ${text}\n\n_Javob: /reply_${userId}_xabar_`,
      { parse_mode: 'Markdown' }
    );

    userState[chatId].step = 'menu';
    const kb = lang === 'ru' ? mainKeyboardRu() : mainKeyboard(lang);
    bot.sendMessage(chatId, t.sent, kb);
  }
});

// ── Admin javob ───────────────────────────────────────────
bot.onText(/\/reply_(\d+)_(.+)/, (msg, match) => {
  if (msg.chat.id !== ADMIN_ID) return;
  const targetId = parseInt(match[1]);
  const replyText = match[2];
  bot.sendMessage(targetId, `📬 *EatRight Support:*\n\n${replyText}`, { parse_mode: 'Markdown' });
  bot.sendMessage(ADMIN_ID, '✅ Javob yuborildi!');
});

console.log('🤖 EatRight Support Bot ishga tushdi...');
