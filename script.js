// Constants (speed of light is assumed to be 1 for calculations of v/c by default)
let C = 1; // Represents speed of light for fractional velocity calculations (c-units)
const C_SI = 299792458; // Speed of light in meters per second (SI units)

let isSIUnits = false; // Flag to track if SI units are active

/**
 * Calculates the Lorentz factor (gamma).
 * @param {number} v The velocity as a fraction of the speed of light (v/c).
 * @returns {number} The Lorentz factor. Returns Infinity if v >= C.
 */
function calculateLorentzFactor(v) {
    // Ensure v is always treated as a fraction of the current C (1 or C_SI)
    const effective_v_over_c = v / C;
    if (Math.abs(effective_v_over_c) >= 1) return Infinity; // Approaching or reaching light speed
    return 1 / Math.sqrt(1 - (effective_v_over_c * effective_v_over_c));
}

/**
 * Performs Lorentz Transformation for an event (t, x) to a new frame moving at velocity v.
 * @param {number} t Time coordinate in original frame.
 * @param {number} x Space coordinate in original frame.
 * @param {number} v Velocity of the new frame relative to the original (as v/c).
 * @returns {{tPrime: number, xPrime: number}} Transformed coordinates.
 */
function lorentzTransform(t, x, v) {
    const gamma = calculateLorentzFactor(v);
    const tPrime = gamma * (t - (v / C) * x / C); // In c-units, v/C is just v, x/C is x
    const xPrime = gamma * (x - v * t);
    return { tPrime, xPrime };
}

// --- Global Controls ---
const globalVelocityInput = document.getElementById('global-velocity');
const globalVelocityDisplay = document.getElementById('global-velocity-display');
const presetButtons = document.querySelectorAll('.preset-btn');
const formulaToggle = document.getElementById('formula-toggle');
const unitsToggle = document.getElementById('units-toggle');
const formulaDisplays = document.querySelectorAll('.formula-display');

// Event listener for global velocity slider
globalVelocityInput.addEventListener('input', () => {
    updateAllVelocities(parseFloat(globalVelocityInput.value));
});

// Function to update all velocity sliders and displays
function updateAllVelocities(v) {
    globalVelocityInput.value = v;
    globalVelocityDisplay.textContent = `${v.toFixed(3)}c`;

    // Update all section-specific sliders
    velocityTimeInput.value = v;
    velocityLengthInput.value = v;
    velocitySpacetimeInput.value = v; // Spacetime can be negative
    twinVelocityInput.value = v;

    // Trigger updates for each section
    updateTimeDilationClocks();
    updateLengthContraction();
    // For spacetime, p5.js sketch.draw() handles continuous updates based on velocitySpacetimeInput.value
    // But we can manually trigger a redraw for immediate visual feedback
    if (s) s.redraw();

    // Twin paradox update
    updateTwinParadox();
}

// Event listeners for preset buttons
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const velocity = parseFloat(button.dataset.velocity);
        updateAllVelocities(velocity);
    });
});

// Event listener for formula toggle
formulaToggle.addEventListener('change', () => {
    isFormulasVisible = formulaToggle.checked;
    formulaDisplays.forEach(display => {
        if (isFormulasVisible) {
            display.classList.remove('hidden');
        } else {
            display.classList.add('hidden');
        }
        // Re-render MathJax if formulas are shown (needed for initial load or new formulas)
        if (isFormulasVisible) {
            MathJax.typesetPromise([display]).catch((err) => console.log('MathJax Error:', err));
        }
    });
});

// Event listener for units toggle
unitsToggle.addEventListener('change', () => {
    isSIUnits = unitsToggle.checked;
    if (isSIUnits) {
        C = C_SI;
        // Adjust velocity displays to show actual m/s if desired, or keep as v/c for simplicity
        // For now, we'll keep v/c for consistency in the input range, but the 'c' will represent C_SI
        globalVelocityDisplay.textContent = `${(parseFloat(globalVelocityInput.value) * C_SI).toExponential(2)} m/s`;
        velocityTimeDisplay.textContent = `${(parseFloat(velocityTimeInput.value) * C_SI).toExponential(2)} m/s`;
        velocityLengthDisplay.textContent = `${(parseFloat(velocityLengthInput.value) * C_SI).toExponential(2)} m/s`;
        velocitySpacetimeDisplay.textContent = `${(parseFloat(velocitySpacetimeInput.value) * C_SI).toExponential(2)} m/s`;
        velocityV1Display.textContent = `${(parseFloat(velocityV1Input.value) * C_SI).toExponential(2)} m/s`;
        velocityV2Display.textContent = `${(parseFloat(velocityV2Input.value) * C_SI).toExponential(2)} m/s`;
        resultantVelocityDisplay.textContent = `${(parseFloat(resultantVelocityDisplay.textContent) * C_SI).toExponential(2)} m/s`;
        twinVelocityDisplay.textContent = `${(parseFloat(twinVelocityInput.value) * C_SI).toExponential(2)} m/s`;

        // Update fixed values like "100 units" to meters for length contraction
        document.querySelector('.ruler-container p').textContent = `Original Length ($L_0$): 100 meters`;
        document.querySelector('#contracted-length-display').textContent = `${(originalLength / calculateLorentzFactor(parseFloat(velocityLengthInput.value))).toFixed(2)} meters`;

    } else {
        C = 1;
        globalVelocityDisplay.textContent = `${parseFloat(globalVelocityInput.value).toFixed(3)}c`;
        velocityTimeDisplay.textContent = `${parseFloat(velocityTimeInput.value).toFixed(3)}c`;
        velocityLengthDisplay.textContent = `${parseFloat(velocityLengthInput.value).toFixed(3)}c`;
        velocitySpacetimeDisplay.textContent = `${parseFloat(velocitySpacetimeInput.value).toFixed(3)}c`;
        velocityV1Display.textContent = `${parseFloat(velocityV1Input.value).toFixed(3)}c`;
        velocityV2Display.textContent = `${parseFloat(velocityV2Input.value).toFixed(3)}c`;
        resultantVelocityDisplay.textContent = `${(parseFloat(resultantVelocityDisplay.textContent.replace(' m/s', '')) / C_SI).toFixed(3)}c`; // Convert back to v/c
        twinVelocityDisplay.textContent = `${parseFloat(twinVelocityInput.value).toFixed(3)}c`;

        // Update fixed values back to "units"
        document.querySelector('.ruler-container p').textContent = `Original Length ($L_0$): 100 units`;
        document.querySelector('#contracted-length-display').textContent = `${(originalLength / calculateLorentzFactor(parseFloat(velocityLengthInput.value))).toFixed(2)} units`;
    }
    // Re-render formulas if visible
    if (isFormulasVisible) {
        formulaDisplays.forEach(display => MathJax.typesetPromise([display]));
    }
});

// --- Time Dilation Logic ---
const velocityTimeInput = document.getElementById('velocity-time');
const velocityTimeDisplay = document.getElementById('velocity-time-display');
const stationaryTimeDisplay = document.getElementById('stationary-time');
const movingTimeDisplay = document.getElementById('moving-time');
const lorentzFactorTimeDisplay = document.getElementById('lorentz-factor-time');
const playPauseTimeBtn = document.getElementById('play-pause-time');
const resetTimeBtn = document.getElementById('reset-time');
const stationaryClockParticle = document.querySelector('.stationary-clock');
const movingClockParticle = document.querySelector('.moving-clock');

let stationaryTime = 0;
let movingTime = 0;
let animationFrameId; // To manage the animation loop for time dilation
let isTimeDilationPlaying = true; // State for play/pause

/**
 * Updates the clocks based on the current velocity for time dilation.
 * Uses requestAnimationFrame for a smooth animation loop.
 */
function updateTimeDilationClocks() {
    if (!isTimeDilationPlaying) {
        return; // Pause animation
    }

    const v = parseFloat(velocityTimeInput.value);
    const gamma = calculateLorentzFactor(v);

    velocityTimeDisplay.textContent = isSIUnits ? `${(v * C_SI).toExponential(2)} m/s` : `${v.toFixed(3)}c`;
    lorentzFactorTimeDisplay.textContent = gamma.toFixed(2);

    const deltaTime = 0.05; // Time step in "stationary observer" seconds
    stationaryTime += deltaTime;
    movingTime += deltaTime / gamma;

    stationaryTimeDisplay.textContent = stationaryTime.toFixed(2);
    movingTimeDisplay.textContent = movingTime.toFixed(2);

    // Basic "particle" animation within the clocks (using CSS transform)
    const normalizedTime = (stationaryTime % 10) / 10; // Normalize time to a 0-1 cycle for animation
    const normalizedMovingTime = (movingTime % 10) / 10;

    // stationaryClockParticle.style.transform = `scaleY(${1 - normalizedTime * 0.5}) translateZ(0)`; // Simple pulse
    // movingClockParticle.style.transform = `scaleY(${1 - normalizedMovingTime * 0.5}) translateZ(0)`; // Slower pulse

    animationFrameId = requestAnimationFrame(updateTimeDilationClocks);
}

// Event listener for time dilation slider
velocityTimeInput.addEventListener('input', () => {
    // Reset clocks when velocity changes to see the effect from start
    stationaryTime = 0;
    movingTime = 0;
    // Ensure animation is playing when slider is moved
    isTimeDilationPlaying = true;
    playPauseTimeBtn.textContent = 'Pause';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    updateTimeDilationClocks();
});

// Play/Pause button
playPauseTimeBtn.addEventListener('click', () => {
    isTimeDilationPlaying = !isTimeDilationPlaying;
    if (isTimeDilationPlaying) {
        playPauseTimeBtn.textContent = 'Pause';
        updateTimeDilationClocks(); // Resume animation
    } else {
        playPauseTimeBtn.textContent = 'Play';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Stop animation
        }
    }
});

// Reset button
resetTimeBtn.addEventListener('click', () => {
    stationaryTime = 0;
    movingTime = 0;
    stationaryTimeDisplay.textContent = "00.00";
    movingTimeDisplay.textContent = "00.00";
    // Pause animation and set button text
    isTimeDilationPlaying = false;
    playPauseTimeBtn.textContent = 'Play';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    stationaryClockParticle.style.transform = `scaleY(1)`; // Reset animation visual
    movingClockParticle.style.transform = `scaleY(1)`;
});

// Initial update for time dilation animation when the page loads
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

    velocityLengthDisplay.textContent = isSIUnits ? `${(v * C_SI).toExponential(2)} m/s` : `${v.toFixed(3)}c`;
    lorentzFactorLengthDisplay.textContent = gamma.toFixed(2);
    contractedLengthDisplay.textContent = isSIUnits ? `${contracted.toFixed(2)} meters` : `${contracted.toFixed(2)} units`;

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
const clearEventsBtn = document.getElementById('clear-events-btn');

let currentSpacetimeVelocity = 0; // Velocity for the moving observer
let activeFrame = 'stationary'; // 'stationary' or 'moving'
let s; // Variable to hold the p5.js instance
let events = []; // Array to store custom events {x, ct} in stationary frame coordinates

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
            sketch.redraw(); // Request redraw on resize
        };
        sketch.noLoop(); // Draw only when needed (on velocity change, frame change, or event click)
    };

    sketch.draw = function() {
        sketch.background(40, 40, 60); // Dark background

        // Update velocity and Lorentz factor display
        const v_input = parseFloat(velocitySpacetimeInput.value);
        currentSpacetimeVelocity = v_input;
        const gamma = calculateLorentzFactor(currentSpacetimeVelocity);

        velocitySpacetimeDisplay.textContent = isSIUnits ? `${(currentSpacetimeVelocity * C_SI).toExponential(2)} m/s` : `${currentSpacetimeVelocity.toFixed(3)}c`;
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
        let axis2_slope; // Slope for the secondary x-axis (ct' vs x or ct vs x')
        let axis1_slope; // Slope for the secondary ct-axis (ct' vs x or ct vs x')
        let grid1_color, grid2_color, grid3_color; // Colors for primary and secondary grids

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

        // x' or x axis (line ct = slope * x)
        let x_sec_line_x1 = -canvas_half_width * extend_line_factor;
        let x_sec_line_y1 = x_sec_line_x1 * axis2_slope;
        let x_sec_line_x2 = canvas_half_width * extend_line_factor;
        let x_sec_line_y2 = x_sec_line_x2 * axis2_slope;
        sketch.line(x_sec_line_x1, x_sec_line_y1, x_sec_line_x2, x_sec_line_y2);

        // ct' or ct axis (line x = slope * ct, or ct = (1/slope)*x)
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
                // To find the x' position of x=1 in the moving frame at ct'=0:
                // x' = gamma(x - vt), t'=gamma(t - vx/c^2)
                // If t'=0, then t = vx/c^2. Substitute into x'
                // x' = gamma(x - v(vx/c^2)) = gamma(x - v^2x/c^2) = gamma * x * (1 - v^2/c^2) = gamma * x * (1/gamma^2) = x / gamma
                const x_at_ct0_in_moving_frame = 1 / gamma; // x' when original x=1 and ct'=0
                
                let line_x1 = -canvas_half_width * extend_line_factor;
                let line_y1 = obj_slope * (line_x1 - x_at_ct0_in_moving_frame * scaleFactor);
                let line_x2 = canvas_half_width * extend_line_factor;
                let line_y2 = obj_slope * (line_x2 - x_at_ct0_in_moving_frame * scaleFactor);
                sketch.line(line_x1, line_y1, line_x2, line_y2);
                sketch.ellipse(x_at_ct0_in_moving_frame * scaleFactor, 0, 10, 10); // Event at (x'=transformed, ct'=0)
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

        // --- Draw Custom Events and their Simultaneity Lines ---
        events.forEach(event => {
            sketch.fill(255, 0, 255); // Magenta for events
            sketch.noStroke();
            sketch.ellipse(event.x * scaleFactor, event.ct * scaleFactor, 10, 10); // Draw event

            // Draw simultaneity line through the event for the active frame
            sketch.stroke(192, 132, 252, 150); // Lighter purple for event simultaneity lines
            sketch.strokeWeight(1.5);

            let event_x_scaled = event.x * scaleFactor;
            let event_ct_scaled = event.ct * scaleFactor;

            // If activeFrame is 'stationary', draw line of constant ct through event (horizontal)
            // If activeFrame is 'moving', draw line of constant ct' through event (slope = v)
            if (activeFrame === 'stationary') {
                sketch.line(-canvas_half_width, event_ct_scaled, canvas_half_width, event_ct_scaled);
            } else { // activeFrame === 'moving'
                // For a given event (t, x) in the stationary frame, find its t' value
                // t' = gamma(t - vx)
                const gamma_obs = calculateLorentzFactor(currentSpacetimeVelocity);
                const event_t_prime = gamma_obs * (event.ct - currentSpacetimeVelocity * event.x); // ct'

                // The equation for a line of constant ct' is: ct = v*x + ct'/gamma
                // So the intercept on the stationary ct axis is (event_t_prime / gamma_obs)
                let intercept_on_ct_axis = (event_t_prime / gamma_obs) * scaleFactor; // Convert back to pixels

                // Line has slope 'v' relative to stationary frame x-axis
                let simult_line_x1 = -canvas_half_width * extend_line_factor;
                let simult_line_y1 = currentSpacetimeVelocity * simult_line_x1 + intercept_on_ct_axis;
                let simult_line_x2 = canvas_half_width * extend_line_factor;
                let simult_line_y2 = currentSpacetimeVelocity * simult_line_x2 + intercept_on_ct_axis;
                sketch.line(simult_line_x1, simult_line_y1, simult_line_x2, simult_line_y2);
            }
        });


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

    sketch.mouseClicked = function() {
        // Only add events if click is within canvas bounds
        if (sketch.mouseX > 0 && sketch.mouseX < sketch.width &&
            sketch.mouseY > 0 && sketch.mouseY < sketch.height) {
            // Convert mouse coordinates (pixels) to spacetime coordinates (units)
            // Remember the Y-axis flip (scale(1, -1))
            let x_coord_in_units = (sketch.mouseX - originX) / scaleFactor;
            let ct_coord_in_units = -(sketch.mouseY - originY) / scaleFactor; // Inverted Y

            events.push({ x: x_coord_in_units, ct: ct_coord_in_units });
            sketch.redraw(); // Redraw to show the new event
        }
    };
};

// Initialize p5.js sketch when the page loads
s = new p5(sketch);

// Event listener for velocity slider
velocitySpacetimeInput.addEventListener('input', () => {
    // Redraw the canvas to apply new velocity
    s.redraw();
});

// Event listener for frame radio buttons
frameRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        activeFrame = event.target.value;
        s.redraw(); // Request p5.js to redraw immediately
    });
});

// Clear Events button
clearEventsBtn.addEventListener('click', () => {
    events = []; // Clear the events array
    s.redraw(); // Redraw the canvas
});

// Initial update for spacetime diagram display
velocitySpacetimeInput.dispatchEvent(new Event('input'));


// --- Relativistic Velocity Addition Logic ---
const velocityV1Input = document.getElementById('velocity-v1');
const velocityV1Display = document.getElementById('velocity-v1-display');
const velocityV2Input = document.getElementById('velocity-v2');
const velocityV2Display = document.getElementById('velocity-v2-display');
const resultantVelocityDisplay = document.getElementById('resultant-velocity-display');

/**
 * Calculates the relativistic velocity addition.
 * @param {number} v1 Velocity of frame S' relative to S (as v/c).
 * @param {number} v2 Velocity of object A relative to S' (as v/c).
 * @returns {number} Velocity of object A relative to S (as v/c).
 */
function calculateRelativisticVelocityAddition(v1, v2) {
    // In c-units, c^2 = 1.
    const sum = v1 + v2;
    const denominator = 1 + (v1 * v2);
    // Ensure denominator isn't zero or too close to zero to prevent Infinity/NaN
    if (Math.abs(denominator) < 1e-9) {
        return Math.sign(sum) * C; // Approaching light speed
    }
    return sum / denominator;
}

function updateVelocityAddition() {
    const v1 = parseFloat(velocityV1Input.value);
    const v2 = parseFloat(velocityV2Input.value);

    const vTotal = calculateRelativisticVelocityAddition(v1, v2);

    velocityV1Display.textContent = isSIUnits ? `${(v1 * C_SI).toExponential(2)} m/s` : `${v1.toFixed(3)}c`;
    velocityV2Display.textContent = isSIUnits ? `${(v2 * C_SI).toExponential(2)} m/s` : `${v2.toFixed(3)}c`;
    resultantVelocityDisplay.textContent = isSIUnits ? `${(vTotal * C_SI).toExponential(2)} m/s` : `${vTotal.toFixed(3)}c`;
}

// Event listeners for velocity addition sliders
velocityV1Input.addEventListener('input', updateVelocityAddition);
velocityV2Input.addEventListener('input', updateVelocityAddition);

// Initial update for velocity addition when page loads
updateVelocityAddition();


// --- Twin Paradox Logic (Conceptual) ---
const twinVelocityInput = document.getElementById('twin-velocity');
const twinVelocityDisplay = document.getElementById('twin-velocity-display');
const earthTimeDisplay = document.getElementById('earth-time-display');
const travelingTwinTimeDisplay = document.getElementById('traveling-twin-time-display');

const earthBasedTotalTime = 10; // Fixed 10 years for Earth-based time

function updateTwinParadox() {
    const v_twin = parseFloat(twinVelocityInput.value);
    const gamma_twin = calculateLorentzFactor(v_twin);

    // Earth-based time is the coordinate time (Delta t)
    // Traveling twin's time is the proper time (Delta tau)
    const travelingTwinTime = earthBasedTotalTime / gamma_twin;

    twinVelocityDisplay.textContent = isSIUnits ? `${(v_twin * C_SI).toExponential(2)} m/s` : `${v_twin.toFixed(3)}c`;
    earthTimeDisplay.textContent = `${earthBasedTotalTime.toFixed(2)} years`;
    travelingTwinTimeDisplay.textContent = `${travelingTwinTime.toFixed(2)} years`;
}

// Event listener for twin paradox velocity slider
twinVelocityInput.addEventListener('input', updateTwinParadox);

// Initial update for twin paradox when page loads
updateTwinParadox();


// --- Initial Global Update ---
// Ensure all initial displays are correct based on default global velocity
document.addEventListener('DOMContentLoaded', () => {
    // Initialize formula display state
    isFormulasVisible = formulaToggle.checked;
    formulaDisplays.forEach(display => {
        if (isFormulasVisible) {
            display.classList.remove('hidden');
        } else {
            display.classList.add('hidden');
        }
    });

    // Manually trigger updates for all sections on page load
    // The initial globalVelocityInput.value is 0, so this sets everything to 0c and gamma 1.00
    updateAllVelocities(parseFloat(globalVelocityInput.value));
    // Also trigger initial MathJax typesetting for formulas if they are visible
    if (isFormulasVisible) {
        formulaDisplays.forEach(display => MathJax.typesetPromise([display]));
    }
});