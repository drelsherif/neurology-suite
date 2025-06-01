// --- FINGER TAP TEST JAVASCRIPT ---

// --- DOM Element Selection ---
// This part of the code runs first to get references to all the HTML elements we need to work with.
const setupSection = document.getElementById('setupSection');
const testSection = document.getElementById('testSection');
const resultsSection = document.getElementById('resultsSection');
const summaryDashboard = document.getElementById('summaryDashboard');
const detailedAnalysis = document.getElementById('detailedAnalysis');

const testDurationInput = document.getElementById('testDurationInput');
const startButton = document.getElementById('startButton');
const timerDisplay = document.getElementById('timerDisplay');
const tapButton = document.getElementById('tapButton');
const tapCountDisplay = document.getElementById('tapCountDisplay');

// Summary Dashboard Elements
const summaryTotalTaps = document.getElementById('summaryTotalTaps');
const summaryAvgSpeed = document.getElementById('summaryAvgSpeed');
const summaryRhythmScore = document.getElementById('summaryRhythmScore');
const summaryFatigueLevel = document.getElementById('summaryFatigueLevel');

// Detailed Analysis Elements
const detailTotalTaps = document.getElementById('detailTotalTaps');
const detailTestDuration = document.getElementById('detailTestDuration');
const detailAvgSpeed = document.getElementById('detailAvgSpeed');
const detailMeanITI = document.getElementById('detailMeanITI');
const detailStdDevITI = document.getElementById('detailStdDevITI');
const detailCVITI = document.getElementById('detailCVITI');
const detailSpeedFirstHalf = document.getElementById('detailSpeedFirstHalf');
const detailSpeedSecondHalf = document.getElementById('detailSpeedSecondHalf');
const detailSpeedDrop = document.getElementById('detailSpeedDrop');
const detailRhythmFirstHalf = document.getElementById('detailRhythmFirstHalf');
const detailRhythmSecondHalf = document.getElementById('detailRhythmSecondHalf');

// Buttons
const showDetailedButton = document.getElementById('showDetailedButton');
const backToSummaryButton = document.getElementById('backToSummaryButton');
const startNewTestButton = document.getElementById('startNewTestButton');

// Modal Elements
const messageModal = document.getElementById('messageModal');
const modalMessageText = document.getElementById('modalMessageText');
const modalCloseButton = document.getElementById('modalCloseButton');

// --- Application State ---
// Variables to keep track of the test's state.
let testDuration = 10;
let tapTimestamps = [];
let tapCount = 0;
let timerInterval;
let timeLeft = 0;
let testIsActive = false;
let itiChartInstance = null;

// --- Utility Functions ---
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

function showModal(message) {
    modalMessageText.textContent = message;
    messageModal.classList.add('active');
}

// --- Event Listeners ---
// Attaching functions to events like button clicks.

// Modal close button
modalCloseButton.addEventListener('click', () => {
    messageModal.classList.remove('active');
});

// Start button
startButton.addEventListener('click', () => {
    const duration = parseInt(testDurationInput.value);
    if (isNaN(duration) || duration < 5 || duration > 60) {
        showModal("Please enter a valid duration between 5 and 60 seconds.");
        return;
    }
    testDuration = duration;
    startTest();
});

// Tap button (for both mouse clicks and touch events)
tapButton.addEventListener('click', handleTap);
tapButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents zoom/double-tap issues on mobile
    handleTap();
}, { passive: false });

// Navigation buttons in results screen
showDetailedButton.addEventListener('click', () => {
    summaryDashboard.classList.add('hidden');
    detailedAnalysis.classList.remove('hidden');
});

backToSummaryButton.addEventListener('click', () => {
    detailedAnalysis.classList.add('hidden');
    summaryDashboard.classList.remove('hidden');
});

startNewTestButton.addEventListener('click', () => {
    showSection('setupSection');
});


// --- Core Test Logic ---
function startTest() {
    // Reset state for a new test
    tapTimestamps = [];
    tapCount = 0;
    timeLeft = testDuration;
    testIsActive = true;

    // Update UI
    timerDisplay.textContent = timeLeft;
    tapCountDisplay.textContent = `Taps: 0`;
    showSection('testSection');
    detailedAnalysis.classList.add('hidden');
    summaryDashboard.classList.remove('hidden');

    // Clear previous chart if it exists
    if (itiChartInstance) {
        itiChartInstance.destroy();
        itiChartInstance = null;
    }

    // Start countdown timer
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endTest();
        }
    }, 1000);
}

function handleTap() {
    if (!testIsActive) return;

    tapTimestamps.push(performance.now()); // Record precise timestamp
    tapCount++;
    tapCountDisplay.textContent = `Taps: ${tapCount}`;

    // Visual feedback for the tap
    tapButton.classList.add('bg-emerald-700', 'scale-95');
    setTimeout(() => {
        tapButton.classList.remove('bg-emerald-700', 'scale-95');
    }, 100);
}

function endTest() {
    clearInterval(timerInterval);
    testIsActive = false;
    calculateResults();
    showSection('resultsSection');
}

// --- Calculation Engine ---
function calculateResults() {
    const numTaps = tapTimestamps.length;
    const avgSpeed = numTaps > 0 ? (numTaps / testDuration) : 0;

    // Calculate Inter-Tap Intervals (ITIs) in milliseconds
    let itis = [];
    if (numTaps > 1) {
        for (let i = 1; i < numTaps; i++) {
            itis.push(tapTimestamps[i] - tapTimestamps[i - 1]);
        }
    }

    // Calculate statistics from ITIs
    const meanITI = itis.length > 0 ? itis.reduce((a, b) => a + b, 0) / itis.length : 0;
    let stdDevITI = 0;
    if (itis.length > 1) {
        const variance = itis.reduce((sq, n) => sq + Math.pow(n - meanITI, 2), 0) / (itis.length - 1);
        stdDevITI = Math.sqrt(variance);
    }
    const cvITI = meanITI > 0 ? (stdDevITI / meanITI) * 100 : 0;

    // --- Fatigue/Decrement Analysis ---
    let speedFirstHalf = 0, speedSecondHalf = 0, speedDrop = 0;
    let rhythmFirstHalf = 0, rhythmSecondHalf = 0;

    if (numTaps > 3) {
        const midPointIndex = Math.floor(numTaps / 2);
        
        // Speed analysis
        const durationFirstHalf = (tapTimestamps[midPointIndex - 1] - tapTimestamps[0]) / 1000 || 0.1;
        speedFirstHalf = (midPointIndex) / durationFirstHalf;
        const durationSecondHalf = (tapTimestamps[numTaps - 1] - tapTimestamps[midPointIndex]) / 1000 || 0.1;
        speedSecondHalf = (numTaps - midPointIndex) / durationSecondHalf;
        speedDrop = speedFirstHalf > 0 ? ((speedFirstHalf - speedSecondHalf) / speedFirstHalf) * 100 : 0;

        // Rhythm analysis
        const itisFirstHalf = itis.slice(0, midPointIndex - 1);
        const itisSecondHalf = itis.slice(midPointIndex - 1);
        if (itisFirstHalf.length > 1) {
            const meanITIFirst = itisFirstHalf.reduce((a, b) => a + b, 0) / itisFirstHalf.length;
            const varianceFirst = itisFirstHalf.reduce((sq, n) => sq + Math.pow(n - meanITIFirst, 2), 0) / (itisFirstHalf.length - 1);
            rhythmFirstHalf = Math.sqrt(varianceFirst);
        }
        if (itisSecondHalf.length > 1) {
            const meanITISecond = itisSecondHalf.reduce((a, b) => a + b, 0) / itisSecondHalf.length;
            const varianceSecond = itisSecondHalf.reduce((sq, n) => sq + Math.pow(n - meanITISecond, 2), 0) / (itisSecondHalf.length - 1);
            rhythmSecondHalf = Math.sqrt(varianceSecond);
        }
    }

    displayResults({
        numTaps, testDuration, avgSpeed, meanITI, stdDevITI, cvITI, itis,
        speedFirstHalf, speedSecondHalf, speedDrop, rhythmFirstHalf, rhythmSecondHalf
    });
}

// --- Results Display ---
function displayResults(results) {
    // Summary Dashboard
    summaryTotalTaps.textContent = results.numTaps;
    summaryAvgSpeed.textContent = `${results.avgSpeed.toFixed(1)} taps/sec`;
    
    let rhythmScoreText = results.numTaps <= 1 ? "N/A" : (results.cvITI < 5 ? "Excellent" : (results.cvITI < 10 ? "Good" : (results.cvITI < 15 ? "Fair" : "Irregular")));
    summaryRhythmScore.textContent = rhythmScoreText;

    let fatigueLevelText = results.numTaps <= 3 ? "N/A" : (results.speedDrop < 5 ? "Stable" : (results.speedDrop < 15 ? "Minor Fatigue" : "Significant Decrement"));
    summaryFatigueLevel.textContent = fatigueLevelText;

    // Detailed Analysis
    detailTotalTaps.textContent = results.numTaps;
    detailTestDuration.textContent = results.testDuration;
    detailAvgSpeed.textContent = `${results.avgSpeed.toFixed(2)} taps/sec`;
    detailMeanITI.textContent = `${results.meanITI.toFixed(1)} ms`;
    detailStdDevITI.textContent = `${results.stdDevITI.toFixed(1)} ms`;
    detailCVITI.textContent = `${results.cvITI.toFixed(1)} %`;
    detailSpeedFirstHalf.textContent = `${results.speedFirstHalf.toFixed(2)} taps/sec`;
    detailSpeedSecondHalf.textContent = `${results.speedSecondHalf.toFixed(2)} taps/sec`;
    detailSpeedDrop.textContent = `${results.speedDrop.toFixed(1)} %`;
    detailRhythmFirstHalf.textContent = `${results.rhythmFirstHalf.toFixed(1)} ms`;
    detailRhythmSecondHalf.textContent = `${results.rhythmSecondHalf.toFixed(1)} ms`;

    drawITIPlot(results.itis);
}

function drawITIPlot(itis) {
    const ctx = document.getElementById('itiChart').getContext('2d');
    if (itiChartInstance) {
        itiChartInstance.destroy();
    }
    
    if (!itis || itis.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = "16px Inter";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText("Not enough data to plot ITIs.", ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    itiChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: itis.map((_, index) => index + 1),
            datasets: [{
                label: 'Inter-Tap Interval (ms)',
                data: itis,
                borderColor: 'rgb(14, 165, 233)',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                tension: 0.1,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false, title: { display: true, text: 'Interval Duration (ms)' }},
                x: { title: { display: true, text: 'Tap Interval Number' }}
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Interval ${context.label}: ${context.parsed.y.toFixed(1)} ms`;
                        }
                    }
                }
            }
        }
    });
}

// --- Initializer ---
// Show the setup screen when the page first loads.
showSection('setupSection');