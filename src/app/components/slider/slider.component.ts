import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChildren, QueryList, ElementRef, inject, Renderer2, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit, AfterViewInit, OnDestroy {
  private renderer = inject(Renderer2);

  @Input() slides: { id: number; image?: string; subtitle?: string }[] = [];
  @ViewChildren('slide') slideElements!: QueryList<ElementRef>;
  @ViewChild('slideInfo', { static: false }) slideInfo!: ElementRef;

  private rotationAngle = 0; // Глобальный угол поворота (в градусах)
  private arcAngle = 12; // Угол между слайдами
  private distance = 1000; // Радиус дуги
  private angles: number[] = []; // Углы для каждого слайда
  public centralSlideIndex = 0; // Индекс центрального слайда
  private activeSlideIndex: number | null = null; // Индекс слайда, который сейчас растянут
  extendedSlides: { id: number; image?: string; subtitle?: string; text?: string }[] = []; // Расширенный массив слайдов

  // Базовые размеры слайда (можно настроить под свои нужды)
  private get baseSlideWidth(): string {
    return window.innerWidth < 1024 ? '140px' : '340px'; // 140px для мобильных, 340px для десктопа
  }

  private get baseSlideHeight(): string {
    return window.innerWidth < 1024 ? '240px' : '540px'; // 240px для мобильных, 540px для десктопа
  }

  // Переменные для драг-жеста
  private isDragging = false;
  private startX = 0;
  private dragDistance = 0;
  private dragThreshold = 10; // Порог в пикселях для определения клика или драга
  private initialRotationAngle = 0; // Начальный угол для анимации во время драга
  private dragSensitivity = 0.5; // Чувствительность драга (уменьшаем для более плавного движения)

  // Массив для хранения функций удаления слушателей
  private eventListeners: Array<() => void> = [];
  private slideElementsSubscription: Subscription | null = null;

  ngOnInit() {
    // Если массив slides пустой, добавляем заглушку
    if (this.slides.length === 0) {
      this.slides = [{ id: 0, subtitle: 'Placeholder', image: '' }];
    }

    // Используем оригинальный массив slides
    this.extendedSlides = [...this.slides.map(slide => ({ ...slide }))];

    // Устанавливаем centralSlideIndex в середину, если элементов больше 3
    if (this.slides.length > 3) {
      this.centralSlideIndex = Math.floor((this.slides.length - 1) / 2);
    } else {
      this.centralSlideIndex = 0; // Если элементов 3 или меньше, начинаем с первого слайда
    }

    this.rotationAngle = this.arcAngle * this.centralSlideIndex;
  }

  ngAfterViewInit() {
    this.updateDistance();
    this.updateSlideSizes(); // Добавляем вызов для установки размеров
    this.updateSlidePosition();
    // Устанавливаем класс active для начального слайда
    // this.updateActiveSlide();

    // Сохраняем функцию слушателя для resize
    const onResize = () => {
      this.updateDistance();  // Обновляем радиус вращения при изменении размера окна
      this.updateSlideSizes(); // Обновляем размеры при ресайзе
      this.updateSlidePosition();
    }
    window.addEventListener('resize', onResize);
    this.eventListeners.push(() => window.removeEventListener('resize', onResize));

    // Подписываемся на изменения slideElements
    this.slideElementsSubscription = this.slideElements.changes.subscribe(() => {
      this.updateSlidePosition();
      // this.updateActiveSlide();
    });

    // Добавляем обработчики событий для драг-жеста
    this.setupDragEvents();
  }

  ngOnDestroy() {
    // Удаляем все слушатели событий при уничтожении компонента
    this.eventListeners.forEach(unsubscribe => unsubscribe());
    this.eventListeners = [];
    // Отписываемся от slideElements.changes
    if (this.slideElementsSubscription) {
      this.slideElementsSubscription.unsubscribe();
      this.slideElementsSubscription = null;
    }
  }

  // Метод trackBy для *ngFor
  trackById(index: number, slide: { id: number; image?: string; subtitle?: string }): number {
    return slide.id;
  }

  // Обновляем радиус в зависимости от ширины экрана
  private updateDistance() {
    this.distance = window.innerWidth < 1024 ? 1000 : 2600;
  }

  // Метод для обновления размеров слайдов
  private updateSlideSizes() {
    const slides = this.slideElements.toArray();
    slides.forEach((slide, index) => {
      // Обновляем размеры только для неактивных слайдов
      if (index !== this.activeSlideIndex) {
        this.renderer.setStyle(slide.nativeElement, 'width', this.baseSlideWidth);
        this.renderer.setStyle(slide.nativeElement, 'height', this.baseSlideHeight);
      }
    });

    // Обновляем CSS-переменные для .slide
    const sliderContainer = this.slideElements.first?.nativeElement.parentElement;
    if (sliderContainer) {
      this.renderer.setStyle(sliderContainer, '--slide-width', this.baseSlideWidth);
      this.renderer.setStyle(sliderContainer, '--slide-height', this.baseSlideHeight);
    }
  }

  // Обновляем позиции слайдов
  private updateSlidePosition(transition = true) {
    const slides = this.slideElements.toArray();
    this.angles = [];

    slides.forEach((slide, index) => {
      // Вычисляем угол для слайда относительно глобального rotationAngle
      const baseAngle = this.arcAngle * index;
      const angle = baseAngle - this.rotationAngle;
      this.angles[index] = angle;

      // Устанавливаем стили
      this.renderer.setStyle(slide.nativeElement, 'transform-origin', `center ${this.distance}px`);

      this.renderer.setStyle(
        slide.nativeElement,
        'transition',
        transition ? 'transform 0.8s ease, width 0.8s ease, height 0.8s ease' : 'none'
      );

      setTimeout(() => {
        // Если слайд не активный или не растянутый, возвращаем базовый transform
        if (index !== this.activeSlideIndex) {
          this.renderer.setStyle(slide.nativeElement, 'transform', `rotate(${angle}deg)`);
          this.renderer.setStyle(slide.nativeElement, 'width', this.baseSlideWidth);
          this.renderer.setStyle(slide.nativeElement, 'height', this.baseSlideHeight);
        }
      }, 0)
    });
  }

  // Настройка обработчиков событий для драг-жеста
  private setupDragEvents() {
    const sliderElement = this.slideElements.first?.nativeElement.parentElement;
    if (!sliderElement) return;

    this.renderer.setStyle(sliderElement, 'user-select', 'none');
    this.renderer.setStyle(sliderElement, '-webkit-user-select', 'none');
    this.renderer.setStyle(sliderElement, '-ms-user-select', 'none');

    // Добавляем will-change для оптимизации анимации
    const slides = this.slideElements.toArray();
    slides.forEach(slide => {
      this.renderer.setStyle(slide.nativeElement, 'will-change', 'transform, width, height');
    });

    // Обработчики для мыши через Renderer2
    this.eventListeners.push(
      this.renderer.listen(sliderElement, 'mousedown', (event: MouseEvent) => this.onDragStart(event))
    );
    this.eventListeners.push(
      this.renderer.listen(document, 'mousemove', (event: MouseEvent) => this.onDragMove(event))
    );
    this.eventListeners.push(
      this.renderer.listen(window, 'mouseup', (event: MouseEvent) => this.onDragEnd(event))
    );
    this.eventListeners.push(
      this.renderer.listen(sliderElement, 'mouseleave', () => this.onDragEnd(null))
    );

    // Обработчики для тач-устройств через нативный addEventListener
    const onTouchStart = (event: TouchEvent) => this.onDragStart(event);
    const onTouchMove = (event: TouchEvent) => this.onDragMove(event);
    const onTouchEnd = (event: TouchEvent) => this.onDragEnd(event);
    const onTouchCancel = () => this.onDragEnd(null);

    sliderElement.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchCancel);

    // Сохраняем функции удаления слушателей
    this.eventListeners.push(() => sliderElement.removeEventListener('touchstart', onTouchStart));
    this.eventListeners.push(() => document.removeEventListener('touchmove', onTouchMove));
    this.eventListeners.push(() => window.removeEventListener('touchend', onTouchEnd));
    this.eventListeners.push(() => document.removeEventListener('touchcancel', onTouchCancel));
  }

  // Начало драга
  private onDragStart(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.initialRotationAngle = this.rotationAngle;
    this.dragDistance = 0;

    // Отключаем переходы во время драга для плавного движения
    this.updateSlidePosition(false);

    // Предотвращаем стандартное поведение только для мыши
    if (event instanceof MouseEvent) {
      event.preventDefault();
    }
  }

  // Движение во время драга
  private onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const currentX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.dragDistance = currentX - this.startX;

    // Вычисляем изменение угла с меньшей чувствительностью
    const angleChange = (this.dragDistance / window.innerWidth) * this.dragSensitivity * 180;
    this.rotationAngle = this.initialRotationAngle - angleChange;

    // Обновляем позиции слайдов без переходов
    this.updateSlidePosition(false);

    // Предотвращаем стандартное поведение (например, скролл на тач-устройствах)
    event.preventDefault();
  }

  // Окончание драга
  private onDragEnd(event: MouseEvent | TouchEvent | null) {
    if (!this.isDragging) return;

    // Гарантированно сбрасываем состояние драга
    this.isDragging = false;

    // Если перемещение меньше порога, считаем это кликом
    if (Math.abs(this.dragDistance) < this.dragThreshold) {
      return;
    }

    // Вычисляем ближайший индекс слайда на основе текущего rotationAngle
    const closestIndex = Math.round(this.rotationAngle / this.arcAngle);
    // Ограничиваем centralSlideIndex в пределах [0, slides.length - 1]
    this.centralSlideIndex = Math.max(0, Math.min(closestIndex, this.slides.length - 1));
    // Устанавливаем rotationAngle для ближайшего слайда
    this.rotationAngle = this.arcAngle * this.centralSlideIndex;
    // Обновляем позиции слайдов с переходом
    this.updateSlidePosition(true);
    // Обновляем класс active
    // this.updateActiveSlide();
  }

  // Обработчик клика на слайд
  clickSlide(index: number) {
    // Если есть активный слайд, возвращаем его в исходное положение
    if (this.activeSlideIndex !== null && this.activeSlideIndex !== index) {
      this.resetSlideToInitialState(this.activeSlideIndex);
    }
    // Устанавливаем centralSlideIndex на индекс кликнутого слайда
    this.centralSlideIndex = index;
    // Обновляем rotationAngle, чтобы кликнутый слайд оказался в центре (угол 0°)
    this.rotationAngle = this.arcAngle * this.centralSlideIndex;
    // Обновляем позиции слайдов с анимацией
    this.updateSlidePosition(true);
    // Обновляем класс active
    this.updateActiveSlide();
    // Ждём 1 секунду, чтобы прокрутка завершилась
    setTimeout(() => {
      // Запускаем анимацию смещения
      this.animateSlideToRightCenter(index);
      // Обновляем activeSlideIndex
      this.activeSlideIndex = index;
    }, 1000);
  }

  // Метод для возврата слайда в исходное положение
  private resetSlideToInitialState(index: number) {
    const slide = this.slideElements.toArray()[index];
    if (!slide) return;

    const angle = this.angles[index] || 0;
    this.renderer.setStyle(slide.nativeElement, 'transform', `rotate(${angle}deg)`);
    this.renderer.setStyle(slide.nativeElement, 'width', this.baseSlideWidth);
    this.renderer.setStyle(slide.nativeElement, 'height', this.baseSlideHeight);
    this.renderer.setStyle(slide.nativeElement, 'transition', 'transform 0.5s ease, width 0.5s ease, height 0.5s ease');
  }

  // Метод для возврата активного слайда в исходное положение (для кнопки "назад")
  resetActiveSlide() {
    if (this.activeSlideIndex !== null) {
      const activeSlide = this.slideElements.toArray()[this.activeSlideIndex];
      if (activeSlide) {
        // Удаляем класс active с текущего слайда
        this.renderer.removeClass(activeSlide.nativeElement, 'active');
      }

      this.resetSlideToInitialState(this.activeSlideIndex);
      this.activeSlideIndex = null; // Сбрасываем активный слайд
      // Убираем класс visible с slide-info
      if (this.slideInfo) {
        this.renderer.removeClass(this.slideInfo.nativeElement, 'visible');
      }
    }
  }

  // Метод для обновления класса active
  private updateActiveSlide() {
    const slides = this.slideElements.toArray();

    slides.forEach((slide, index) => {
      if (index === this.centralSlideIndex) {
        // Добавляем класс active текущему центральному слайду
        this.renderer.addClass(slide.nativeElement, 'active');
        // Добавляем класс visible к slide-info
        if (this.slideInfo) {
          this.renderer.addClass(this.slideInfo.nativeElement, 'visible');
        }
      } else {
        // Удаляем класс active с остальных слайдов
        this.renderer.removeClass(slide.nativeElement, 'active');
      }
    });
  }

  // Метод для анимации смещения слайда к центру правой области
  private animateSlideToRightCenter(index: number) {
    const slide = this.slideElements.toArray()[index];
    if (!slide) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // Адаптивные размеры для активного слайда
    const activeSlideWidth = viewportWidth < 1024 ? viewportWidth * 1.0 : viewportWidth * 0.5; // 100% ширины на мобильных, 50% на десктопе
    const activeSlideHeight = viewportWidth < 1024 ? viewportHeight / 3 : viewportHeight; // 1/3 высоты на мобильных, 100% на десктопе

    const translateX = viewportWidth < 1024 ? 0 : viewportWidth * 0.25; // Без смещения вправо на мобильных
    const translateY = viewportWidth < 1024 ? -(viewportHeight / 3) + 4 : 4; // Смещение к самому верху на мобильных

    const currentAngle = this.angles[index] || 0;
    this.renderer.setStyle(
      slide.nativeElement,
      'transform',
      `rotate(${currentAngle}deg) translate(${translateX}px, ${translateY}px)`
    );

    this.renderer.setStyle(
      slide.nativeElement,
      'transition',
      'transform 0.5s ease, width 0.5s ease, height 0.5s ease'
    );

    setTimeout(() => {
      this.renderer.setStyle(slide.nativeElement, 'width', `${activeSlideWidth}px`);
      this.renderer.setStyle(slide.nativeElement, 'height', `${activeSlideHeight}px`);

      this.renderer.setStyle(
        slide.nativeElement,
        'transform',
        `rotate(${currentAngle}deg) translate(${translateX}px, ${translateY}px)`
      );
    }, 500);
  }

  prevSlide() {
    // Уменьшаем индекс, но не даём ему стать меньше 0
    if (this.centralSlideIndex > 0) {
      this.centralSlideIndex--;
      this.rotationAngle = this.arcAngle * this.centralSlideIndex;
      this.updateSlidePosition(true);
      // this.updateActiveSlide();
    }
  }

  nextSlide() {
    // Увеличиваем индекс, но не даём ему превысить slides.length - 1
    if (this.centralSlideIndex < this.slides.length - 1) {
      this.centralSlideIndex++;
      this.rotationAngle = this.arcAngle * this.centralSlideIndex;
      this.updateSlidePosition(true);
      // this.updateActiveSlide();
    }
  }
}