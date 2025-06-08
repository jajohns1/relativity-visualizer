// Constants (speed of light is assumed to be 1 for calculations of v/c by default)
const C_norm = 1; // Represents speed of light for fractional velocity calculations (c-units)
const C_SI = 299792458; // Speed of light in meters per second (SI units)

let C = C_norm

let isSIUnits = false; // Flag to track if SI units are active
let isFormulasVisible = false;


// Debugging: Check critical dependencies
function checkDependencies() {
    if (typeof p5 === 'undefined') {
        console.error("p5.js not loaded! Spacetime diagram will fail.");
        document.getElementById('spacetime-diagram-sim').innerHTML +=
            '<p class="text-red-500">Error: p5.js library failed to load.</p>';
    }
    if (typeof MathJax === 'undefined') {
        console.warn("MathJax not loaded - formulas won't render");
    }
}

// Safe value parser with fallback
function safeParseFloat(value, defaultValue = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Robust Lorentz Factor Calculation
 * @param {number} v Velocity of the new frame relative to the original (as v/c).
 * @returns {{tPrime: number, xPrime: number}} Transformed coordinates.
 */
function calculateLorentzFactor(v) {
    try {
        const effective_v_over_c = safeParseFloat(v);

        if (Math.abs(effective_v_over_c) >= 1) {
            console.warn(`Velocity (v=${effective_v}) reaches light speed`);
            return Infinity;
        }

        const denominator = Math.sqrt(1 - (effective_v_over_c ** 2));
        if (denominator < 1e-9) {
            console.warn("Extreme velocity - precision limit reached");
            return Infinity;
        }

        return 1 / denominator;
    } catch (err) {
        console.error("Lorentz factor calculation error:", err);
        return 1; // Fallback to no dilation
    }
}

// Throttled Velocity Updates
let lastUpdate = 0;
function throttleUpdate(callback, value) {
    const now = performance.now();
    if (now - lastUpdate > 16) { // ~60fps
        callback(value);
        lastUpdate = now;
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    checkDependencies();

    // Initialize units and formula states FIRST
    isSIUnits = unitsToggle.checked;
    isFormulasVisible = formulaToggle.checked;

    try {
        // Initialize all components
        updateAllVelocities(safeParseFloat(globalVelocityInput.value));

        // Enable MathJax if loaded
        if (typeof MathJax !== 'undefined' && isFormulasVisible) {
            MathJax.typesetPromise().catch(err =>
                console.error("MathJax typesetting failed:", err)
            );
        }
    } catch (err) {
        console.error("Initialization error:", err);
        // User-friendly error display
        document.querySelectorAll('.display-box').forEach(box => {
            box.textContent = "Error initializing simulation";
        });
    }
});

/**
 * Performs Lorentz Transformation for an event (t, x) to a new frame moving at velocity v.
 * @param {number} t Time coordinate in original frame.
 * @param {number} x Space coordinate in original frame.
 * @param {number} v Velocity of the new frame relative to the original (as v/c).
 * @returns {{tPrime: number, xPrime: number}} Transformed coordinates.
 */
function lorentzTransform(t, x, v) {
    const gamma = calculateLorentzFactor(v);
    const v_over_c = v / C;
    
    // Time transformation (include c² term in SI units)
    const tPrime = gamma * (t - (v_over_c * x) / C);
    // Space transformation
    const xPrime = gamma * (x - v_over_c * (C * t));
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
    globalVelocityInput.isGlobalUpdate = true;
    globalVelocityInput.value = v;
    globalVelocityDisplay.textContent = isSIUnits 
        ? `${(v * C_SI).toExponential(2)} m/s` 
        : `${v.toFixed(3)}c`;

    // Update all section-specific sliders
    velocityTimeInput.value = v;
    velocityLengthInput.value = v;
    velocitySpacetimeInput.value = v; // Spacetime can be negative
    twinVelocityInput.value = v;
    length3DVelocityInput.value = v;
    dopplerVelocityInput.value = v;

    // Trigger updates for each section
    updateTimeDilationClocks();
    updateLengthContraction();
    // For spacetime, p5.js sketch.draw() handles continuous updates based on velocitySpacetimeInput.value
    // But we can manually trigger a redraw for immediate visual feedback
    if (s) s.redraw();

    // Twin paradox update
    updateTwinParadox();

    update3DLengthContraction(v);
    updateDopplerEffect(v);

    // Update 3D plot
    if (cube) {
        const gamma = calculateLorentzFactor(v);
        cube.scale.x = 1 / gamma; // Length contraction along motion axis
        cube.scale.y = 1;         // No contraction perpendicular
        cube.scale.z = 1;         // No contraction perpendicular
    }

    globalVelocityInput.isGlobalUpdate = false;
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
        C = C_norm;
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
    const v = parseFloat(velocityTimeInput.value);
    if (!globalVelocityInput.isGlobalUpdate) { // Prevent infinite loop
        updateAllVelocities(v);
    }
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
velocityLengthInput.addEventListener('input', () => {
    updateLengthContraction();
    const v = parseFloat(velocityLengthInput.value);
    if (!globalVelocityInput.isGlobalUpdate) { // Prevent infinite loop
        updateAllVelocities(v);
    }
});

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
const sketch = function (sketch) {
    let scaleFactor = 50;
    let originX, originY;
    let unitScale = C_norm; // Add this to handle SI unit scaling

    sketch.setup = function () {
        // Create the canvas inside the specified container
        const canvas = sketch.createCanvas(spacetimeCanvasContainer.offsetWidth, spacetimeCanvasContainer.offsetHeight);
        canvas.parent('spacetime-canvas-container');
        sketch.angleMode(sketch.DEGREES); // Use degrees for easy angle calculations
        sketch.rectMode(sketch.CENTER); // For drawing rectangles from their center
        sketch.textAlign(sketch.CENTER, sketch.CENTER);

        // Set up initial origin (center of canvas)
        originX = sketch.width / 2;
        originY = sketch.height / 2;

        unitScale = 1/C_norm; // Scale down for SI units

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

    sketch.draw = function () {
        sketch.background(40, 40, 60); // Dark background

        // Get the current velocity value
        const v_input = parseFloat(velocitySpacetimeInput.value);
        currentSpacetimeVelocity = v_input;
        
        // Calculate effective v/c based on units
        const effective_v = currentSpacetimeVelocity;
        const gamma = calculateLorentzFactor(currentSpacetimeVelocity);
        
        // Update display - show full velocity in SI units, v/c in natural units
        velocitySpacetimeDisplay.textContent = isSIUnits 
            ? `${(currentSpacetimeVelocity * C_SI).toExponential(2)} m/s` 
            : `${currentSpacetimeVelocity.toFixed(3)}c`;
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
            axis2_slope = effective_v; // slope of x' axis in ct vs x is v/c
            axis1_slope = 1 / effective_v; // slope of ct' axis in ct vs x is c/v
        } else { // activeFrame === 'moving'
            // Moving frame is primary (orthogonal)
            axis1_color = sketch.color(100, 150, 255); // Blue for moving (now orthogonal)
            grid1_color = sketch.color(50, 150, 200, 100); // Lighter blue for its grid
            axis1_label = ["ct'", "x'"];

            axis2_color = 200; // Grey for stationary (now sheared)
            grid2_color = sketch.color(100, 100, 100, 100); // Darker grey for simultaneity
            grid3_color = sketch.color(150, 100, 50, 100); // Darker orange for constant position

            current_v_for_drawing = -currentSpacetimeVelocity; // Inverse velocity for shear
            axis2_slope = -effective_v; // slope of x axis in ct' vs x' is -v/c
            axis1_slope = -1 / effective_v; // slope of ct axis in ct' vs x' is -c/v
        }

        if (isSIUnits) {
            axis1_label = ["ct (m)", "x (m)"];
            axis2_label = activeFrame === 'stationary' ? ["ct' (m)", "x' (m)"] : ["ct (m)", "x (m)"];
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
            let scaledCoord = i * scaleFactor * unitScale;
            sketch.line(scaledCoord, -canvas_half_height, scaledCoord, canvas_half_height);
            sketch.line(-canvas_half_width, scaledCoord, canvas_half_width, scaledCoord);
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
                const x_at_ct0_in_moving_frame = (1 / gamma) * (1/C);

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
            let K_val = (coord / gamma) * scaleFactor * C_norm;
            
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
            sketch.ellipse(
                event.x * scaleFactor * unitScale, 
                event.ct * scaleFactor * unitScale, 
                10, 10
            );

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

    sketch.mouseClicked = function () {
        if (sketch.mouseX > 0 && sketch.mouseX < sketch.width &&
            sketch.mouseY > 0 && sketch.mouseY < sketch.height) {
            
            // Convert mouse coordinates with unit scaling
            let unitScale = C_norm;
            let x_coord_in_units = (sketch.mouseX - originX) / (scaleFactor * unitScale);
            let ct_coord_in_units = -(sketch.mouseY - originY) / (scaleFactor * unitScale);
    
            events.push({ 
                x: x_coord_in_units, 
                ct: ct_coord_in_units 
            });
            sketch.redraw();
        }
    };
};

// Initialize p5.js sketch when the page loads
s = new p5(sketch);

// Event listener for velocity slider
velocitySpacetimeInput.addEventListener('input', () => {
    // Redraw the canvas to apply new velocity
    s.redraw();
    const v = parseFloat(velocitySpacetimeInput.value);
    if (!globalVelocityInput.isGlobalUpdate) { // Prevent infinite loop
        updateAllVelocities(v);
    }
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

    velocityV1Display.textContent = isSIUnits 
        ? `${(v1 * C_SI).toExponential(2)} m/s` 
        : `${v1.toFixed(3)}c`;
    velocityV2Display.textContent = isSIUnits 
        ? `${(v2 * C_SI).toExponential(2)} m/s` 
        : `${v2.toFixed(3)}c`;
    resultantVelocityDisplay.textContent = isSIUnits 
        ? `${(vTotal * C_SI).toExponential(2)} m/s` 
        : `${vTotal.toFixed(3)}c`;
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
twinVelocityInput.addEventListener('input', () => {
    updateTwinParadox();
    const v = parseFloat(twinVelocityInput.value);
    if (!globalVelocityInput.isGlobalUpdate) { // Prevent infinite loop
        updateAllVelocities(v);
    }
});

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

document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', (e) => {
        const sliderGroup = e.target.closest('.slider-group');
        if (sliderGroup) {
            sliderGroup.setAttribute('data-value', e.target.value + 'c');
        }
    });
});

// 3D Plot Variables
let scene, camera, renderer, cube, controls;

function init3DPlot() {
    if (!isWebGLAvailable()) {
        document.getElementById('3d-plot-container').innerHTML =
            '<p class="text-red-500">3D not supported in your browser.</p>';
        return;
    }

    // 1. Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A202C);
    addEnhancedLighting(scene);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    const container = document.getElementById('3d-plot-container');
    renderer.setSize(container.clientWidth, 400);
    container.appendChild(renderer.domElement);

    // 4. Create Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({
        color: 0x8B5CF6,
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: 0.8
    });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 5. Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.zoomSpeed = 0.5;

    // Handle resizing
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / 400;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, 400);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (controls) controls.update();
    if (cube) {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.007;
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Add these variables
let length3DVelocityInput = document.getElementById('length-3d-velocity');
let length3DVelocityDisplay = document.getElementById('length-3d-velocity-display');

// Update the cube scaling based on the dedicated slider
function update3DLengthContraction(v) {
    // Check if cube exists
    if (!cube) {
        console.error("Cube not initialized yet!");
        return;
    }

    const gamma = calculateLorentzFactor(Math.abs(v));
    
    try {
        cube.scale.x = 1 / gamma; // Contract along motion axis
        cube.scale.y = 1;         // No change perpendicular
        cube.scale.z = 1;         // No change perpendicular

        // Visual effects
        cube.material.opacity = 0.5 + 0.5 / gamma;
        cube.material.color.setHSL(0.7, 0.9, 0.6 - (0.3 / gamma)); // Color change effect
        
        // Update display
        length3DVelocityDisplay.textContent = isSIUnits 
            ? `${(v * C_SI).toExponential(2)} m/s` 
            : `${v.toFixed(3)}c`;
    } catch (error) {
        console.error("Error updating cube:", error);
    }
}

if (!isWebGLAvailable()) {
    document.getElementById('3d-plot-container').innerHTML =
        '<p class="text-red-500">3D not supported in your browser.</p>';
}

// Doppler Effect Variables
let dopplerScene, dopplerCamera, dopplerRenderer, lightSphere, dopplerControls;
let dopplerVelocityInput = document.getElementById('doppler-velocity');
let dopplerVelocityDisplay = document.getElementById('doppler-velocity-display');

// Correct WebGL availability check for Three.js
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

function initDoppler3D() {
    if (!isWebGLAvailable()) {
        document.getElementById('doppler-3d-container').innerHTML =
            '<p class="text-red-500">WebGL not supported in your browser</p>';
        return;
    }

    // 1. Scene setup
    dopplerScene = new THREE.Scene();
    dopplerScene.background = new THREE.Color(0x1A202C);
    addEnhancedLighting(dopplerScene);

    // 2. Camera
    dopplerCamera = new THREE.PerspectiveCamera(75, 1.77, 0.1, 1000);
    dopplerCamera.position.set(0, 0, 5);

    // 3. Renderer
    dopplerRenderer = new THREE.WebGLRenderer({ antialias: true });
    const container = document.getElementById('doppler-3d-container');
    dopplerRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(dopplerRenderer.domElement);

    // 4. Create Sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.3,
        emissive: 0x000000,
        wireframe: false
    });
    lightSphere = new THREE.Mesh(geometry, material);
    dopplerScene.add(lightSphere);

    // 5. Controls
    dopplerControls = new THREE.OrbitControls(dopplerCamera, dopplerRenderer.domElement);
    dopplerControls.enableDamping = true;
    dopplerControls.dampingFactor = 0.05;
    dopplerControls.minDistance = 3;
    dopplerControls.maxDistance = 15;
    dopplerControls.zoomSpeed = 0.5;

    // Handle resizing
    window.addEventListener('resize', () => {
        const container = document.getElementById('doppler-3d-container');
        dopplerCamera.aspect = container.clientWidth / container.clientHeight;
        dopplerCamera.updateProjectionMatrix();
        dopplerRenderer.setSize(container.clientWidth, container.clientHeight);
    });

    animateDoppler();
}

function animateDoppler() {
    requestAnimationFrame(animateDoppler);
    if (dopplerControls) dopplerControls.update();
    // if (lightSphere) {
    //     const pulse = 1 + Math.sin(Date.now() * 0.001) * 0.02;
    //     lightSphere.scale.set(pulse, pulse, pulse);
    // }
    if (dopplerRenderer && dopplerScene && dopplerCamera) {
        dopplerRenderer.render(dopplerScene, dopplerCamera);
    }
}

// Lighting function
function addEnhancedLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init3DPlot();
    initDoppler3D();
    update3DLengthContraction(0);
    updateDopplerEffect(0);

    // if (isWebGLAvailable()) {
    //     initDoppler3D();
    //     updateDopplerEffect(0);
    // } else {
    //     document.getElementById('doppler-3d-container').innerHTML = 
    //       '<p class="text-red-500">WebGL not supported in your browser</p>';
    // }    
});

function updateDopplerSize() {
    const container = document.getElementById('doppler-3d-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    dopplerCamera.aspect = width / height;
    dopplerCamera.updateProjectionMatrix();
    dopplerRenderer.setSize(width, height);
}

function updateDopplerEffect(v) {
    if (!lightSphere) return;
    
    const dopplerFactor = Math.sqrt((1 + v) / (1 - v));
    const absV = Math.abs(v);

    // ONLY update color and brightness - no size change!
    if (v > 0) { // Approaching (blueshift)
        const hue = 0.6; // Blue
        lightSphere.material.color.setHSL(hue, 1, 0.5);
        lightSphere.material.emissive.setHSL(hue, 0.7, 0.3);
        lightSphere.material.emissiveIntensity = absV * 0.5;
    } 
    else if (v < 0) { // Receding (redshift)
        const hue = 0; // Red
        lightSphere.material.color.setHSL(hue, 1, 0.5);
        lightSphere.material.emissive.setHSL(hue, 0.3, 0.2);
        lightSphere.material.emissiveIntensity = absV * 0.3;
    } 
    else { // Stationary
        lightSphere.material.color.setHSL(0, 0, 1); // White
        lightSphere.material.emissiveIntensity = 0;
    }

    // Update numerical display only
    dopplerVelocityDisplay.textContent = isSIUnits 
        ? `${(v * C_SI).toExponential(2)} m/s` 
        : `${v.toFixed(3)}c`;
}

function updateDopplerSize() {
    const container = document.getElementById('doppler-3d-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    dopplerCamera.aspect = width / height;
    dopplerCamera.updateProjectionMatrix();
    dopplerRenderer.setSize(width, height);
}

function updateDopplerRendererSize() {
    const container = document.getElementById('doppler-3d-container');
    dopplerRenderer.setSize(container.clientWidth, container.clientHeight);
    dopplerCamera.aspect = container.clientWidth / container.clientHeight;
    dopplerCamera.updateProjectionMatrix();
}

function animateDoppler() {
    requestAnimationFrame(animateDoppler);
    dopplerControls.update();
    dopplerRenderer.render(dopplerScene, dopplerCamera);
}

function updateDopplerEffect(v) {
    if (!lightSphere) return;
    
    const dopplerFactor = Math.sqrt((1 + v) / (1 - v));
    const absV = Math.abs(v);
    
    // Create color gradient based on velocity
    if (v > 0) { // Approaching (blueshift)
        // Blend from white (0) to blue (max velocity)
        const hue = 0.6; // Blue
        const saturation = 1;
        const lightness = 0.8 - (0.3 * absV); // Gets darker as velocity increases
        lightSphere.material.color.setHSL(hue, saturation, lightness);
        
        // Add emission effect for approaching objects
        lightSphere.material.emissive = new THREE.Color(hue, saturation * 0.7, lightness * 0.5);
        lightSphere.material.emissiveIntensity = absV * 0.5;
    } 
    else if (v < 0) { // Receding (redshift)
        // Blend from white (0) to red (max velocity)
        const hue = 0; // Red
        const saturation = 1;
        const lightness = 0.8 - (0.3 * absV);
        lightSphere.material.color.setHSL(hue, saturation, lightness);
        
        // Subtler emission for receding objects
        lightSphere.material.emissive = new THREE.Color(hue, saturation * 0.3, lightness * 0.2);
        lightSphere.material.emissiveIntensity = absV * 0.3;
    } 
    else { // Stationary
        lightSphere.material.color.setHSL(0, 0, 1); // Pure white
        lightSphere.material.emissive.setHSL(0, 0, 0);
        lightSphere.material.emissiveIntensity = 0;
    }
    
    // // Add visual indicator of frequency change
    // lightSphere.scale.setScalar(1 + (dopplerFactor - 1) * 0.1); // Subtle size change
    
    // Update display
    dopplerVelocityDisplay.textContent = isSIUnits 
        ? `${(v * C_SI).toExponential(2)} m/s` 
        : `${v.toFixed(3)}c`;
}

// Event listener for Doppler slider
dopplerVelocityInput.addEventListener('input', () => {
    const v = parseFloat(dopplerVelocityInput.value);
    updateDopplerEffect(v);
    if (!globalVelocityInput.isGlobalUpdate) {
        updateAllVelocities(v);
    }
});

// For Length Contraction 3D
length3DVelocityInput.addEventListener('input', () => {
    const v = parseFloat(length3DVelocityInput.value);
    update3DLengthContraction(v);
    if (!globalVelocityInput.isGlobalUpdate) {
        updateAllVelocities(v);
    }
});

const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x000000,
    emissiveIntensity: 0,
    wireframe: false
});

const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B5CF6,
    roughness: 0.2,
    metalness: 0.5,
    transparent: true,
    opacity: 0.8,
    wireframe: false,
    side: THREE.DoubleSide
});

// Add to both initialization functions
function addEnhancedLighting(scene) {
    // Main light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(1, 1, 1);
    scene.add(mainLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-1, -1, -1);
    scene.add(fillLight);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Optional rim light for better edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
    rimLight.position.set(0, 0, 1);
    scene.add(rimLight);
}