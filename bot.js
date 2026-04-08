/**
 * EatRight Support Bot
 * @eatright_support_bot
 */

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const TOKEN      = process.env.BOT_TOKEN;
const ADMIN_ID   = parseInt(process.env.ADMIN_ID);
const ADMIN_LINK = process.env.ADMIN_LINK;

const bot = new TelegramBot(TOKEN, { polling: true });

const userState = {};

// ── Matnlar ───────────────────────────────────────────────
const T = {
  uz: {
    welcome:     "👋 EatRight qo'llab-quvvatlash botiga xush kelibsiz!\n\nQuyidagi variantlardan birini tanlang:",
    askMsg:      '✍️ Muammoni batafsil yozing, tez orada javob beramiz:',
    sent:        '✅ Xabaringiz qabul qilindi! Tez orada javob beramiz.',
    back:        '⬅️ Orqaga',
    langPrompt:  'Tilni tanlang:',

    paymentMenu: "💳 To'lov bo'limi. Quyidagi variantlardan birini tanlang:",
    payUzb:      "🇺🇿 O'zbekistondan sotib olish",
    payAbroad:   '🌍 Chet eldan sotib olish',
    payProblem:  "⚠️ To'lov bo'yicha muammo",
    payRedirect: "💬 To'lov masalasi bo'yicha to'g'ridan-to'g'ri murojaat qiling:",
    payBtn:      "💬 Admin bilan bog'lanish",
  },
  ru: {
    welcome:     '👋 Добро пожаловать в бот поддержки EatRight!\n\nВыберите один из вариантов:',
    askMsg:      '✍️ Опишите проблему подробнее, мы ответим вам быстро:',
    sent:        '✅ Ваше сообщение получено! Ответим в ближайшее время.',
    back:        '⬅️ Назад',
    langPrompt:  'Выберите язык:',

    paymentMenu: '💳 Раздел оплаты. Выберите один из вариантов:',
    payUzb:      '🇺🇿 Купить из Узбекистана',
    payAbroad:   '🌍 Купить из-за рубежа',
    payProblem:  '⚠️ Проблема с оплатой',
    payRedirect: '💬 По вопросам оплаты обращайтесь напрямую:',
    payBtn:      '💬 Связаться с администратором',
  },
};

const TOPIC_LABELS = {
  bug:     { uz: '🐛 Ilova muammosi', ru: '🐛 Проблема с приложением' },
  suggest: { uz: '💡 Taklif',         ru: '💡 Предложение' },
};

function getLang(chatId) {
  return userState[chatId]?.lang || 'uz';
}

// ── Klaviaturalar ─────────────────────────────────────────
function mainKeyboard(lang) {
  if (lang === 'ru') {
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
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🐛 Ilova muammosi' }, { text: "💳 To'lov masalasi" }],
        [{ text: '💡 Taklif' },         { text: "🌐 Tilni o'zgartirish" }],
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
      inline_keyboard: [[{ text: T[lang].payBtn, url: ADMIN_LINK }]],
    },
  };
}

// ── /start ────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!userState[chatId]) userState[chatId] = { lang: 'uz' };
  userState[chatId].step = 'menu';
  const lang = getLang(chatId);
  bot.sendMessage(chatId, T[lang].welcome, mainKeyboard(lang));
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

  // ── Admin javob yozmoqda ──
  if (chatId === ADMIN_ID && state.step === 'replyTo') {
    const targetId = state.replyTargetId;
    bot.sendMessage(targetId, `📬 *EatRight Support:*\n\n${text}`, { parse_mode: 'Markdown' });
    bot.sendMessage(ADMIN_ID, '✅ Javob yuborildi!');
    userState[chatId].step = 'menu';
    return;
  }

  // ── Til tanlash ──
  if (state.step === 'chooseLang') {
    if (text.includes("O'zbek") || text.includes('Uzbek')) {
      userState[chatId].lang = 'uz';
    } else if (text.includes('Русский')) {
      userState[chatId].lang = 'ru';
    }
    userState[chatId].step = 'menu';
    const nl = getLang(chatId);
    return bot.sendMessage(chatId, T[nl].welcome, mainKeyboard(nl));
  }

  // ── Orqaga ──
  if (text === t.back) {
    userState[chatId].step = 'menu';
    return bot.sendMessage(chatId, t.welcome, mainKeyboard(lang));
  }

  // ── To'lov sub-menyu ──
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
    const userName   = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    const userId     = msg.from.id;

    // Adminga xabar + "Javob berish" tugmasi
    bot.sendMessage(
      ADMIN_ID,
      `📩 *Yangi murojaat*\n\n👤 ${userName} (ID: \`${userId}\`)\n📌 ${topicLabel}\n\n💬 ${text}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '↩️ Javob berish', callback_data: `reply_${userId}` },
          ]],
        },
      }
    );

    userState[chatId].step = 'menu';
    bot.sendMessage(chatId, t.sent, mainKeyboard(lang));
  }
});

// ── Admin "Javob berish" tugmasini bosdi ──────────────────
bot.on('callback_query', (query) => {
  if (query.from.id !== ADMIN_ID) return;

  if (query.data.startsWith('reply_')) {
    const targetId = parseInt(query.data.split('_')[1]);
    userState[ADMIN_ID] = { step: 'replyTo', replyTargetId: targetId };
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(ADMIN_ID, `✏️ Javobingizni yozing (foydalanuvchi ID: ${targetId}):`);
  }
});

console.log('🤖 EatRight Support Bot ishga tushdi...');
