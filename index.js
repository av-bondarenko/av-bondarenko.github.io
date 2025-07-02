// Утилиты для работы с localStorage
const Storage = {
  get(key, defaultValue = null) {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (error) {
      console.warn('Ошибка чтения localStorage:', error);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Ошибка записи в localStorage:', error);
    }
  }
};

// Менеджер тем
class ThemeManager {
  constructor() {
    this.toggleButton = document.getElementById('theme-toggle');
    this.body = document.body;
    this.themeSound = document.getElementById('theme-sound');
    
    this.init();
  }
  
  init() {
    // Загружаем сохранённую тему
    this.loadSavedTheme();
    
    // Привязываем событие переключения
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggleTheme());
    }
  }
  
  toggleTheme() {
    const isLight = this.body.classList.contains('light-theme');
    
    if (isLight) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
    
    this.playSound();
  }
  
  setTheme(theme) {
    this.body.classList.remove('light-theme', 'dark-theme');
    this.body.classList.add(`${theme}-theme`);
    Storage.set('theme', theme);
  }
  
  loadSavedTheme() {
    const savedTheme = Storage.get('theme', 'light');
    this.setTheme(savedTheme);
  }
  
  playSound() {
    if (this.themeSound) {
      try {
        this.themeSound.volume = 0.1;
        this.themeSound.currentTime = 0;
        this.themeSound.play().catch(error => {
          console.warn('Не удалось воспроизвести звук:', error);
        });
      } catch (error) {
        console.warn('Ошибка при воспроизведении звука:', error);
      }
    }
  }
}

// Менеджер языков
class LanguageManager {
  constructor() {
    this.switcher = document.getElementById('language-switcher');
    this.elements = document.querySelectorAll('[data-lang]');
    this.flagEn = document.querySelector('.flag-en');
    this.flagRu = document.querySelector('.flag-ru');
    this.currentLang = Storage.get('language', 'en');
    
    this.init();
  }
  
  init() {
    this.setLanguage(this.currentLang);
    
    if (this.switcher) {
      this.switcher.addEventListener('click', () => this.toggleLanguage());
    }
  }
  
  setLanguage(lang) {
    this.currentLang = lang;
    
    // Переключаем видимость элементов
    this.elements.forEach(el => {
      el.style.display = el.getAttribute('data-lang') === lang ? 'block' : 'none';
    });
    
    // Переключаем флаги
    if (this.flagEn) this.flagEn.style.display = lang === 'en' ? 'block' : 'none';
    if (this.flagRu) this.flagRu.style.display = lang === 'ru' ? 'block' : 'none';
    
    // Сохраняем выбор
    Storage.set('language', lang);
    
    // Уведомляем другие компоненты о смене языка
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }
  
  toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'ru' : 'en';
    this.setLanguage(newLang);
  }
  
  getCurrentLanguage() {
    return this.currentLang;
  }
}

// Менеджер попапов
class PopupManager {
  constructor() {
    this.popups = {
      en: {
        trigger: document.getElementById('open-policy-en'),
        overlay: document.getElementById('policy-popup-en'),
        closeBtn: null
      },
      ru: {
        trigger: document.getElementById('open-policy-ru'),
        overlay: document.getElementById('policy-popup-ru'),
        closeBtn: null
      }
    };
    
    this.init();
  }
  
  init() {
    Object.keys(this.popups).forEach(lang => {
      const popup = this.popups[lang];
      
      if (popup.overlay) {
        popup.closeBtn = popup.overlay.querySelector('.close-btn');
        this.setupPopupEvents(popup);
      }
    });
  }
  
  setupPopupEvents(popup) {
    // Открытие попапа
    if (popup.trigger) {
      popup.trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPopup(popup.overlay);
      });
    }
    
    // Закрытие по клику на оверлей
    popup.overlay.addEventListener('click', (e) => {
      if (e.target === popup.overlay) {
        this.hidePopup(popup.overlay);
      }
    });
    
    // Закрытие по кнопке
    if (popup.closeBtn) {
      popup.closeBtn.addEventListener('click', () => {
        this.hidePopup(popup.overlay);
      });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.overlay.style.display === 'block') {
        this.hidePopup(popup.overlay);
      }
    });
  }
  
  showPopup(overlay) {
    if (overlay) {
      overlay.style.display = 'block';
      // Блокируем скролл на странице
      document.body.style.overflow = 'hidden';
    }
  }
  
  hidePopup(overlay) {
    if (overlay) {
      overlay.style.display = 'none';
      // Восстанавливаем скролл
      document.body.style.overflow = '';
    }
  }
}

// Менеджер анимации печати
class TypewriterManager {
  constructor(languageManager) {
    this.languageManager = languageManager;
    this.outputEn = document.getElementById("typed-en");
    this.outputRu = document.getElementById("typed-ru");
    this.cursorEn = document.getElementById("cursor-en");
    this.cursorRu = document.getElementById("cursor-ru");
    
    this.index = 0;
    this.fullText = '';
    this.isTyping = false;
    this.typeSpeed = 60;
    this.highlightWords = {
      en: '{Middle}',
      ru: '{Мидл}'
    };
    
    this.init();
  }
  
  init() {
    // Слушаем смену языка
    document.addEventListener('languageChanged', (e) => {
      this.onLanguageChange(e.detail.language);
    });
    
    // Начальная настройка
    this.setupInitialState();
  }
  
  setupInitialState() {
    const currentLang = this.languageManager.getCurrentLanguage();
    this.updateDisplay(currentLang);
    this.startTyping(currentLang);
  }
  
  onLanguageChange(newLang) {
    this.stopTyping();
    this.updateDisplay(newLang);
    this.startTyping(newLang);
  }
  
  updateDisplay(lang) {
    // Переключаем видимость pre элементов
    document.querySelectorAll('pre[data-lang]').forEach(pre => {
      pre.style.display = pre.getAttribute('data-lang') === lang ? 'block' : 'none';
    });
    
    // Переключаем курсоры
    if (this.cursorEn) this.cursorEn.style.display = lang === 'en' ? 'inline-block' : 'none';
    if (this.cursorRu) this.cursorRu.style.display = lang === 'ru' ? 'inline-block' : 'none';
  }
  
  getOutputElement(lang) {
    return lang === 'en' ? this.outputEn : this.outputRu;
  }
  
  startTyping(lang) {
    const outputElement = this.getOutputElement(lang);
    if (!outputElement) return;
    
    this.fullText = outputElement.getAttribute("data-text") || '';
    this.index = 0;
    this.isTyping = true;
    outputElement.innerHTML = '';
    
    this.typeWriter(outputElement, lang);
  }
  
  stopTyping() {
    this.isTyping = false;
  }
  
  typeWriter(outputElement, lang) {
    if (!this.isTyping || this.index > this.fullText.length) {
      this.isTyping = false;
      return;
    }
    
    const htmlContent = this.buildHtmlContent(lang);
    outputElement.innerHTML = htmlContent;
    
    this.index++;
    
    // Используем requestAnimationFrame для лучшей производительности
    setTimeout(() => {
      if (this.isTyping) {
        this.typeWriter(outputElement, lang);
      }
    }, this.typeSpeed);
  }
  
  buildHtmlContent(lang) {
    let htmlContent = '';
    const highlightWord = this.highlightWords[lang];
    
    for (let i = 0; i < this.index && i < this.fullText.length; i++) {
      const char = this.fullText[i];
      
      // Подсвечиваем специальные слова
      if (highlightWord && i < highlightWord.length) {
        htmlContent += `<span class="green">${char}</span>`;
      } else {
        htmlContent += char;
      }
    }
    
    return htmlContent;
  }
}

// Главный контроллер приложения
class AppController {
  constructor() {
    this.themeManager = null;
    this.languageManager = null;
    this.popupManager = null;
    this.typewriterManager = null;
  }
  
  init() {
    try {
      // Инициализируем все менеджеры
      this.themeManager = new ThemeManager();
      this.languageManager = new LanguageManager();
      this.popupManager = new PopupManager();
      this.typewriterManager = new TypewriterManager(this.languageManager);
      
      console.log('Приложение успешно инициализировано');
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
    }
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
  console.error('Глобальная ошибка:', event.error);
});

// Экспорт для возможного использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AppController, ThemeManager, LanguageManager, PopupManager, TypewriterManager };
}