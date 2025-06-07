// Constants (speed of light is assumed to be 1 for calculations of v/c)
const C = 1; // Representing speed of light as 1 for fractional velocity calculations

/**
 * Calculates the Lorentz factor (gamma).
 * @param {number} v The velocity as a fraction of the speed of light (v/c).
 * @returns {number} The Lorentz factor. Returns Infinity if v >= C.
 */
function calculateLorentzFactor(v) {
    if (v < 0) return 1; // Velocity cannot be negative in this context
    if (v >= C) return Infinity; // Approaching or reaching light speed
    return 1 / Math.sqrt(1 - (v * v));
}

// --- Time Dilation Logic ---
const velocityTimeInput = document.getElementById('velocity-time');
const velocityTimeDisplay = document.getElementById('velocity-time-display');
const stationaryTimeDisplay = document.getElementById('stationary-time');
const movingTimeDisplay = document.getElementById('moving-time');
const lorentzFactorTimeDisplay = document.getElementById('lorentz-factor-time');

let stationaryTime = 0;
let movingTime = 0;
let animationFrameId; // To manage the animation loop for time dilation

/**
 * Updates the clocks based on the current velocity for time dilation.
 * Uses requestAnimationFrame for a smooth animation loop.
 */
function updateTimeDilationClocks() {
    const v = parseFloat(velocityTimeInput.value);
    const gamma = calculateLorentzFactor(v);

    velocityTimeDisplay.textContent = `${v.toFixed(3)}c`;
    lorentzFactorTimeDisplay.textContent = gamma.toFixed(2);

    // Increment time based on real-time progression
    // Use a small fixed time step for smooth visual updates, linked to actual time passed
    // This simulation makes 1 game second roughly 1 real second for stationary clock
    const deltaTime = 0.05; // Time step in "stationary observer" seconds
    stationaryTime += deltaTime;
    // Moving clock time = Stationary time / gamma
    movingTime += deltaTime / gamma;

    stationaryTimeDisplay.textContent = stationaryTime.toFixed(2);
    movingTimeDisplay.textContent = movingTime.toFixed(2);

    // Request the next animation frame
    animationFrameId = requestAnimationFrame(updateTimeDilationClocks);
}

// Event listener for time dilation slider
velocityTimeInput.addEventListener('input', () => {
    // Reset clocks when velocity changes to see the effect from start
    stationaryTime = 0;
    movingTime = 0;
    // Cancel any existing animation frame to restart smoothly
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // Start a new animation loop
    updateTimeDilationClocks();
});

// Initialize time dilation animation when the page loads
updateTimeDilationClocks();


// --- Length Contraction Logic ---
const velocityLengthInput = document.getElementById('velocity-length');
const velocityLengthDisplay = document.getElementById('velocity-length-display');
const contractedLengthDisplay = document.getElementById('contracted-length-display');
const lorentzFactorLengthDisplay = document.getElementById('lorentz-factor-length');
const contractedRuler = document.querySelector('.contracted-ruler');

const originalLength = 100; // Original length in arbitrary units

/**
 * Updates the visual representation of length contraction.
 */
function updateLengthContraction() {
    const v = parseFloat(velocityLengthInput.value);
    const gamma = calculateLorentzFactor(v);

    // Contracted Length = Original Length / gamma
    const contracted = originalLength / gamma;

    velocityLengthDisplay.textContent = `${v.toFixed(3)}c`;
    lorentzFactorLengthDisplay.textContent = gamma.toFixed(2);
    contractedLengthDisplay.textContent = contracted.toFixed(2);

    // Visually adjust the ruler's width using CSS transform: scaleX()
    // The ruler starts at 100% width, so scaling by (1 / gamma) will contract it
    contractedRuler.style.transform = `scaleX(${1 / gamma})`;
}

// Event listener for length contraction slider
velocityLengthInput.addEventListener('input', updateLengthContraction);

// Initial update for length contraction when the page loads
updateLengthContraction();

// --- Spacetime Diagram Logic (using p5.js) ---
const velocitySpacetimeInput = document.getElementById('velocity-spacetime');
const velocitySpacetimeDisplay = document.getElementById('velocity-spacetime-display');
const lorentzFactorSpacetimeDisplay = document.getElementById('lorentz-factor-spacetime');
const spacetimeCanvasContainer = document.getElementById('spacetime-canvas-container');

let currentSpacetimeVelocity = 0; // Velocity for the moving observer
let s; // Variable to hold the p5.js instance

/**
 * The p5.js sketch for the spacetime diagram.
 * @param {p5} sketch The p5.js instance.
 */
const sketch = function(sketch) {
    let scaleFactor = 50; // Pixels per unit of space/time (ct)
    let originX, originY; // Center of the canvas

    sketch.setup = function() {
        // Create the canvas inside the specified container
        const canvas = sketch.createCanvas(spacetimeCanvasContainer.offsetWidth, spacetimeCanvasContainer.offsetHeight);
        canvas.parent('spacetime-canvas-container');
        sketch.angleMode(sketch.DEGREES); // Use degrees for easy angle calculations
        sketch.rectMode(sketch.CENTER); // For drawing rectangles from their center
        sketch.textAlign(sketch.CENTER, sketch.CENTER);

        // Set up initial origin (center of canvas)
        originX = sketch.width / 2;
        originY = sketch.height / 2;

        // Adjust scale factor based on canvas size for responsiveness
        scaleFactor = sketch.min(sketch.width, sketch.height) / 5; // Example scaling
        sketch.windowResized = () => {
            sketch.resizeCanvas(spacetimeCanvasContainer.offsetWidth, spacetimeCanvasContainer.offsetHeight);
            originX = sketch.width / 2;
            originY = sketch.height / 2;
            scaleFactor = sketch.min(sketch.width, sketch.height) / 5;
        };
    };

    sketch.draw = function() {
        sketch.background(40, 40, 60); // Dark background

        // Update velocity and Lorentz factor display
        const v = parseFloat(velocitySpacetimeInput.value);
        const gamma = calculateLorentzFactor(v);
        currentSpacetimeVelocity = v;

        velocitySpacetimeDisplay.textContent = `${v.toFixed(3)}c`;
        lorentzFactorSpacetimeDisplay.textContent = gamma.toFixed(2);

        sketch.push();
        sketch.translate(originX, originY); // Move origin to center of canvas
        sketch.scale(1, -1); // Flip Y-axis so +t is upwards

        // --- Draw stationary (black) axes (ct and x) ---
        sketch.stroke(200); // Light grey for stationary axes
        sketch.strokeWeight(1.5);
        sketch.line(-sketch.width / 2, 0, sketch.width / 2, 0); // x-axis
        sketch.line(0, -sketch.height / 2, 0, sketch.height / 2); // ct-axis

        // --- Draw grid lines for stationary observer ---
        sketch.stroke(100); // Darker grey for grid
        sketch.strokeWeight(0.5);
        // Vertical lines (constant x)
        for (let x = -4; x <= 4; x++) {
            sketch.line(x * scaleFactor, -sketch.height / 2, x * scaleFactor, sketch.height / 2);
        }
        // Horizontal lines (constant t)
        for (let t = -4; t <= 4; t++) {
            sketch.line(-sketch.width / 2, t * scaleFactor, sketch.width / 2, t * scaleFactor);
        }


        // --- Draw light cone (ct = +/- x) ---
        sketch.stroke(255, 255, 0, 150); // Yellow, semi-transparent
        sketch.strokeWeight(2);
        sketch.line(-sketch.width / 2, -sketch.width / 2, sketch.width / 2, sketch.width / 2); // ct = x
        sketch.line(-sketch.width / 2, sketch.width / 2, sketch.width / 2, -sketch.width / 2); // ct = -x
        sketch.noStroke();
        sketch.fill(255, 255, 0, 50); // Light yellow fill
        sketch.triangle(0, 0, -sketch.width/2, -sketch.width/2, sketch.width/2, -sketch.width/2); // Future light cone
        sketch.triangle(0, 0, -sketch.width/2, sketch.width/2, sketch.width/2, -sketch.width/2); // Past light cone


        // --- Draw moving (blue) axes (ct' and x') ---
        // The angle theta' for the moving axes (in our scaled units, where c=1)
        // tan(theta') = v (for x' axis, relative to x)
        // tan(theta') = 1/v (for ct' axis, relative to ct, but rotated towards x axis)
        // Angle of x' axis relative to x axis is arctan(v)
        // Angle of ct' axis relative to ct axis is arctan(v)
        let angle = sketch.atan(currentSpacetimeVelocity);

        sketch.stroke(100, 150, 255); // Blue for moving axes
        sketch.strokeWeight(1.5);

        // ct' axis (rotated towards x-axis by angle)
        sketch.push();
        sketch.rotate(angle);
        sketch.line(0, -sketch.height / 2, 0, sketch.height / 2);
        sketch.pop();

        // x' axis (rotated towards ct-axis by angle)
        sketch.push();
        sketch.rotate(angle);
        sketch.line(-sketch.width / 2, 0, sketch.width / 2, 0);
        sketch.pop();

        // --- Draw world line of a stationary object in its own frame (t' axis) ---
        // This is simply the ct' axis
        sketch.stroke(0, 200, 0); // Green for world lines (optional)
        sketch.strokeWeight(2);
        // For a stationary object at origin, its world line is the ct' axis

        // --- Draw events (example: (0,0) and (1,1)) ---
        sketch.fill(255);
        sketch.noStroke();
        // Event at (x=0, ct=0)
        sketch.ellipse(0, 0, 8, 8);
        // Event at (x=2, ct=1) in stationary frame
        sketch.ellipse(2 * scaleFactor, 1 * scaleFactor, 8, 8);

        // --- Draw grid lines for moving observer (simultaneity and constant position lines) ---
        sketch.stroke(50, 180, 50, 100); // Green for moving observer's grid (simultaneity)
        sketch.strokeWeight(0.7);

        // Simultaneity lines (lines parallel to x' axis)
        // These have slope -v (relative to x axis in ct vs x plot)
        // Line equation: ct = -vx + C_t
        for (let t_prime = -4; t_prime <= 4; t_prime++) {
            let y_intercept = t_prime * gamma * scaleFactor; // The 'ct' intercept for a given ct'
            sketch.line(-sketch.width / 2, -sketch.width / 2 * currentSpacetimeVelocity + y_intercept,
                        sketch.width / 2, sketch.width / 2 * currentSpacetimeVelocity + y_intercept);
        }

        sketch.stroke(255, 165, 0, 100); // Orange for moving observer's grid (constant position)
        sketch.strokeWeight(0.7);

        // Constant position lines (lines parallel to ct' axis)
        // These have slope 1/v (relative to x axis in ct vs x plot)
        // Line equation: ct = (1/v)x + C_x
        for (let x_prime = -4; x_prime <= 4; x_prime++) {
            let x_intercept = x_prime * gamma * scaleFactor; // The 'x' intercept for a given x'
            sketch.line(x_intercept - sketch.height / 2 * currentSpacetimeVelocity, -sketch.height / 2,
                        x_intercept + sketch.height / 2 * currentSpacetimeVelocity, sketch.height / 2);
        }


        // --- Axis labels ---
        sketch.fill(255);
        sketch.noStroke();
        sketch.scale(1, -1); // Flip Y-axis back for text drawing
        sketch.textSize(16);
        sketch.text('ct', -10, -sketch.height / 2 + 20); // ct-axis label
        sketch.text('x', sketch.width / 2 - 20, 15); // x-axis label

        // Labels for moving axes (ct', x')
        sketch.push();
        sketch.rotate(-angle); // Rotate back to draw text relative to the moving axes
        sketch.fill(100, 150, 255);
        sketch.text("ct'", 15 * sketch.sin(angle), 15 * sketch.cos(angle) - sketch.height / 2 + 20);
        sketch.text("x'", sketch.width / 2 - 20, 15);
        sketch.pop();

        sketch.pop(); // End of transformed coordinates
    };
};

// Initialize p5.js sketch when the page loads
// The p5.js instance is attached to the global 's' variable
s = new p5(sketch);

// This ensures the p5.js canvas resizes when the window does
window.addEventListener('resize', () => {
     // p5.js's windowResized handles the canvas itself, but we ensure the container sizes correctly
     // and then trigger p5's resizeCanvas via the sketch's own resize function.
     // This is handled automatically by the sketch.windowResized function within sketch.setup.
     // Just need to ensure the container dimensions are correct.
     if (s && s.windowResized) {
        s.windowResized();
     }
});

// Trigger an initial update for the spacetime diagram slider
velocitySpacetimeInput.addEventListener('input', () => {
    // No direct function call needed here for p5.js as it continuously draws in sketch.draw()
    // The `sketch.draw` function reads `currentSpacetimeVelocity` and updates
    // the display elements each frame.
    const v = parseFloat(velocitySpacetimeInput.value);
    const gamma = calculateLorentzFactor(v);
    velocitySpacetimeDisplay.textContent = `${v.toFixed(3)}c`;
    lorentzFactorSpacetimeDisplay.textContent = gamma.toFixed(2);
});

// Initial update for spacetime diagram display
velocitySpacetimeInput.dispatchEvent(new Event('input'));
