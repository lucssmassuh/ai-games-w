// Initialize variables
let currentColor = '#FF0000'; // Default to red
let drawing = null;
let selectedElement = null;
let cursorFill = null;

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
        img.style.width = '80px';
        img.style.height = '80px';

        item.appendChild(img);
        gallery.appendChild(item);
    });
}

// Load color buttons
function loadColors() {
    const colorGrid = document.getElementById('colorGrid');
    const colors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
        '#FF00FF', '#00FFFF', '#FFA500', '#800080',
        '#008000', '#FF69B4', '#4169E1', '#FFD700',
        '#8B4513', '#000000', '#FFFFFF'
    ];

    colors.forEach(color => {
        const button = document.createElement('button');
        button.className = 'color-button';
        button.style.backgroundColor = color;
        button.onclick = () => selectColor(color);
        colorGrid.appendChild(button);
    });
}

// Load a painting
function loadPainting(filename) {
    fetch('drawings/' + filename)
        .then(response => response.text())
        .then(data => {
            const emptyState = drawing.querySelector('.empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            // Clear the drawing area
            drawing.innerHTML = '';
            
            // Create a new SVG element
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.innerHTML = data;
            
            // Get the drawing container dimensions
            const container = drawing.parentElement;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Set SVG dimensions to match container
            svg.setAttribute('width', containerWidth);
            svg.setAttribute('height', containerHeight);
            svg.setAttribute('viewBox', '0 0 ' + containerWidth + ' ' + containerHeight);
            
            // Append the SVG to the drawing area
            drawing.appendChild(svg);
            
            // Wait for the SVG to be fully loaded
            setTimeout(() => {
                setupEventListeners();
            }, 100);
        });
}

// Select a color
function selectColor(color) {
    console.log('Color selected:', color);
    currentColor = color;
    const buttons = document.querySelectorAll('.color-button');
    buttons.forEach(button => {
        button.classList.remove('selected');
    });
    const button = event.currentTarget;
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

// Function to create and update the fill cursor
function updateFillCursor(x, y) {
}

// Function to create and update the fill cursor
function updateFillCursor(x, y) {
    if (!cursorFill) {
        cursorFill = document.createElement('div');
        cursorFill.className = 'cursor-fill';
        document.body.appendChild(cursorFill);
    }
    
    cursorFill.style.backgroundColor = currentColor;
    cursorFill.style.left = x + 'px';
    cursorFill.style.top = y + 'px';
}

// Handle mouse movement in the canvas area
function handleMouseMove(e) {
    const rect = drawing.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        updateFillCursor(e.clientX, e.clientY);
    }
}

// Create a new drawing
function createNewDrawing() {
    // Clear the drawing area
    drawing.innerHTML = '';
    
    // Create a new SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '600');
    svg.setAttribute('viewBox', '0 0 800 600');
    
    // Add a white background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', '#FFFFFF');
    svg.appendChild(rect);
    
    // Append the SVG to the drawing area
    drawing.appendChild(svg);
    
    // Set up event listeners
    setupEventListeners();
}

// Initialize the app
async function init() {
    drawing = document.getElementById('drawing');
    await loadGallery();
    loadColors();
    
    // Create a new drawing by default
    createNewDrawing();
    
    // Add mouse move event listener to the canvas area
    drawing.addEventListener('mousemove', handleMouseMove);
    
    // Add new drawing button handler
    const newDrawingBtn = document.getElementById('newDrawingBtn');
    newDrawingBtn.addEventListener('click', createNewDrawing);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
