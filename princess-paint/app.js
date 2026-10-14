// Initialize variables
let currentColor = '#FF0000'; // Default to red
let drawing = null;
let selectedElement = null;

// Function to load paintings from drawings folder
async function loadPaintings() {
    try {
        // Get all SVG files in the drawings directory
        const files = [];
        const directory = 'drawings/';
        
        // Manually list the SVG files since we can't use directory listing
        const svgFiles = [
            'girl-svgrepo-com(1).svg', 'girl-svgrepo-com(2).svg', 'girl-svgrepo-com(3).svg',
            'girl-svgrepo-com(4).svg', 'girl-svgrepo-com(5).svg', 'girl-svgrepo-com(6).svg',
            'girl-svgrepo-com(7).svg', 'girl-svgrepo-com(8).svg', 'girl-svgrepo-com(9).svg',
            'girl-svgrepo-com(10).svg', 'girl-svgrepo-com(11).svg', 'girl-svgrepo-com(12).svg',
            'girl-svgrepo-com(13).svg', 'girl-svgrepo-com(14).svg', 'girl-svgrepo-com(15).svg',
            'girl-svgrepo-com(16).svg', 'girl-svgrepo-com(17).svg', 'girl-svgrepo-com(18).svg',
            'girl-svgrepo-com(19).svg', 'girl-svgrepo-com(20).svg', 'girl-svgrepo-com(21).svg',
            'girl-svgrepo-com(22).svg', 'girl-svgrepo-com(23).svg', 'girl-svgrepo-com(24).svg',
            'girl-svgrepo-com(25).svg', 'girl-svgrepo-com(26).svg', 'girl-svgrepo-com(27).svg',
            'girl-svgrepo-com(28).svg'
        ];

        return svgFiles;
    } catch (error) {
        console.error('Error loading paintings:', error);
        return [];
    }
}

// Load paintings into the gallery
async function loadGallery() {
    const gallery = document.getElementById('galleryGrid');
    const paintings = await loadPaintings();
    
    paintings.forEach(painting => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => loadPainting(painting);

        const img = document.createElement('img');
        img.src = 'drawings/' + painting;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';

        item.appendChild(img);
        gallery.appendChild(item);
    });
}

// Load color buttons
function loadColors() {
    const colorGrid = document.getElementById('colorGrid');
    const colors = [
        // Reds
        '#FF0000', '#FF4500', '#FF69B4', '#FF1493', '#DB7093',
        // Oranges
        '#FFA500', '#FF8C00', '#FF6347', '#FFD700', '#FFA07A',
        // Yellows
        '#FFFF00', '#FFD700', '#FFEC8B', '#FFDAB9', '#FFFACD',
        // Greens
        '#00FF00', '#008000', '#32CD32', '#98FB98', '#90EE90',
        // Blues
        '#0000FF', '#00BFFF', '#4169E1', '#6495ED', '#87CEEB',
        // Purples
        '#800080', '#9400D3', '#BA55D3', '#9370DB', '#E6E6FA',
        // Pinks
        '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FFE4E1',
        // Browns
        '#8B4513', '#A0522D', '#D2691E', '#8B0000', '#CD5C5C',
        // Grays
        '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F0F0F0',
        // Black and White
        '#000000', '#FFFFFF'
    ];

    colors.forEach(color => {
        const button = document.createElement('button');
        button.className = 'color-button';
        button.style.backgroundColor = color;
        button.onclick = (event) => selectColor(color, event.currentTarget);
        colorGrid.appendChild(button);
    });
}

// Load a painting
async function loadPainting(filename) {
    const button = document.getElementById('photo-button');
    button.disabled = true;
    try {
        const response = await fetch('drawings/' + filename);
        if (!response.ok) throw new Error('Could not load drawing');
        const xml = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
        if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'svg') {
            throw new Error('Invalid SVG drawing');
        }
        const svg = document.importNode(xml.documentElement, true);
        if (!svg.hasAttribute('viewBox')) {
            const width = parseFloat(svg.getAttribute('width')) || 800;
            const height = parseFloat(svg.getAttribute('height')) || 600;
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        drawing.replaceChildren(svg);
        setupEventListeners();
        button.disabled = false;
    } catch (error) {
        console.error(error);
        showPhotoNotice('Could not load the drawing. Please choose one again.');
    }
}

// Select a color
function selectColor(color, button) {
    console.log('Color selected:', color);
    currentColor = color;
    updateBrushCursor();
    const buttons = document.querySelectorAll('.color-button');
    buttons.forEach(button => {
        button.classList.remove('selected');
    });
    button.classList.add('selected');
}

// Set up event listeners for the drawing
function setupEventListeners() {
    // Find all SVG elements in the drawing area
    const svg = drawing.querySelector('svg');
    if (!svg) return;

    // Add click event listener to the entire SVG
    svg.addEventListener('click', (e) => {
        // Get the target element that was clicked
        const target = e.target;
        
        // If the target is a path or circle, change its color
        if (target.tagName === 'path' || target.tagName === 'circle') {
            console.log('Clicked on:', target.tagName);
            console.log('Current color:', currentColor);
            
            // Change the fill color
            target.style.fill = currentColor;
            selectedElement = target;
        }
    });
}

// A native cursor keeps the paint tip at the actual click position, even
// while scrolling, without floating elements or coordinate offsets.
function updateBrushCursor() {
    const brush = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <path d="M13 18 25 3Q28 0 30 3Q32 5 29 8L17 21Z" fill="#92552c" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
        <path d="m11 19 4-5 6 5-5 4Z" fill="#dae2ee" stroke="#25314b" stroke-width="1.2"/>
        <path d="M13 20Q5 19 4 26L2 29Q10 31 15 25L16 23Z" fill="${currentColor}" stroke="#25314b" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="m6 25 4-2" stroke="#fff" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round"/>
    </svg>`;
    drawing.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(brush)}") 2 29, crosshair`;
}

let photoNoticeTimer;
function showPhotoNotice(message) {
    const notification = document.getElementById('screenshot-notification');
    notification.textContent = message;
    notification.style.display = 'block';
    clearTimeout(photoNoticeTimer);
    photoNoticeTimer = setTimeout(() => { notification.style.display = 'none'; }, 5000);
}

// Rasterize the current SVG, including painted fills, into a shareable PNG tab.
async function captureScreenshot() {
    const button = document.getElementById('photo-button');
    const svg = drawing.querySelector('svg');
    if (!svg || button.disabled) return;
    // Open during the click, before awaiting image conversion, to avoid popup blocking.
    const photoTab = window.open('about:blank', '_blank');
    if (!photoTab) {
        showPhotoNotice('Please allow new tabs for this site, then tap Photo again.');
        return;
    }
    photoTab.opener = null;
    photoTab.document.title = 'Your Princess Paint Photo';
    photoTab.document.body.textContent = 'Preparing your photo…';
    button.disabled = true;
    button.textContent = '📷 Preparing…';
    let sourceUrl;
    try {
        const copy = svg.cloneNode(true);
        const viewBox = svg.viewBox.baseVal;
        const ratio = viewBox.width / viewBox.height;
        // Export at a consistent resolution independent of screen size.
        const width = ratio >= 1 ? 1600 : Math.round(1600 * ratio);
        const height = ratio >= 1 ? Math.round(1600 / ratio) : 1600;
        copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        copy.setAttribute('width', width);
        copy.setAttribute('height', height);
        sourceUrl = URL.createObjectURL(new Blob(
            [new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' }
        ));
        const image = new Image();
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error('Could not create photo'));
            image.src = sourceUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        const blob = await new Promise((resolve, reject) => canvas.toBlob(
            result => result ? resolve(result) : reject(new Error('Could not save photo')), 'image/png'
        ));
        if (photoTab.closed) return;
        const photoUrl = URL.createObjectURL(blob);
        photoTab.location.replace(photoUrl);
        // Keep the image available for saving until its tab is closed.
        const cleanup = setInterval(() => {
            if (photoTab.closed) {
                URL.revokeObjectURL(photoUrl);
                clearInterval(cleanup);
            }
        }, 10000);
        showPhotoNotice('Your photo is open in a new tab. Save or share the image from there.');
    } catch (error) {
        console.error(error);
        if (!photoTab.closed) photoTab.close();
        showPhotoNotice('Could not open your photo. Please try again.');
    } finally {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        button.disabled = false;
        button.textContent = '📷 Photo';
    }
}

// Initialize the app
async function init() {
    drawing = document.getElementById('drawing');
    await loadGallery();
    loadColors();
    
    // Create a new drawing by default
    await loadPainting('girl-svgrepo-com(1).svg');
    document.getElementById('photo-button').addEventListener('click', captureScreenshot);
    
    updateBrushCursor();
    
    // Add keyboard event listener for screenshots
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && event.target === document.body && !event.repeat) {
            event.preventDefault(); // Prevent spacebar from scrolling the page
            captureScreenshot();
        }
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
