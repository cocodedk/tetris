// Every piece of UI text, in English and Persian. Pure: no DOM.
export const STRINGS = {
  en: {
    title: 'Tetris',
    otherLanguage: 'فارسی',
    start: 'Start',
    playAgain: 'Play again',
    resume: 'Resume',
    paused: 'Paused',
    gameOver: 'Game over',
    score: 'Score',
    best: 'Best',
    level: 'Level',
    lines: 'Lines',
    hold: 'Hold',
    next: 'Next',
    pause: 'Pause',
    controlsTitle: 'Controls',
    controlMove: '← → move',
    controlSoft: '↓ soft drop',
    controlHard: 'Space hard drop',
    controlRotate: '↑ or X rotate, Z or Ctrl rotate back',
    controlHold: 'C or Shift hold',
    controlPause: 'P or Esc pause',
    controlTouch: 'Touch: tap rotates, drag moves, flick down drops',
  },
  fa: {
    title: 'تتریس',
    otherLanguage: 'English',
    start: 'شروع',
    playAgain: 'بازی دوباره',
    resume: 'ادامه',
    paused: 'مکث',
    gameOver: 'بازی تمام شد',
    score: 'امتیاز',
    best: 'بهترین',
    level: 'مرحله',
    lines: 'خط‌ها',
    hold: 'نگه‌دار',
    next: 'بعدی',
    pause: 'مکث',
    controlsTitle: 'کلیدها',
    controlMove: '← → جابه‌جایی',
    controlSoft: '↓ پایین آوردن آرام',
    controlHard: 'Space انداختن کامل',
    controlRotate: '↑ یا X چرخش، Z یا Ctrl چرخش برعکس',
    controlHold: 'C یا Shift نگه داشتن',
    controlPause: 'P یا Esc مکث',
    controlTouch: 'لمسی: ضربه می‌چرخاند، کشیدن جابه‌جا می‌کند، کشیدن تند به پایین می‌اندازد',
  },
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export const toPersianDigits = (text) =>
  String(text).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[d]);

// Numbers for score, level and lines, in the page's digits.
export const formatNumber = (n, lang) => (lang === 'fa' ? toPersianDigits(n) : String(n));

export const strings = (lang) => STRINGS[lang] ?? STRINGS.en;
