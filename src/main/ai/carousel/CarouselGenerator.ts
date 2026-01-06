// Carousel Generator - Generate carousel/slider components
import Anthropic from '@anthropic-ai/sdk';

class CarouselGenerator {
    private anthropic: Anthropic | null = null;

    generateSwiperCarousel(): string {
        return `import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface CarouselProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    slidesPerView?: number;
    spaceBetween?: number;
    autoplay?: boolean;
    loop?: boolean;
}

export function Carousel<T>({ items, renderItem, slidesPerView = 1, spaceBetween = 20, autoplay = false, loop = false }: CarouselProps<T>) {
    return (
        <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView={slidesPerView}
            spaceBetween={spaceBetween}
            navigation
            pagination={{ clickable: true }}
            autoplay={autoplay ? { delay: 3000, disableOnInteraction: false } : false}
            loop={loop}
            breakpoints={{
                640: { slidesPerView: Math.min(2, slidesPerView) },
                768: { slidesPerView: Math.min(3, slidesPerView) },
                1024: { slidesPerView },
            }}
        >
            {items.map((item, i) => <SwiperSlide key={i}>{renderItem(item, i)}</SwiperSlide>)}
        </Swiper>
    );
}

export function ImageGallery({ images }: { images: Array<{ src: string; alt: string }> }) {
    return (
        <Swiper modules={[Navigation, Pagination, EffectFade]} effect="fade" navigation pagination>
            {images.map((img, i) => (
                <SwiperSlide key={i}>
                    <img src={img.src} alt={img.alt} style={{ width: '100%', height: 'auto' }} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
}
`;
    }

    generateEmblaCarousel(): string {
        return `import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback } from 'react';

interface EmblaCarouselProps<T> {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    autoplay?: boolean;
}

export function EmblaCarousel<T>({ items, renderItem, autoplay = false }: EmblaCarouselProps<T>) {
    const plugins = autoplay ? [Autoplay({ delay: 3000 })] : [];
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, plugins);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    return (
        <div className="embla">
            <div className="embla__viewport" ref={emblaRef}>
                <div className="embla__container">
                    {items.map((item, i) => (
                        <div className="embla__slide" key={i}>{renderItem(item)}</div>
                    ))}
                </div>
            </div>
            <button className="embla__prev" onClick={scrollPrev}>←</button>
            <button className="embla__next" onClick={scrollNext}>→</button>
        </div>
    );
}

export const emblaStyles = \`
.embla { position: relative; overflow: hidden; }
.embla__viewport { overflow: hidden; }
.embla__container { display: flex; }
.embla__slide { flex: 0 0 100%; min-width: 0; }
.embla__prev, .embla__next { position: absolute; top: 50%; transform: translateY(-50%); z-index: 1; background: white; border: 1px solid #ddd; padding: 8px 12px; cursor: pointer; }
.embla__prev { left: 10px; }
.embla__next { right: 10px; }
\`;
`;
    }

    generateCustomCarousel(): string {
        return `import { useState, useEffect, useCallback, useRef } from 'react';
import './Carousel.css';

interface CarouselProps {
    children: React.ReactNode[];
    autoPlay?: boolean;
    interval?: number;
    showDots?: boolean;
    showArrows?: boolean;
}

export function CustomCarousel({ children, autoPlay = false, interval = 3000, showDots = true, showArrows = true }: CarouselProps) {
    const [current, setCurrent] = useState(0);
    const timerRef = useRef<NodeJS.Timeout>();

    const goTo = useCallback((index: number) => {
        setCurrent((index + children.length) % children.length);
    }, [children.length]);

    const next = useCallback(() => goTo(current + 1), [current, goTo]);
    const prev = useCallback(() => goTo(current - 1), [current, goTo]);

    useEffect(() => {
        if (autoPlay) {
            timerRef.current = setInterval(next, interval);
            return () => clearInterval(timerRef.current);
        }
    }, [autoPlay, interval, next]);

    return (
        <div className="custom-carousel">
            <div className="carousel-track" style={{ transform: \`translateX(-\${current * 100}%)\` }}>
                {children.map((child, i) => <div key={i} className="carousel-slide">{child}</div>)}
            </div>
            {showArrows && (
                <>
                    <button className="carousel-arrow prev" onClick={prev}>←</button>
                    <button className="carousel-arrow next" onClick={next}>→</button>
                </>
            )}
            {showDots && (
                <div className="carousel-dots">
                    {children.map((_, i) => (
                        <button key={i} className={\`dot \${i === current ? 'active' : ''}\`} onClick={() => goTo(i)} />
                    ))}
                </div>
            )}
        </div>
    );
}
`;
    }

    generateCarouselCSS(): string {
        return `.custom-carousel { position: relative; overflow: hidden; border-radius: 8px; }
.carousel-track { display: flex; transition: transform 0.5s ease; }
.carousel-slide { flex: 0 0 100%; }
.carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.9); border: none; padding: 12px 16px; cursor: pointer; font-size: 18px; z-index: 1; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.carousel-arrow:hover { background: white; }
.carousel-arrow.prev { left: 16px; }
.carousel-arrow.next { right: 16px; }
.carousel-dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); border: none; cursor: pointer; }
.dot.active { background: white; }
`;
    }
}

export const carouselGenerator = new CarouselGenerator();
