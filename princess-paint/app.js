// Initialize variables
let currentColor = '#FF0000'; // Default to red
let drawing = null;
let selectedElement = null;
let cursorFill = null;
let cursorColorIndicator = null;

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
            
            // Calculate the SVG's bounding box
            const bbox = svg.getBBox();
            const svgWidth = bbox.width;
            const svgHeight = bbox.height;
            
            // Calculate scaling factors to fit SVG while maintaining aspect ratio
            const scaleX = containerWidth / svgWidth;
            const scaleY = containerHeight / svgHeight;
            const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to add some padding
            
            // Calculate translation to center the SVG
            const translateX = (containerWidth - svgWidth * scale) / 2;
            const translateY = (containerHeight - svgHeight * scale) / 2;
            
            // Create a group element to apply transformations
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
            
            // Move all SVG content into the group
            while (svg.firstChild) {
                g.appendChild(svg.firstChild);
            }
            
            // Set SVG dimensions to match container
            svg.setAttribute('width', containerWidth);
            svg.setAttribute('height', containerHeight);
            
            // Append the group to the SVG
            svg.appendChild(g);
            
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
    // Update the fill cursor
    if (!cursorFill) {
        cursorFill = document.createElement('div');
        cursorFill.className = 'cursor-fill';
        document.body.appendChild(cursorFill);
    }
    cursorFill.style.backgroundColor = currentColor;
    cursorFill.style.left = x + 'px';
    cursorFill.style.top = y + 'px';

    // Update the color indicator
    if (!cursorColorIndicator) {
        cursorColorIndicator = document.createElement('div');
        cursorColorIndicator.className = 'cursor-color-indicator';
        document.body.appendChild(cursorColorIndicator);
    }
    cursorColorIndicator.style.backgroundColor = currentColor;
    cursorColorIndicator.style.left = (x + 20) + 'px'; // Offset to the right
    cursorColorIndicator.style.top = (y - 20) + 'px';  // Offset up
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



// Function to capture and download the canvas as an image
function captureScreenshot() {
    const canvasArea = document.querySelector('.canvas-area');
    
    html2canvas(canvasArea, {
        backgroundColor: null, // Keep transparent background
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Create a download link
        const link = document.createElement('a');
        link.download = `princess-paint-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Show notification
        const notification = document.getElementById('screenshot-notification');
        notification.style.display = 'block';
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    });
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
    
    // Add keyboard event listener for screenshots
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault(); // Prevent spacebar from scrolling the page
            captureScreenshot();
        }
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
