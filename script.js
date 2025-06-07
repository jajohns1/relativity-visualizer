// Constants (speed of light is assumed to be 1 for calculations of v/c)
const C = 1; // Representing speed of light as 1 for fractional velocity calculations

/**
 * Calculates the Lorentz factor (gamma).
 * @param {number} v The velocity as a fraction of the speed of light (v/c).
 * @returns {number} The Lorentz factor. Returns Infinity if v >= C.
 */
function calculateLorentzFactor(v) {
    // gamma is always positive, even for negative v
    if (Math.abs(v) >= C) return Infinity; // Approaching or reaching light speed
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
    // Note: gamma is always >= 1, so moving time always increments slower or equal
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
        scaleFactor = sketch.min(sketch.width, sketch.height) / 5; // Example scaling, ensures content fits
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
        sketch.scale(1, -1); // Flip Y-axis so +t is upwards (standard physics convention)

        let canvas_half_width = sketch.width / 2;
        let canvas_half_height = sketch.height / 2;
        let extend_line_factor = 2; // Factor to extend lines beyond canvas for clipping by p5.js

        // --- Draw stationary (grey) axes (ct and x) ---
        sketch.stroke(200); // Light grey for stationary axes
        sketch.strokeWeight(1.5);
        sketch.line(-canvas_half_width, 0, canvas_half_width, 0); // x-axis
        sketch.line(0, -canvas_half_height, 0, canvas_half_height); // ct-axis

        // --- Draw grid lines for stationary observer ---
        sketch.stroke(100); // Darker grey for grid
        sketch.strokeWeight(0.5);
        // Vertical lines (constant x)
        for (let x_grid = -4; x_grid <= 4; x_grid++) {
            sketch.line(x_grid * scaleFactor, -canvas_half_height, x_grid * scaleFactor, canvas_half_height);
        }
        // Horizontal lines (constant t)
        for (let t_grid = -4; t_grid <= 4; t_grid++) {
            sketch.line(-canvas_half_width, t_grid * scaleFactor, canvas_half_width, t_grid * scaleFactor);
        }

        // --- Draw light cone (ct = +/- x) ---
        sketch.stroke(255, 255, 0, 150); // Yellow, semi-transparent
        sketch.strokeWeight(2);
        // Lines extending to canvas edges
        sketch.line(-canvas_half_width * extend_line_factor, -canvas_half_width * extend_line_factor, canvas_half_width * extend_line_factor, canvas_half_width * extend_line_factor); // ct = x
        sketch.line(-canvas_half_width * extend_line_factor, canvas_half_width * extend_line_factor, canvas_half_width * extend_line_factor, -canvas_half_width * extend_line_factor); // ct = -x
        sketch.noStroke();
        sketch.fill(255, 255, 0, 50); // Light yellow fill
        // Draw light cone triangles, ensure they cover the area
        let cone_extent = sketch.max(canvas_half_width, canvas_half_height) * extend_line_factor;
        sketch.triangle(0, 0, -cone_extent, -cone_extent, cone_extent, -cone_extent); // Future light cone
        sketch.triangle(0, 0, -cone_extent, cone_extent, cone_extent, cone_extent); // Past light cone


        // --- Draw moving (blue) axes (ct' and x') ---
        sketch.stroke(100, 150, 255); // Blue for moving axes
        sketch.strokeWeight(1.5);

        // x' axis (line ct = v*x, slope = v)
        let x_prime_slope = currentSpacetimeVelocity;
        let x_prime_line_x1 = -canvas_half_width * extend_line_factor;
        let x_prime_line_y1 = x_prime_line_x1 * x_prime_slope;
        let x_prime_line_x2 = canvas_half_width * extend_line_factor;
        let x_prime_line_y2 = x_prime_line_x2 * x_prime_slope;
        sketch.line(x_prime_line_x1, x_prime_line_y1, x_prime_line_x2, x_prime_line_y2);


        // ct' axis (line x = v*ct, or ct = (1/v)*x, slope = 1/v)
        if (currentSpacetimeVelocity === 0) {
            // Vertical line when v=0
            sketch.line(0, -canvas_half_height * extend_line_factor, 0, canvas_half_height * extend_line_factor);
        } else {
            let ct_prime_slope = 1 / currentSpacetimeVelocity;
            let ct_prime_line_x1 = -canvas_half_width * extend_line_factor;
            let ct_prime_line_y1 = ct_prime_line_x1 * ct_prime_slope;
            let ct_prime_line_x2 = canvas_half_width * extend_line_factor;
            let ct_prime_line_y2 = ct_prime_line_x2 * ct_prime_slope;
            sketch.line(ct_prime_line_x1, ct_prime_line_y1, ct_prime_line_x2, ct_prime_line_y2);
        }

        // --- Draw a stationary object's world line (vertical line at x=constant) ---
        // Example: World line of an object stationary at x=1 in stationary frame
        sketch.stroke(0, 200, 0, 200); // Green
        sketch.strokeWeight(2);
        sketch.line(1 * scaleFactor, -canvas_half_height, 1 * scaleFactor, canvas_half_height); // World line for x=1
        sketch.ellipse(1 * scaleFactor, 0, 10, 10); // Event at (x=1, ct=0)

        // --- Draw grid lines for moving observer (simultaneity and constant position lines) ---
        // Simultaneity lines (lines parallel to x' axis)
        // These have slope 'v' (in ct vs x plot). Equation: ct = v*x + K
        sketch.stroke(50, 180, 50, 100); // Green for moving observer's simultaneity lines
        sketch.strokeWeight(0.7);
        for (let t_prime_coord = -4; t_prime_coord <= 4; t_prime_coord++) {
            // K (ct-intercept when x=0) for a given t' is t_prime_coord / gamma
            // From t' = gamma(t - vx) => t = vx + t'/gamma
            let K_for_t_prime = (t_prime_coord / gamma) * scaleFactor;
            
            let grid_line_x1 = -canvas_half_width * extend_line_factor;
            let grid_line_y1 = x_prime_slope * grid_line_x1 + K_for_t_prime;
            let grid_line_x2 = canvas_half_width * extend_line_factor;
            let grid_line_y2 = x_prime_slope * grid_line_x2 + K_for_t_prime;
            sketch.line(grid_line_x1, grid_line_y1, grid_line_x2, grid_line_y2);
        }

        // Constant position lines (lines parallel to ct' axis)
        // These have slope '1/v' (in ct vs x plot). Equation: ct = (1/v)*x + K_x
        sketch.stroke(255, 165, 0, 100); // Orange for moving observer's constant position lines
        sketch.strokeWeight(0.7);
        for (let x_prime_coord = -4; x_prime_coord <= 4; x_prime_coord++) {
            if (currentSpacetimeVelocity === 0) {
                // Vertical lines when v=0 (x = constant)
                let x_pos = x_prime_coord * scaleFactor; // x' coords are just x coords at v=0
                sketch.line(x_pos, -canvas_half_height * extend_line_factor, x_pos, canvas_half_height * extend_line_factor);
            } else {
                // K_x (ct-intercept when x=0) for a given x' is -(x_prime_coord / (v * gamma))
                // From x' = gamma(x - vt) => t = (1/v)x - x'/(v*gamma)
                let K_x_for_x_prime = -(x_prime_coord / (currentSpacetimeVelocity * gamma)) * scaleFactor;
                
                let ct_prime_slope = 1 / currentSpacetimeVelocity;
                let grid_line_x1 = -canvas_half_width * extend_line_factor;
                let grid_line_y1 = ct_prime_slope * grid_line_x1 + K_x_for_x_prime;
                let grid_line_x2 = canvas_half_width * extend_line_factor;
                let grid_line_y2 = ct_prime_slope * grid_line_x2 + K_x_for_x_prime;
                sketch.line(grid_line_x1, grid_line_y1, grid_line_x2, grid_line_y2);
            }
        }


        // --- Axis labels ---
        sketch.fill(255);
        sketch.noStroke();
        sketch.scale(1, -1); // Flip Y-axis back for text drawing (standard text orientation)
        sketch.textSize(16);

        // Labels for stationary axes
        sketch.text('ct', 0, -canvas_half_height + 20); // ct-axis label (top)
        sketch.text('x', canvas_half_width - 20, 0); // x-axis label (right)

        // Labels for moving axes (ct', x')
        sketch.fill(100, 150, 255); // Blue for moving axis labels
        let label_offset_from_origin = scaleFactor * 3.5; // Distance from origin for label placement

        // x' axis label: Positioned along the x' axis, then rotated to align
        // The angle for x' axis is atan(v) relative to the x-axis.
        let x_prime_angle_for_label = sketch.atan(currentSpacetimeVelocity);
        sketch.push();
        sketch.translate(label_offset_from_origin * sketch.cos(x_prime_angle_for_label),
                         label_offset_from_origin * sketch.sin(x_prime_angle_for_label));
        sketch.rotate(x_prime_angle_for_label); // Rotate text to align with the axis
        sketch.text("x'", 0, 0);
        sketch.pop();

        // ct' axis label: Positioned along the ct' axis, then rotated to align
        // The angle for ct' axis is atan(1/v) relative to the x-axis.
        let ct_prime_angle_for_label;
        if (currentSpacetimeVelocity === 0) {
            ct_prime_angle_for_label = 90; // Exactly vertical when v=0
        } else {
            ct_prime_angle_for_label = sketch.atan(1 / currentSpacetimeVelocity);
        }
        sketch.push();
        sketch.translate(label_offset_from_origin * sketch.cos(ct_prime_angle_for_label),
                         label_offset_from_origin * sketch.sin(ct_prime_angle_for_label));
        sketch.rotate(ct_prime_angle_for_label); // Rotate text to align with the axis
        sketch.text("ct'", 0, 0);
        sketch.pop();

        sketch.pop(); // End of transformed coordinates
    };
};

// Initialize p5.js sketch when the page loads
s = new p5(sketch);

// This ensures the p5.js canvas resizes when the window does
window.addEventListener('resize', () => {
     if (s && s.windowResized) {
        s.windowResized();
     }
});

// Trigger an initial update for the spacetime diagram slider
velocitySpacetimeInput.addEventListener('input', () => {
    const v = parseFloat(velocitySpacetimeInput.value);
    const gamma = calculateLorentzFactor(v);
    velocitySpacetimeDisplay.textContent = `${v.toFixed(3)}c`;
    lorentzFactorSpacetimeDisplay.textContent = gamma.toFixed(2);
});

// Initial update for spacetime diagram display
velocitySpacetimeInput.dispatchEvent(new Event('input'));
