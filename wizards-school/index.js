import { fingerposeCombinations } from './fingerpose_combinations.js';

const config = {
  video: { width: 640, height: 480, fps: 30 },
};
  let videoWidth, videoHeight, drawingContext, canvas, gestureEstimator;
  
// Gesture and spell tracking
let lastGesture = null;
let gestureStartTime = 0;
const GESTURE_STABILITY_THRESHOLD = 300; // 500ms stability required
let gestureHistory = [];
const MAX_GESTURE_HISTORY = 10; // Maximum number of gestures to keep in history
let lastSpellDisplayTime = 0;
const SPELL_DISPLAY_DURATION = 3000; // 3 seconds to display spell name

// Initialize spells as an empty array that will be populated later
let spells = [];
let model;
// particles for fairy-dust effect
let particles = [];
  
  const gestureStrings = {
    point_up:           '⬆️',
    point_down:         '⬇️',
    point_right:        '⬅️',
    point_left:        '➡️',
    point_top_right:     '↖️',
    point_top_left:    '↗️',
    point_bottom_right:  '↙️',
    point_bottom_left: '↘️',
  };
  
  const fingerLookupIndices = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
  };
  
  const landmarkColors = {
    thumb: '#8B4513',
    indexFinger: '#8B4513',
    middleFinger: '#8B4513',
    ringFinger: '#8B4513',
    pinky: '#8B4513',
    palmBase: '#8B4513',
  };

  function createPointUpGesture() {
    const pointUp = new fp.GestureDescription('point_up');
    pointUp.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 0.8);
    return pointUp;
  }

  function createPointDownGesture() {
    const pointDown = new fp.GestureDescription('point_down');
    pointDown.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalDown, 0.8);
    return pointDown;
  }

function createPointLeftGesture() {
  const pointLeft = new fp.GestureDescription('point_left');
  pointLeft.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft, 0.8);
  return pointLeft;
}

function createPointRightGesture() {
  const pointRight = new fp.GestureDescription('point_right');
  pointRight.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 0.8);
  return pointRight;
}

function createPointTopLeftGesture() {
  const pointTopLeft = new fp.GestureDescription('point_top_left');
  pointTopLeft.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.8);
  return pointTopLeft;
}

function createPointTopRightGesture() {
  const pointTopRight = new fp.GestureDescription('point_top_right');
  pointTopRight.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 0.8);
  return pointTopRight;
}

function createPointBottomLeftGesture() {
  const pointBottomLeft = new fp.GestureDescription('point_bottom_left');
  pointBottomLeft.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownLeft, 0.8);
  return pointBottomLeft;
}

function createPointBottomRightGesture() {
  const pointBottomRight = new fp.GestureDescription('point_bottom_right');
  pointBottomRight.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownRight, 0.8);
  return pointBottomRight;
}

  function drawKeypoints(keypoints) {
    // Get only the first (knuckle) and last (nail) points of the index finger
    const indices = [
      fingerLookupIndices.indexFinger[0],  // Knuckle
      fingerLookupIndices.indexFinger[3]   // Nail
    ];
    
    // Draw only the line from knuckle to nail
    const points = indices.map(idx => keypoints[idx]);
    drawPath(points, false, landmarkColors.indexFinger);
  }
  
  function drawPoint(y, x, r) {
    drawingContext.beginPath();
    drawingContext.arc(x, y, r * 2, 0, 2 * Math.PI); // Make points larger
    drawingContext.fillStyle = '#8B4513'; // Brown color
    drawingContext.fill();
  }
  
  function drawPath(points, closePath, color) {
    drawingContext.strokeStyle = '#8B4513'; // Brown color
    drawingContext.lineWidth = 8; // Make the line thicker
    drawingContext.lineCap = 'round'; // Make the line ends rounded
    drawingContext.lineJoin = 'round'; // Make the line joins rounded
    
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }
  
    if (closePath) {
      region.closePath();
    }
    drawingContext.stroke(region);
    drawingContext.lineWidth = 1; // Reset line width to default
  }
  
  async function loadWebcam(width, height, fps) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia is not available'
      );
    }
  
    let video = document.getElementById('webcam');
    video.muted = true;
    video.width = width;
    video.height = height;
  
    const mediaConfig = {
      audio: false,
      video: {
        facingMode: 'user',
        width: width,
        height: height,
        frameRate: { max: fps },
      },
    };
  
    const stream = await navigator.mediaDevices.getUserMedia(mediaConfig);
    video.srcObject = stream;
  
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }
  
  async function loadVideo() {
    const video = await loadWebcam(
      config.video.width,
      config.video.height,
      config.video.fps
    );
    video.play();
    return video;
  }
  async function continuouslyDetectLandmarks(video) {
  async function runDetection() {
      drawingContext.drawImage(
        video,
        0,
        0,
        videoWidth,
        videoHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
  
      // Draw hand landmarks
      const predictions = await model.estimateHands(video);
      if (predictions.length > 0) {
        const result = predictions[0].landmarks;
        drawKeypoints(result);
        // spawn fairy-dust at the index fingertip
        const tipIndex = fingerLookupIndices.indexFinger[4];
        const [tx, ty] = result[tipIndex];
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: tx, y: ty,
            vx: (Math.random() - 0.5) * 1.5,  // Reduced horizontal spread
            vy: Math.random() * 1 + 0.5,      // Always positive to make particles fall
            gravity: 0.1,                     // Gravity effect
            size: Math.random() * 4 + 3,  // Slightly larger stars
            hue: Math.random() * 60 + 30,  // Yellowish hue by default
            alpha: 1
          });
        }
      }
  
      let poseData = null;
      if (
        predictions.length > 0 &&
        Object.keys(predictions[0]).includes('landmarks')
      ) {
        // Lower the minimum confidence threshold to catch direction-only gestures
        const est = gestureEstimator.estimate(predictions[0].landmarks, 7);
        poseData = est.poseData;
        let currentGesture = null;
        if (est.gestures.length > 0) {
          const best = est.gestures.reduce((p, c) => (p.score > c.score ? p : c));
          if (best.score > 7.0) {
            const currentTime = Date.now();
            
            // If this is a new gesture, or the gesture has changed, reset the timer
            if (best.name !== lastGesture) {
              lastGesture = best.name;
              gestureStartTime = currentTime;
            }
            
            // Only update the UI if the gesture has been stable for the threshold duration
            if (currentTime - gestureStartTime >= GESTURE_STABILITY_THRESHOLD) {
              const gestureDisplay = gestureStrings[best.name] || best.name;
              document.getElementById('gesture-text').textContent = gestureDisplay;
              
              // Add to gesture history if it's different from the last one
              if (gestureHistory[gestureHistory.length - 1] !== best.name) {
                gestureHistory.push(best.name);
                // Keep only the last MAX_GESTURE_HISTORY gestures
                if (gestureHistory.length > MAX_GESTURE_HISTORY) {
                  gestureHistory.shift();
                }
                checkForSpellMatch();
              }
            }
          }
        }
      }
      // update and draw fairy-dust particles
      particles = particles.filter(p => p.alpha > 0);
      function drawStar(x, y, size, points, innerRadius, outerRadius, rotation = 0) {
        const rot = Math.PI / 2 * 3;
        const step = Math.PI / points;
        
        drawingContext.beginPath();
        drawingContext.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < points; i++) {
          // Outer point
          const outerX = x + Math.cos(rot + (i * 2 * step)) * outerRadius;
          const outerY = y + Math.sin(rot + (i * 2 * step)) * outerRadius;
          drawingContext.lineTo(outerX, outerY);
          
          // Inner point
          const innerX = x + Math.cos(rot + ((i * 2 + 1) * step)) * innerRadius;
          const innerY = y + Math.sin(rot + ((i * 2 + 1) * step)) * innerRadius;
          drawingContext.lineTo(innerX, innerY);
        }
        drawingContext.closePath();
        drawingContext.fill();
      }

      for (let p of particles) {
        if (!p.rotation) p.rotation = 0;
        if (!p.twinkle) p.twinkle = 0.5 + Math.random() * 0.5;
        
        drawingContext.save();
        drawingContext.globalAlpha = p.alpha * p.twinkle;  // Add twinkling effect
        drawingContext.fillStyle = `hsl(${p.hue || 60}, 100%, 80%)`;  // Yellowish color for stars
        
        // Draw star with 5 points
        const starSize = p.size * 0.8;
        drawStar(p.x, p.y, 5, 5, starSize * 0.4, starSize, p.rotation);
        
        // Update particle properties
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.alpha -= 0.008;  // Slower fade out for stars
        p.rotation += 0.05;  // Gentle rotation
        p.twinkle = 0.5 + Math.sin(Date.now() * 0.01 * (0.5 + Math.random())) * 0.5;  // Twinkle effect
        
        // Occasionally change color for some stars
        if (Math.random() < 0.01) {
          p.hue = Math.random() * 360;
        }
        
        drawingContext.restore();
      }
      drawingContext.globalAlpha = 1;
      buildProbabilityTable(poseData);

      requestAnimationFrame(runDetection);
    }
  
  // Load spells from JSON
fetch('spells.json')
  .then(response => response.json())
  .then(data => {
    spells = data.spells || [];
    console.log('Loaded spells:', spells);
  })
  .catch(error => console.error('Error loading spells:', error));

  // Initialize gesture detection
  const knownGestures = [
    createPointUpGesture(),
    createPointDownGesture(),
    createPointLeftGesture(),
    createPointRightGesture(),
    createPointTopLeftGesture(),
    createPointTopRightGesture(),
    createPointBottomLeftGesture(),
    createPointBottomRightGesture()
  ];
  
    gestureEstimator = new fp.GestureEstimator(knownGestures);
  
    model = await handpose.load();
    runDetection();
  }
  
  async function main() {
    let video = await loadVideo();
  
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;
  
    canvas = document.getElementById('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  
    drawingContext = canvas.getContext('2d');
    drawingContext.clearRect(0, 0, videoWidth, videoHeight);
  
    drawingContext.fillStyle = 'white';
    drawingContext.translate(canvas.width, 0);
    drawingContext.scale(-1, 1);
  
    continuouslyDetectLandmarks(video);
  }
  
/**
 * Checks if the current gesture history matches any spell's gesture sequence
 */
function checkForSpellMatch() {
  // Don't do anything if spells haven't loaded yet
  if (!spells || !Array.isArray(spells)) {
    return;
  }
  
  const currentTime = Date.now();
  
  // Don't show a new spell if one was recently displayed
  if (currentTime - lastSpellDisplayTime < SPELL_DISPLAY_DURATION) {
    return;
  }
  
  const spellOverlay = document.getElementById('spell-overlay');
  if (!spellOverlay) return;
  
  // Check each spell for a match
  for (const spell of spells) {
    const spellGestures = spell.gestures || [];
    
    // Check if the end of gestureHistory matches the spell's gesture sequence
    if (gestureHistory.length >= spellGestures.length) {
      const recentGestures = gestureHistory.slice(-spellGestures.length);
      
      if (arraysEqual(recentGestures, spellGestures)) {
        // Match found!
        const spellNameEl = spellOverlay.querySelector('.spell-name');
        const spellDescEl = spellOverlay.querySelector('.spell-description');
        
        // Update the spell name and description
        spellNameEl.textContent = spell.name;
        spellDescEl.textContent = spell.description || ''; // Show empty string if no description
        
        spellOverlay.classList.add('visible');
        lastSpellDisplayTime = currentTime;
        
        // Hide the overlay after the display duration
        setTimeout(() => {
          if (spellNameEl.textContent === spell.name) {  // Make sure we're not hiding a newer spell
            spellOverlay.classList.remove('visible');
          }
        }, SPELL_DISPLAY_DURATION);
        
        // Clear the gesture history after a successful match
        gestureHistory = [];
        break;
      }
    }
  }
}

/**
 * Helper function to compare two arrays for equality
 */
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

main();

function buildProbabilityTable(poseData) {
  const { directionStates, combinations } = fingerposeCombinations;
  const fingersToShow = ['Index'];
  const container = document.getElementById('probabilities-table');
  if (!container) return;

  const predictedCurls = {};
  const predictedDirections = {};
  if (poseData) {
    poseData.forEach(([fingerName, curlName, directionName]) => {
      predictedCurls[fingerName] = curlName.replace(/\s/g, '');
      const d = directionName.replace(/\s/g, '');
      predictedDirections[fingerName] =
        d === 'HorizontalLeft' ? 'HorizontalRight' :
        d === 'HorizontalRight' ? 'HorizontalLeft' :
        d === 'DiagonalUpLeft' ? 'DiagonalUpRight' :
        d === 'DiagonalUpRight' ? 'DiagonalUpLeft' :
        d === 'DiagonalDownLeft' ? 'DiagonalDownRight' :
        d === 'DiagonalDownRight' ? 'DiagonalDownLeft' :
        d;
    });
  }

  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th>Direction</th>${fingersToShow
    .map((f) => `<th>${f}</th>`)
    .join('')}`;
  table.appendChild(headerRow);

  const emojis = ['👆', '👇', '👈', '👉', '↗️', '↖️', '↘️', '↙️'];
  directionStates.forEach((dir, idx) => {
    const row = document.createElement('tr');
    const labelCell = document.createElement('td');
    labelCell.textContent = `${idx} ${dir.replace(/([A-Z])/g, ' $1').trim()} ${emojis[idx] || ''}`;
    row.appendChild(labelCell);

    fingersToShow.forEach((finger) => {
      let cellText = '-';
      if (!poseData) {
        const combo = combinations.find(
          (c) => c.finger === finger && c.direction === dir
        );
        if (combo) cellText = combo.probability.toFixed(2);
      } else if (dir === predictedDirections[finger]) {
        const combo = combinations.find(
          (c) =>
            c.finger === finger &&
            c.direction === dir &&
            c.curl === predictedCurls[finger]
        );
        if (combo) cellText = combo.probability.toFixed(2);
      }
      const cell = document.createElement('td');
      cell.textContent = cellText;
      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(table);
}

buildProbabilityTable();