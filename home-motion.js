(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const header = document.querySelector('header');
    const heading = header.querySelector('h1');
    const cards = [...document.querySelectorAll('.app-card')];
    let observer;

    // Keep the original heading accessible while animating individual words.
    const title = heading.textContent;
    heading.setAttribute('aria-label', title);
    heading.replaceChildren(...title.trim().split(/\s+/).flatMap((word, index) => {
        const span = document.createElement('span');
        span.className = 'motion-word';
        span.textContent = word;
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--word-index', index);
        return [span, document.createTextNode(' ')];
    }));

    const reveal = card => {
        card.classList.remove('motion-pending');
        card.classList.add('motion-enter');
        observer?.unobserve(card);
    };

    if (!preference.matches && 'IntersectionObserver' in window) {
        header.classList.add('motion-intro');
        observer = new IntersectionObserver(entries => {
            const entering = entries.filter(entry => entry.isIntersecting);
            entering.forEach((entry, index) => {
                entry.target.style.setProperty('--reveal-delay', `${index * 90}ms`);
                reveal(entry.target);
            });
        }, { threshold: .08 });
        cards.forEach(card => {
            card.classList.add('motion-pending');
            observer.observe(card);
            // Keyboard navigation reveals a card immediately, even before scrolling.
            card.addEventListener('focusin', () => {
                card.style.setProperty('--reveal-delay', '0ms');
                reveal(card);
            });
            card.addEventListener('animationend', () => card.classList.remove('motion-enter'));
        });
    }

    preference.addEventListener('change', () => {
        if (!preference.matches) return;
        observer?.disconnect();
        header.classList.remove('motion-intro');
        cards.forEach(card => card.classList.remove('motion-pending', 'motion-enter'));
    });
})();
