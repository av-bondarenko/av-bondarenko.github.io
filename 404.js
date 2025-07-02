class TextMorpher {
  constructor(elementId, text, options = {}) {
    // Конфигурация
    this.element = document.getElementById(elementId);
    this.originalText = text;
    this.options = {
      speed: options.speed || 250,
      pauseOnOriginal: options.pauseOnOriginal || 1000,
      replacements: options.replacements || [
        { from: 'ш', to: '#' },
        { from: 'б', to: '@' },
        { from: 'ч', to: '&' },
        { from: 'а', to: '%' },
      ],
      ...options
    };
    
    // Состояние
    this.currentIndex = 0;
    this.intervalId = null;
    this.isRunning = false;
    this.chars = this.originalText.split('');
    
    // Создаем Map для быстрого поиска замен
    this.replacementMap = new Map(
      this.options.replacements.map(r => [r.from, r.to])
    );
    
    this.init();
  }
  
  init() {
    if (!this.element) {
      console.warn(`Элемент с ID "${elementId}" не найден`);
      return;
    }
    
    // Устанавливаем изначальный текст
    this.element.textContent = this.originalText;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    
    // Возвращаем оригинальный текст
    if (this.element) {
      this.element.textContent = this.originalText;
    }
  }
  
  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
  
  resume() {
    if (!this.isRunning) {
      this.start();
    }
  }
  
  animate() {
    this.intervalId = setInterval(() => {
      this.morphStep();
    }, this.options.speed);
  }
  
  morphStep() {
    // Находим следующий символ для замены
    const targetIndex = this.findNextReplaceableChar();
    
    if (targetIndex === -1) {
      // Нет символов для замены, показываем оригинал и делаем паузу
      this.showOriginalWithPause();
      return;
    }
    
    this.currentIndex = targetIndex;
    const morphedText = this.createMorphedText();
    this.updateDisplay(morphedText);
    
    // Переходим к следующему символу
    this.currentIndex = (this.currentIndex + 1) % this.chars.length;
  }
  
  findNextReplaceableChar() {
    let searchIndex = this.currentIndex;
    
    // Ищем следующий заменяемый символ
    for (let i = 0; i < this.chars.length; i++) {
      const char = this.chars[searchIndex];
      if (this.replacementMap.has(char)) {
        return searchIndex;
      }
      searchIndex = (searchIndex + 1) % this.chars.length;
    }
    
    return -1; // Нет заменяемых символов
  }
  
  createMorphedText() {
    return this.chars.map((char, index) => {
      if (index === this.currentIndex) {
        return this.replacementMap.get(char) || char;
      }
      return char;
    }).join('');
  }
  
  showOriginalWithPause() {
    this.updateDisplay(this.originalText);
    
    // Делаем паузу перед следующим циклом
    if (this.options.pauseOnOriginal > 0) {
      clearInterval(this.intervalId);
      setTimeout(() => {
        if (this.isRunning) {
          this.currentIndex = 0;
          this.animate();
        }
      }, this.options.pauseOnOriginal);
    }
  }
  
  updateDisplay(text) {
    if (this.element) {
      this.element.textContent = text;
    }
  }
  
  // Методы для изменения конфигурации на лету
  setSpeed(speed) {
    this.options.speed = speed;
    if (this.isRunning) {
      this.pause();
      this.resume();
    }
  }
  
  setText(newText) {
    const wasRunning = this.isRunning;
    this.stop();
    
    this.originalText = newText;
    this.chars = newText.split('');
    this.currentIndex = 0;
    
    this.updateDisplay(this.originalText);
    
    if (wasRunning) {
      this.start();
    }
  }
  
  addReplacement(from, to) {
    this.replacementMap.set(from, to);
    this.options.replacements.push({ from, to });
  }
  
  removeReplacement(from) {
    this.replacementMap.delete(from);
    this.options.replacements = this.options.replacements.filter(r => r.from !== from);
  }
}

// Упрощенная функция для быстрого использования
function createTextMorpher(elementId, text, options) {
  return new TextMorpher(elementId, text, options);
}

// Автозапуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Создаем морфер для заголовка 404
  const titleMorpher = createTextMorpher('morphing-title', '404 — Ошибочка', {
    speed: 500,
    pauseOnOriginal: 1500, // Пауза в 1 секунду на оригинальном тексте
    replacements: [
      { from: 'ш', to: '#' },
      { from: 'б', to: '@' },
      { from: 'ч', to: '&' },
      { from: 'а', to: '%' },
    ]
  });
  
  // Запускаем анимацию
  titleMorpher.start();
  
  // Пример управления анимацией (можно убрать)
  // setTimeout(() => titleMorpher.pause(), 5000);  // Пауза через 5 сек
  // setTimeout(() => titleMorpher.resume(), 7000); // Возобновление через 7 сек
  
  // Делаем морфер доступным глобально для отладки
  if (typeof window !== 'undefined') {
    window.titleMorpher = titleMorpher;
  }
});

// Обработка видимости страницы для оптимизации
document.addEventListener('visibilitychange', () => {
  if (window.titleMorpher) {
    if (document.hidden) {
      window.titleMorpher.pause();
    } else {
      window.titleMorpher.resume();
    }
  }
});