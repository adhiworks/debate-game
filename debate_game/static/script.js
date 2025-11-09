// Timer variables
let timerInterval = null;
let seconds = 0;
let isTimerRunning = false;

// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const rollNumber1El = document.getElementById('rollNumber1');
const rollNumber2El = document.getElementById('rollNumber2');
const topicDisplayEl = document.getElementById('topicDisplay');
const startRoundBtn = document.getElementById('startRoundBtn');
const winBtn1 = document.getElementById('winBtn1');
const winBtn2 = document.getElementById('winBtn2');

// Timer functions
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = formatTime(seconds);
        }, 1000);
    }
}

function pauseTimer() {
    isTimerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    pauseTimer();
    seconds = 0;
    timerDisplay.textContent = '00:00';
}

// Start new round
async function startNewRound() {
    try {
        topicDisplayEl.classList.add('changing');
        
        const response = await fetch('/api/start_round', { method: 'POST' });
        const data = await response.json();
        
        setTimeout(() => {
            rollNumber1El.textContent = data.roll1;
            rollNumber2El.textContent = data.roll2;
            topicDisplayEl.textContent = data.topic;
            topicDisplayEl.classList.remove('changing');
            
            // Enable win buttons
            winBtn1.disabled = false;
            winBtn2.disabled = false;
            
            // Reset and start timer
            resetTimer();
        }, 250);
        
    } catch (error) {
        console.error('Error starting round:', error);
        alert('Error starting new round. Please try again.');
    }
}

// Declare winner
async function declareWinner(winnerRoll) {
    // Pause timer
    pauseTimer();
    const timerValue = timerDisplay.textContent;
    
    // Disable buttons temporarily
    winBtn1.disabled = true;
    winBtn2.disabled = true;
    
    try {
        const response = await fetch('/api/declare_winner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner_roll: winnerRoll,
                timer_value: timerValue
            })
        });
        
        const data = await response.json();
        
        // Show confetti
        createConfetti();
        
        // Wait a moment, then load next round
        setTimeout(() => {
            topicDisplayEl.classList.add('changing');
            
            setTimeout(() => {
                rollNumber1El.textContent = data.next_round.roll1;
                rollNumber2El.textContent = data.next_round.roll2;
                topicDisplayEl.textContent = data.next_round.topic;
                topicDisplayEl.classList.remove('changing');
                
                // Enable win buttons
                winBtn1.disabled = false;
                winBtn2.disabled = false;
                
                // Reset timer
                resetTimer();
            }, 250);
        }, 1500);
        
    } catch (error) {
        console.error('Error declaring winner:', error);
        alert('Error declaring winner. Please try again.');
        winBtn1.disabled = false;
        winBtn2.disabled = false;
    }
}

// Confetti animation
function createConfetti() {
    const colors = ['#5cb85c', '#4a7c8c', '#667eea', '#764ba2', '#f39c12', '#e74c3c'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        
        document.body.appendChild(confetti);
        
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: 2000 + Math.random() * 1000,
            easing: 'ease-in'
        });
        
        animation.onfinish = () => confetti.remove();
    }
}

// Event listeners
startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);
startRoundBtn.addEventListener('click', startNewRound);

winBtn1.addEventListener('click', () => {
    const roll = parseInt(rollNumber1El.textContent);
    if (!isNaN(roll)) {
        declareWinner(roll);
    }
});

winBtn2.addEventListener('click', () => {
    const roll = parseInt(rollNumber2El.textContent);
    if (!isNaN(roll)) {
        declareWinner(roll);
    }
});
