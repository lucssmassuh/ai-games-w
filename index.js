const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(__dirname, url);

    // Serve the catalog page as root
    if (url === '/index.html') {
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('Page not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else {
        // Handle app directories
        const appPath = path.join(__dirname, url);
        fs.readFile(appPath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('Page not found');
                return;
            }
            const contentType = getContentType(url);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    }
});

// Helper function to get content type
function getContentType(url) {
    const ext = path.extname(url).toLowerCase();
    switch (ext) {
        case '.html': return 'text/html';
        case '.js': return 'text/javascript';
        case '.css': return 'text/css';
        case '.png': return 'image/png';
        case '.jpg': return 'image/jpeg';
        case '.svg': return 'image/svg+xml';
        default: return 'text/plain';
    }
}

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
