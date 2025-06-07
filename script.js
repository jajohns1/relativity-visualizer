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
const frameRadios = document.querySelectorAll('input[name="spacetime-frame"]');

let currentSpacetimeVelocity = 0; // Velocity for the moving observer
let activeFrame = 'stationary'; // 'stationary' or 'moving'
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
        const v_input = parseFloat(velocitySpacetimeInput.value);
        currentSpacetimeVelocity = v_input;
        const gamma = calculateLorentzFactor(currentSpacetimeVelocity);

        velocitySpacetimeDisplay.textContent = `${currentSpacetimeVelocity.toFixed(3)}c`;
        lorentzFactorSpacetimeDisplay.textContent = gamma.toFixed(2);

        sketch.push();
        sketch.translate(originX, originY); // Move origin to center of canvas
        sketch.scale(1, -1); // Flip Y-axis so +t is upwards (standard physics convention)

        let canvas_half_width = sketch.width / 2;
        let canvas_half_height = sketch.height / 2;
        let extend_line_factor = 2; // Factor to extend lines beyond canvas for clipping by p5.js

        // --- Draw light cone (ct = +/- x) - always the same ---
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


        let axis1_color, axis2_color; // Colors for primary and secondary axes/grids
        let axis1_label, axis2_label; // Labels for primary and secondary axes
        let axis1_slope, axis2_slope; // Slopes for the secondary axes relative to primary
        let grid1_color, grid2_color; // Colors for primary and secondary grids

        let current_v_for_drawing; // Velocity to use for slope calculations

        if (activeFrame === 'stationary') {
            // Stationary frame is primary (orthogonal)
            axis1_color = 200; // Grey for stationary
            grid1_color = 100;
            axis1_label = ['ct', 'x'];

            axis2_color = sketch.color(100, 150, 255); // Blue for moving
            grid2_color = sketch.color(50, 180, 50, 100); // Green for simultaneity
            grid3_color = sketch.color(255, 165, 0, 100); // Orange for constant position

            current_v_for_drawing = currentSpacetimeVelocity; // Use actual velocity for shear
            axis2_slope = current_v_for_drawing; // slope of x' axis in ct vs x is v
            axis1_slope = 1 / current_v_for_drawing; // slope of ct' axis in ct vs x is 1/v
        } else { // activeFrame === 'moving'
            // Moving frame is primary (orthogonal)
            axis1_color = sketch.color(100, 150, 255); // Blue for moving (now orthogonal)
            grid1_color = sketch.color(50, 150, 200, 100); // Lighter blue for its grid
            axis1_label = ["ct'", "x'"];

            axis2_color = 200; // Grey for stationary (now sheared)
            grid2_color = sketch.color(100, 100, 100, 100); // Darker grey for simultaneity
            grid3_color = sketch.color(150, 100, 50, 100); // Darker orange for constant position

            current_v_for_drawing = -currentSpacetimeVelocity; // Inverse velocity for shear
            axis2_slope = current_v_for_drawing; // slope of x axis in ct' vs x' is -v
            axis1_slope = 1 / current_v_for_drawing; // slope of ct axis in ct' vs x' is -1/v
        }

        // --- Draw primary (orthogonal) axes (ct and x or ct' and x') ---
        sketch.stroke(axis1_color);
        sketch.strokeWeight(1.5);
        sketch.line(-canvas_half_width, 0, canvas_half_width, 0); // x or x' axis
        sketch.line(0, -canvas_half_height, 0, canvas_half_height); // ct or ct' axis

        // --- Draw primary (orthogonal) grid lines ---
        sketch.stroke(grid1_color);
        sketch.strokeWeight(0.5);
        for (let i = -4; i <= 4; i++) {
            sketch.line(i * scaleFactor, -canvas_half_height, i * scaleFactor, canvas_half_height); // Vertical lines
            sketch.line(-canvas_half_width, i * scaleFactor, canvas_half_width, i * scaleFactor); // Horizontal lines
        }

        // --- Draw secondary (sheared) axes (ct' and x' or ct and x) ---
        sketch.stroke(axis2_color);
        sketch.strokeWeight(1.5);

        // x' or x axis (line ct = v*x, slope = v)
        let x_sec_line_x1 = -canvas_half_width * extend_line_factor;
        let x_sec_line_y1 = x_sec_line_x1 * axis2_slope;
        let x_sec_line_x2 = canvas_half_width * extend_line_factor;
        let x_sec_line_y2 = x_sec_line_x2 * axis2_slope;
        sketch.line(x_sec_line_x1, x_sec_line_y1, x_sec_line_x2, x_sec_line_y2);

        // ct' or ct axis (line x = v*ct, or ct = (1/v)*x, slope = 1/v)
        if (current_v_for_drawing === 0) {
            // Vertical line when v=0
            sketch.line(0, -canvas_half_height * extend_line_factor, 0, canvas_half_height * extend_line_factor);
        } else {
            let ct_sec_slope = axis1_slope;
            let ct_sec_line_x1 = -canvas_half_width * extend_line_factor;
            let ct_sec_line_y1 = ct_sec_line_x1 * ct_sec_slope;
            let ct_sec_line_x2 = canvas_half_width * extend_line_factor;
            let ct_sec_line_y2 = ct_sec_line_x2 * ct_sec_slope;
            sketch.line(ct_sec_line_x1, ct_sec_line_y1, ct_sec_line_x2, ct_sec_line_y2);
        }

        // --- Worldline for the Moving Observer (highlighted ct' axis) ---
        // This is always the ct' axis of the "real" moving frame.
        // If activeFrame is 'stationary', it's the blue ct' axis.
        // If activeFrame is 'moving', it's the now-orthogonal blue ct' axis.
        sketch.stroke(70, 180, 255); // Slightly different blue for emphasis
        sketch.strokeWeight(3); // Thicker line

        if (activeFrame === 'stationary') {
            // It's the sheared blue axis with slope 1/v_input
            if (currentSpacetimeVelocity === 0) {
                sketch.line(0, -canvas_half_height * extend_line_factor, 0, canvas_half_height * extend_line_factor);
            } else {
                let ct_prime_slope = 1 / currentSpacetimeVelocity;
                let line_x1 = -canvas_half_width * extend_line_factor;
                let line_y1 = line_x1 * ct_prime_slope;
                let line_x2 = canvas_half_width * extend_line_factor;
                let line_y2 = line_x2 * ct_prime_slope;
                sketch.line(line_x1, line_y1, line_x2, line_y2);
            }
        } else { // activeFrame === 'moving'
            // It's the orthogonal ct' axis (which is now the canvas's y-axis)
            sketch.line(0, -canvas_half_height * extend_line_factor, 0, canvas_half_height * extend_line_factor);
        }


        // --- Draw a stationary object's world line (vertical line in its own rest frame) ---
        // This object is at x=1 in the original stationary frame.
        // If activeFrame is 'stationary', it's a vertical green line at x=1.
        // If activeFrame is 'moving', its worldline appears sheared with slope 1/(-v_input)
        sketch.stroke(0, 200, 0, 200); // Green
        sketch.strokeWeight(2);

        if (activeFrame === 'stationary') {
            sketch.line(1 * scaleFactor, -canvas_half_height, 1 * scaleFactor, canvas_half_height); // World line for x=1
            sketch.ellipse(1 * scaleFactor, 0, 10, 10); // Event at (x=1, ct=0)
        } else { // activeFrame === 'moving'
            // In moving frame, this object is moving at -v. Its worldline has slope 1/(-v)
            if (currentSpacetimeVelocity === 0) { // If v=0, it's vertical at x'=1
                sketch.line(1 * scaleFactor, -canvas_half_height, 1 * scaleFactor, canvas_half_height);
                sketch.ellipse(1 * scaleFactor, 0, 10, 10);
            } else {
                let obj_slope = 1 / (-currentSpacetimeVelocity);
                let x_prime_at_ct0 = (1 / gamma) * scaleFactor; // x' when ct=0, x=1
                
                let line_x1 = -canvas_half_width * extend_line_factor;
                let line_y1 = obj_slope * (line_x1 - x_prime_at_ct0);
                let line_x2 = canvas_half_width * extend_line_factor;
                let line_y2 = obj_slope * (line_x2 - x_prime_at_ct0);
                sketch.line(line_x1, line_y1, line_x2, line_y2);
                sketch.ellipse(x_prime_at_ct0, 0, 10, 10); // Event at (x'=transformed, ct'=0)
            }
        }

        // --- Draw grid lines for secondary (sheared) frame ---
        // Simultaneity lines (lines parallel to x' or x axis with slope 'v' or '-v')
        // Equation: ct = slope * x + K
        sketch.stroke(grid2_color);
        sketch.strokeWeight(0.7);
        for (let coord = -4; coord <= 4; coord++) {
            let K_val; // Intercept on the primary time axis
            if (activeFrame === 'stationary') { // lines of constant t'
                // t' = gamma(t - vx) => t = vx + t'/gamma
                K_val = (coord / gamma) * scaleFactor;
            } else { // lines of constant t
                // t = gamma(t' + vx') => t' = -vx' + t/gamma
                K_val = (coord / gamma) * scaleFactor;
            }

            let grid_line_x1 = -canvas_half_width * extend_line_factor;
            let grid_line_y1 = axis2_slope * grid_line_x1 + K_val;
            let grid_line_x2 = canvas_half_width * extend_line_factor;
            let grid_line_y2 = axis2_slope * grid_line_x2 + K_val;
            sketch.line(grid_line_x1, grid_line_y1, grid_line_x2, grid_line_y2);
        }

        // Constant position lines (lines parallel to ct' or ct axis with slope '1/v' or '-1/v')
        // Equation: ct = slope * x + K_x
        sketch.stroke(grid3_color);
        sketch.strokeWeight(0.7);
        for (let coord = -4; coord <= 4; coord++) {
            let K_x_val; // Intercept on the primary time axis when x=0
            if (activeFrame === 'stationary') { // lines of constant x'
                // x' = gamma(x - vt) => t = (1/v)x - x'/(v*gamma)
                if (current_v_for_drawing === 0) { // vertical lines
                    sketch.line(coord * scaleFactor, -canvas_half_height * extend_line_factor, coord * scaleFactor, canvas_half_height * extend_line_factor);
                    continue;
                }
                K_x_val = -(coord / (current_v_for_drawing * gamma)) * scaleFactor;
            } else { // lines of constant x
                // x = gamma(x' + vt') => t' = -(1/v)x' + x/(v*gamma)
                if (current_v_for_drawing === 0) { // vertical lines
                     sketch.line(coord * scaleFactor, -canvas_half_height * extend_line_factor, coord * scaleFactor, canvas_half_height * extend_line_factor);
                     continue;
                }
                K_x_val = -(coord / (current_v_for_drawing * gamma)) * scaleFactor;
            }

            let ct_sec_slope = axis1_slope;
            let grid_line_x1 = -canvas_half_width * extend_line_factor;
            let grid_line_y1 = ct_sec_slope * grid_line_x1 + K_x_val;
            let grid_line_x2 = canvas_half_width * extend_line_factor;
            let grid_line_y2 = ct_sec_slope * grid_line_x2 + K_x_val;
            sketch.line(grid_line_x1, grid_line_y1, grid_line_x2, grid_line_y2);
        }


        // --- Axis labels ---
        sketch.fill(255);
        sketch.noStroke();
        sketch.scale(1, -1); // Flip Y-axis back for text drawing (standard text orientation)
        sketch.textSize(16);

        // Labels for primary (orthogonal) axes
        sketch.text(axis1_label[0], 0, -canvas_half_height + 20); // Time axis label (top)
        sketch.text(axis1_label[1], canvas_half_width - 20, 0); // Space axis label (right)

        // Labels for secondary (sheared) axes
        sketch.fill(axis2_color); // Use the secondary axis color for its labels
        let label_offset_from_origin = scaleFactor * 3.5; // Distance from origin for label placement

        // x' or x axis label (secondary)
        let x_sec_angle_for_label = sketch.atan(axis2_slope);
        sketch.push();
        sketch.translate(label_offset_from_origin * sketch.cos(x_sec_angle_for_label),
                         label_offset_from_origin * sketch.sin(x_sec_angle_for_label));
        sketch.rotate(x_sec_angle_for_label); // Rotate text to align with the axis
        if (activeFrame === 'stationary') {
             sketch.text("x'", 0, 0);
        } else {
             sketch.text("x", 0, 0);
        }
        sketch.pop();

        // ct' or ct axis label (secondary)
        let ct_sec_angle_for_label;
        if (current_v_for_drawing === 0) {
            ct_sec_angle_for_label = 90; // Exactly vertical when v=0
        } else {
            ct_sec_angle_for_label = sketch.atan(axis1_slope);
        }
        sketch.push();
        sketch.translate(label_offset_from_origin * sketch.cos(ct_sec_angle_for_label),
                         label_offset_from_origin * sketch.sin(ct_sec_angle_for_label));
        sketch.rotate(ct_sec_angle_for_label); // Rotate text to align with the axis
        if (activeFrame === 'stationary') {
             sketch.text("ct'", 0, 0);
        } else {
             sketch.text("ct", 0, 0);
        }
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

// Event listener for velocity slider
velocitySpacetimeInput.addEventListener('input', () => {
    // No direct function call needed here for p5.js as it continuously draws in sketch.draw()
    // The `sketch.draw` function reads `currentSpacetimeVelocity` and updates
    // the display elements each frame.
    const v = parseFloat(velocitySpacetimeInput.value);
    const gamma = calculateLorentzFactor(v);
    velocitySpacetimeDisplay.textContent = `${v.toFixed(3)}c`;
    lorentzFactorSpacetimeDisplay.textContent = gamma.toFixed(2);
});

// Event listener for frame radio buttons
frameRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        activeFrame = event.target.value;
        // Redraw the canvas to apply the new frame
        s.redraw(); // Request p5.js to redraw immediately
    });
});

// Initial update for spacetime diagram display
velocitySpacetimeInput.dispatchEvent(new Event('input'));
