const canvas = document.getElementById('plinko-canvas');
const ctx = canvas.getContext('2d');

const WIDTH = 1000;
const HEIGHT = 800;
const pegColor = '#fff';
const slotWidth = 38;
const slotHeight = 38;
const OBSTACLE_PAD = 40;
const OBSTACLE_START = 100;
const ROWS = 16;
const COLS = 17;
const pegRadius = 8;
const ballRadius = 10;
const slotY = OBSTACLE_START + (ROWS - 1) * OBSTACLE_PAD + 40;
const boardOffsetX = 100;
const boardOffsetY = OBSTACLE_START;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const multiColors = [
    '#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#ffff66', '#ffff99', '#ffffcc',
    '#ffffff', // center
    '#ffffcc', '#ffff99', '#ffff66', '#ffff00', '#ffbf00', '#ff8000', '#ff4000', '#ff0000'
];
const multiLabels = [
    '1000x', '130x', '26x', '9x', '4x', '2x', '0.2x', '0.2x',
    '0.2x', // center
    '0.2x', '0.2x', '2x', '4x', '9x', '26x', '130x', '1000x'
];
function getMultiplierLabel(i) { return multiLabels[i] || ''; }

// Peg positions (classic Plinko: triangle)
let pegs = [];
for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= row; col++) {
        let x = boardOffsetX + ((COLS - 1 - row) * (OBSTACLE_PAD / 2)) + col * OBSTACLE_PAD;
        let y = boardOffsetY + row * OBSTACLE_PAD;
        pegs.push({x, y});
    }
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw slots and multipliers
    for (let i = 0; i < COLS; i++) {
        let x = boardOffsetX + i * OBSTACLE_PAD;
        ctx.fillStyle = multiColors[i % multiColors.length];
        ctx.fillRect(x - slotWidth/2, slotY, slotWidth, slotHeight);
        ctx.strokeStyle = '#222';
        ctx.strokeRect(x - slotWidth/2, slotY, slotWidth, slotHeight);

        // Draw multiplier text INSIDE slot
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(getMultiplierLabel(i), x, slotY + slotHeight / 1.5);

        // Draw multiplier text ABOVE slot
        ctx.font = 'bold 16px Arial';
        ctx.fillText(getMultiplierLabel(i), x, slotY - 10);
    }

    // Draw pegs
    for (const peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, 2 * Math.PI);
        ctx.fillStyle = pegColor;
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
    }
}
drawBoard();

// Animate ball using moves array from backend
function animateBall(moves) {
    let path = [];
    let currentCol = Math.floor(COLS / 2);

    // Start at the top peg (row 0, only one peg)
    let x = boardOffsetX + ((COLS - 1) * (OBSTACLE_PAD / 2));
    let y = boardOffsetY;
    path.push({ x, y });

    // Build the path: at each row, the ball passes through the peg at (row, currentCol)
    for (let row = 1; row < ROWS; row++) {
        let pegRowOffset = boardOffsetX + ((COLS - 1 - row) * (OBSTACLE_PAD / 2));
        if (currentCol === 0) {
            currentCol++;
        } else if (currentCol === row) {
            currentCol--;
        } else {
            if (moves[row - 1] === 1) currentCol++;
            else currentCol--;
        }
        let px = pegRowOffset + currentCol * OBSTACLE_PAD;
        let py = boardOffsetY + row * OBSTACLE_PAD;
        path.push({ x: px, y: py });
    }
    // The ball lands in the slot directly below the last peg
    let slotX = boardOffsetX + currentCol * OBSTACLE_PAD;
    let slotYCenter = slotY + slotHeight / 2;
    path.push({ x: slotX, y: slotYCenter });

    let i = 0;
    let progress = 0;
    const speed = 0.03;

    function step() {
        drawBoard();
        let from = path[i];
        let to = path[i + 1] || from;
        // Ease for bounce effect
        let ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        let easedProgress = ease(progress);

        // Ball shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(
            from.x + (to.x - from.x) * easedProgress,
            from.y + (to.y - from.y) * easedProgress + ballRadius + 4,
            ballRadius * 0.9, 0, 2 * Math.PI
        );
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.restore();

        // Ball color changes as it falls
        let hue = 50 + i * 10;
        ctx.beginPath();
        ctx.arc(
            from.x + (to.x - from.x) * easedProgress,
            from.y + (to.y - from.y) * easedProgress,
            ballRadius, 0, 2 * Math.PI
        );
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fill();
        ctx.strokeStyle = '#aa0';
        ctx.stroke();

        // Play peg sound at each peg
        if (progress === 0 && i > 0 && i < path.length - 1) {
            const pegSound = document.getElementById('peg-sound');
            if (pegSound) {
                pegSound.currentTime = 0;
                pegSound.play();
            }
        }
        // Play slot sound at the end
        if (i === path.length - 2 && progress > 0.5) {
            const slotSound = document.getElementById('slot-sound');
            if (slotSound && !slotSound.played.length) {
                slotSound.currentTime = 0;
                slotSound.play();
            }
        }

        progress += speed;
        if (progress >= 1) {
            progress = 0;
            i++;
        }
        if (i < path.length - 1) {
            requestAnimationFrame(step);
        }
    }
    step();
}

// Play button logic
document.getElementById('play-btn').onclick = function() {
    const bet = parseInt(document.getElementById('bet').value, 10);
    fetch('/api/drop_ball', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bet: bet})
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById('result').innerText =
                `Ball landed in slot ${data.slot}, reward: $${data.reward}`;
            document.getElementById('balance').innerText = data.balance;
            animateBall(data.moves);
        }
    });
};

// All In button logic
document.getElementById('all-in-btn').onclick = function() {
    document.getElementById('bet').value = document.getElementById('balance').innerText;
};

const betInput = document.getElementById('bet');
betInput.addEventListener('input', function() {
    this.style.width = ((this.value.length + 1) * 16) + 'px';
});
betInput.dispatchEvent(new Event('input')); // Set initial width