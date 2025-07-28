// Flappy Bird Game
console.log('Game.js loaded successfully!')

// Get canvas and context
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

// Game variables
const CANVAS_WIDTH = canvas.width
const CANVAS_HEIGHT = canvas.height
const GRAVITY = 0.4
const JUMP_VELOCITY = -8
const BASE_PIPE_SPEED = 2
const BASE_PIPE_GAP = 150
const MIN_PIPE_GAP = 120
const PIPE_WIDTH = 80
const GROUND_HEIGHT = 50
const DIFFICULTY_INCREASE_INTERVAL = 5 // Increase difficulty every 5 points

// Dynamic difficulty variables
let pipeSpeed = BASE_PIPE_SPEED
let pipeGap = BASE_PIPE_GAP

// Game state
let gameState = 'menu' // menu, playing, gameover
let score = 0
let highScore = 0
let frameCount = 0
let debugMode = false // Toggle with 'D' key

// FPS tracking
let lastTime = 0
let fps = 0

// Bird object
const bird = {
    x: 100,
    y: CANVAS_HEIGHT / 3,
    width: 30,
    height: 30,
    velocity: 0,
    rotation: 0,
    isDead: false,
    deathAnimation: 0  // Animation progress (0-1)
}

// Pipes array
let pipes = []

// Clouds array
let clouds = []

// Ground offset for scrolling
let groundOffset = 0

// Sound system
let audioContext = null
let soundEnabled = true

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        console.log('Audio context initialized')
    } catch (e) {
        console.error('Web Audio API not supported:', e)
        soundEnabled = false
    }
}

// Play sound effect
function playSound(type) {
    if (!soundEnabled || !audioContext) return
    
    const now = audioContext.currentTime
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    switch(type) {
        case 'jump':
            // Jump sound - quick chirp
            oscillator.frequency.setValueAtTime(400, now)
            oscillator.frequency.linearRampToValueAtTime(600, now + 0.1)
            gainNode.gain.setValueAtTime(0.3, now)
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1)
            oscillator.start(now)
            oscillator.stop(now + 0.1)
            break
            
        case 'score':
            // Score sound - pleasant ding
            oscillator.frequency.setValueAtTime(523.25, now) // C5
            oscillator.frequency.linearRampToValueAtTime(659.25, now + 0.1) // E5
            gainNode.gain.setValueAtTime(0.3, now)
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2)
            oscillator.start(now)
            oscillator.stop(now + 0.2)
            break
            
        case 'death':
            // Death sound - descending tone
            oscillator.frequency.setValueAtTime(300, now)
            oscillator.frequency.linearRampToValueAtTime(100, now + 0.3)
            gainNode.gain.setValueAtTime(0.4, now)
            gainNode.gain.linearRampToValueAtTime(0, now + 0.3)
            oscillator.type = 'square'
            oscillator.start(now)
            oscillator.stop(now + 0.3)
            break
    }
}

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('flappyBirdHighScore')
    if (saved) {
        highScore = parseInt(saved)
    }
    console.log('High score loaded:', highScore)
}

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score
        localStorage.setItem('flappyBirdHighScore', highScore.toString())
        console.log('New high score saved:', highScore)
        return true // New high score
    }
    return false // Not a new high score
}

// Initialize high score
loadHighScore()

console.log('Game variables initialized:')
console.log(`Canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`)
console.log(`Game state: ${gameState}`)

// Update bird physics
function updateBird() {
    if (gameState === 'playing') {
        // Apply gravity
        bird.velocity += GRAVITY
        bird.y += bird.velocity
        
        // Update rotation based on velocity
        bird.rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5)
        
        // Ground collision
        if (bird.y + bird.height / 2 > CANVAS_HEIGHT - GROUND_HEIGHT) {
            bird.y = CANVAS_HEIGHT - GROUND_HEIGHT - bird.height / 2
            bird.velocity = 0
            gameState = 'gameover'
            bird.isDead = true
            saveHighScore()
            playSound('death')
            console.log('Game Over - Hit ground')
        }
        
        // Ceiling collision
        if (bird.y - bird.height / 2 < 0) {
            bird.y = bird.height / 2
            bird.velocity = 0
        }
        
        // Pipe collision
        checkPipeCollision()
    } else if (gameState === 'gameover' && bird.isDead) {
        // Death animation - continue falling with rotation
        if (bird.y + bird.height / 2 < CANVAS_HEIGHT - GROUND_HEIGHT) {
            bird.velocity += GRAVITY * 1.5  // Faster fall during death
            bird.y += bird.velocity
            bird.rotation += 0.15  // Spin during death
        }
        
        // Update death animation progress
        if (bird.deathAnimation < 1) {
            bird.deathAnimation += 0.05
        }
    }
}

// Check collision with pipes
function checkPipeCollision() {
    // Different hitbox reductions for top and bottom
    const topReduction = 8     // More forgiving for top (reduce strict upper area)
    const bottomReduction = 2  // Less forgiving for bottom (make it stricter)
    const sideReduction = 5    // Keep sides the same
    
    pipes.forEach(pipe => {
        // Check if bird is horizontally aligned with pipe (with reduced hitbox)
        if (bird.x + bird.width / 2 - sideReduction > pipe.x && 
            bird.x - bird.width / 2 + sideReduction < pipe.x + pipe.width) {
            
            // Check collision with top pipe (more forgiving)
            if (bird.y - bird.height / 2 + topReduction < pipe.gapY) {
                gameState = 'gameover'
                bird.isDead = true
                saveHighScore()
                playSound('death')
                console.log('Game Over - Hit top pipe')
            }
            
            // Check collision with bottom pipe (less forgiving)
            if (bird.y + bird.height / 2 - bottomReduction > pipe.gapY + pipeGap) {
                gameState = 'gameover'
                bird.isDead = true
                saveHighScore()
                playSound('death')
                console.log('Game Over - Hit bottom pipe')
            }
        }
    })
}

// Draw bird function
function drawBird() {
    ctx.save()
    
    // Move to bird position (bird.x and bird.y are the center)
    ctx.translate(bird.x, bird.y)
    
    // Apply rotation
    ctx.rotate(bird.rotation)
    
    // Apply death animation effects
    if (bird.isDead && bird.deathAnimation > 0) {
        // Fade out effect
        ctx.globalAlpha = Math.max(0.3, 1 - bird.deathAnimation * 0.5)
        
        // Scale down slightly
        const scale = 1 - bird.deathAnimation * 0.2
        ctx.scale(scale, scale)
    }
    
    // Draw bird body (ellipse shape)
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2.2, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw wing
    ctx.fillStyle = '#FFA500'
    ctx.beginPath()
    ctx.ellipse(-bird.width / 4, 0, bird.width / 3, bird.height / 3, -0.3, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw eye background (white)
    ctx.fillStyle = '#FFF'
    ctx.beginPath()
    ctx.arc(bird.width / 4, -bird.height / 4, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw eye pupil
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(bird.width / 4 + 1, -bird.height / 4, 3, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw beak (upper)
    ctx.fillStyle = '#FF6347'
    ctx.beginPath()
    ctx.moveTo(bird.width / 2 - 2, -2)
    ctx.lineTo(bird.width / 2 + 10, 0)
    ctx.lineTo(bird.width / 2 - 2, 3)
    ctx.closePath()
    ctx.fill()
    
    // Draw beak (lower)
    ctx.fillStyle = '#CD5C5C'
    ctx.beginPath()
    ctx.moveTo(bird.width / 2 - 2, 3)
    ctx.lineTo(bird.width / 2 + 8, 3)
    ctx.lineTo(bird.width / 2 - 2, 6)
    ctx.closePath()
    ctx.fill()
    
    ctx.restore()
    
    // Draw debug hitbox
    if (debugMode) {
        const topReduction = 8
        const bottomReduction = 2
        const sideReduction = 5
        
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        
        // Draw actual hitbox
        ctx.strokeRect(
            bird.x - bird.width / 2 + sideReduction,
            bird.y - bird.height / 2 + topReduction,
            bird.width - sideReduction * 2,
            bird.height - topReduction - bottomReduction
        )
        
        // Draw bird center
        ctx.fillStyle = 'red'
        ctx.fillRect(bird.x - 2, bird.y - 2, 4, 4)
        
        ctx.setLineDash([])
    }
}

// Draw background with gradient
function drawBackground() {
    // Create gradient from light blue to slightly darker blue
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
    gradient.addColorStop(0, '#87CEEB')  // Sky blue at top
    gradient.addColorStop(0.7, '#98D8E8') // Lighter blue
    gradient.addColorStop(1, '#B0E0E6')   // Powder blue at bottom
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
}

// Create cloud
function createCloud() {
    const layer = Math.random() < 0.5 ? 0 : 1 // Two layers for parallax
    return {
        x: CANVAS_WIDTH + Math.random() * 100,
        y: Math.random() * (CANVAS_HEIGHT / 2 - 50) + 20,
        width: 60 + Math.random() * 40,
        height: 30 + Math.random() * 20,
        speed: layer === 0 ? 0.2 + Math.random() * 0.1 : 0.4 + Math.random() * 0.2, // Different speeds for layers
        layer: layer,
        opacity: layer === 0 ? 0.4 : 0.8 // Back clouds are more transparent
    }
}

// Initialize clouds
function initClouds() {
    clouds = []
    // Create initial clouds with different layers
    for (let i = 0; i < 6; i++) {
        const cloud = createCloud()
        cloud.x = Math.random() * CANVAS_WIDTH
        clouds.push(cloud)
    }
}

// Update clouds
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed
    })
    
    // Remove clouds that are off-screen
    clouds = clouds.filter(cloud => cloud.x + cloud.width > -50)
    
    // Add new clouds
    if (clouds.length < 6 && Math.random() < 0.02) {
        clouds.push(createCloud())
    }
}

// Draw single cloud
function drawCloud(x, y, width, height, opacity) {
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    
    // Draw cloud using circles for fluffy effect
    const circleCount = 5
    const circleRadius = height / 2
    
    for (let i = 0; i < circleCount; i++) {
        const offsetX = (width / circleCount) * i
        const offsetY = Math.sin(i * 0.5) * 5
        ctx.beginPath()
        ctx.arc(x + offsetX, y + offsetY, circleRadius, 0, Math.PI * 2)
        ctx.fill()
    }
    
    // Draw base rectangle to fill gaps
    ctx.fillRect(x, y - height / 4, width - circleRadius, height / 2)
}

// Draw all clouds
function drawClouds() {
    // Draw clouds in layers for parallax effect
    // First draw back layer (layer 0)
    clouds.filter(cloud => cloud.layer === 0).forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.width, cloud.height, cloud.opacity)
    })
    
    // Then draw front layer (layer 1)
    clouds.filter(cloud => cloud.layer === 1).forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.width, cloud.height, cloud.opacity)
    })
}

// Draw ground
function drawGround() {
    // Update ground offset for scrolling effect
    if (gameState === 'playing') {
        groundOffset -= pipeSpeed
        if (groundOffset <= -50) {
            groundOffset = 0
        }
    }
    
    // Draw ground base
    ctx.fillStyle = '#8B7355'
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT)
    
    // Draw grass with pattern for scrolling effect
    ctx.fillStyle = '#228B22'
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 10)
    
    // Draw ground details for parallax effect
    ctx.fillStyle = '#7B6F43'
    for (let i = 0; i < CANVAS_WIDTH / 50 + 2; i++) {
        const x = i * 50 + groundOffset
        ctx.fillRect(x, CANVAS_HEIGHT - GROUND_HEIGHT + 10, 30, 5)
        ctx.fillRect(x + 10, CANVAS_HEIGHT - GROUND_HEIGHT + 20, 20, 3)
    }
}

// Draw score
function drawScore() {
    if (gameState === 'playing') {
        ctx.fillStyle = '#FFF'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        
        // Draw score with stroke for better visibility
        ctx.strokeText(score.toString(), CANVAS_WIDTH / 2, 50)
        ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 50)
    }
}

// Draw start screen
function drawStartScreen() {
    // Draw title
    ctx.fillStyle = '#FFF'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    
    ctx.strokeText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3)
    ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3)
    
    // Draw high score if exists
    if (highScore > 0) {
        ctx.font = '20px Arial'
        ctx.fillStyle = '#FFD700'
        ctx.strokeText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 50)
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 50)
    }
    
    // Draw instructions
    ctx.fillStyle = '#FFF'
    ctx.font = '24px Arial'
    const startText = 'ontouchstart' in window ? 'Tap to Start' : 'Press SPACE or Click to Start'
    ctx.strokeText(startText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    ctx.fillText(startText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    
    // Draw controls
    ctx.font = '18px Arial'
    const controlText = 'ontouchstart' in window ? 'Tap to Jump' : 'Press SPACE or Click to Jump'
    ctx.strokeText(controlText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    ctx.fillText(controlText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
}

// Draw game over screen
function drawGameOverScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw game over text
    ctx.fillStyle = '#FFF'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    
    ctx.strokeText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3)
    ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3)
    
    // Draw score
    ctx.font = '32px Arial'
    ctx.strokeText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
    
    // Draw high score
    const isNewHighScore = score === highScore && score > 0
    if (isNewHighScore) {
        ctx.fillStyle = '#FFD700'  // Gold color for new high score
        ctx.font = 'bold 28px Arial'
        ctx.strokeText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        ctx.fillText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    } else {
        ctx.fillStyle = '#FFF'
        ctx.font = '24px Arial'
        ctx.strokeText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }
    
    // Draw restart instruction
    ctx.fillStyle = '#FFF'
    ctx.font = '24px Arial'
    const restartText = 'ontouchstart' in window ? 'Tap to Restart' : 'Press SPACE or Click to Restart'
    ctx.strokeText(restartText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
    ctx.fillText(restartText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
}

// Create pipe
function createPipe() {
    const gapY = Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - pipeGap - 100) + 50
    return {
        x: CANVAS_WIDTH,
        gapY: gapY,
        width: PIPE_WIDTH,
        passed: false
    }
}

// Update difficulty based on score
function updateDifficulty() {
    // Calculate difficulty level based on score
    const difficultyLevel = Math.floor(score / DIFFICULTY_INCREASE_INTERVAL)
    
    // Increase pipe speed (max 2x base speed)
    pipeSpeed = Math.min(BASE_PIPE_SPEED + (difficultyLevel * 0.3), BASE_PIPE_SPEED * 2)
    
    // Decrease pipe gap (min MIN_PIPE_GAP)
    pipeGap = Math.max(BASE_PIPE_GAP - (difficultyLevel * 5), MIN_PIPE_GAP)
    
    console.log(`Difficulty Level: ${difficultyLevel}, Speed: ${pipeSpeed}, Gap: ${pipeGap}`)
}

// Update pipes
function updatePipes() {
    if (gameState === 'playing') {
        // Move pipes
        pipes.forEach(pipe => {
            pipe.x -= pipeSpeed
            
            // Check if bird passed the pipe
            if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                pipe.passed = true
                score++
                playSound('score')
                console.log('Score:', score)
                
                // Update difficulty when score increases
                updateDifficulty()
            }
        })
        
        // Add new pipe when the last pipe has moved enough
        if (pipes.length === 0 || pipes[pipes.length - 1].x < CANVAS_WIDTH - 250) {
            pipes.push(createPipe())
        }
        
        // Remove pipes that are off-screen
        pipes = pipes.filter(pipe => {
            if (pipe.x + pipe.width <= -50) {
                // Clean up gradient cache for removed pipes
                pipeGradientCache.delete(pipe.x)
                return false
            }
            return true
        })
    }
}

// Cache for pipe gradients
const pipeGradientCache = new Map()

// Draw pipes
function drawPipes() {
    pipes.forEach(pipe => {
        // Use cached gradient or create new one
        let gradients = pipeGradientCache.get(pipe.x)
        if (!gradients) {
            // Create gradient for pipes
            const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0)
            pipeGradient.addColorStop(0, '#74C365')    // Light green on left
            pipeGradient.addColorStop(0.5, '#228B22')  // Medium green in middle
            pipeGradient.addColorStop(1, '#1F5F1F')    // Dark green on right
            
            // Create gradient for pipe caps
            const capGradient = ctx.createLinearGradient(pipe.x - 5, 0, pipe.x + pipe.width + 5, 0)
            capGradient.addColorStop(0, '#5FA052')
            capGradient.addColorStop(0.5, '#006400')
            capGradient.addColorStop(1, '#003300')
            
            gradients = { pipeGradient, capGradient }
            pipeGradientCache.set(pipe.x, gradients)
        }
        
        const { pipeGradient, capGradient } = gradients
        
        // Top pipe
        ctx.fillStyle = pipeGradient
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY)
        
        // Top pipe highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(pipe.x + 5, 0, 10, pipe.gapY)
        
        // Top pipe cap
        ctx.fillStyle = capGradient
        ctx.fillRect(pipe.x - 5, pipe.gapY - 30, pipe.width + 10, 30)
        
        // Top pipe cap highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(pipe.x, pipe.gapY - 28, pipe.width, 5)
        
        // Bottom pipe
        ctx.fillStyle = pipeGradient
        ctx.fillRect(pipe.x, pipe.gapY + pipeGap, pipe.width, CANVAS_HEIGHT - pipe.gapY - pipeGap - GROUND_HEIGHT)
        
        // Bottom pipe highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(pipe.x + 5, pipe.gapY + pipeGap + 30, 10, CANVAS_HEIGHT - pipe.gapY - pipeGap - GROUND_HEIGHT - 30)
        
        // Bottom pipe cap
        ctx.fillStyle = capGradient
        ctx.fillRect(pipe.x - 5, pipe.gapY + pipeGap, pipe.width + 10, 30)
        
        // Bottom pipe cap highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(pipe.x, pipe.gapY + pipeGap + 5, pipe.width, 5)
        
        // Draw debug info
        if (debugMode) {
            // Draw gap boundaries
            ctx.strokeStyle = 'blue'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            
            // Top gap line
            ctx.beginPath()
            ctx.moveTo(pipe.x, pipe.gapY)
            ctx.lineTo(pipe.x + pipe.width, pipe.gapY)
            ctx.stroke()
            
            // Bottom gap line
            ctx.beginPath()
            ctx.moveTo(pipe.x, pipe.gapY + pipeGap)
            ctx.lineTo(pipe.x + pipe.width, pipe.gapY + pipeGap)
            ctx.stroke()
            
            // Pipe edges
            ctx.strokeStyle = 'purple'
            ctx.strokeRect(pipe.x, 0, pipe.width, CANVAS_HEIGHT)
            
            ctx.setLineDash([])
        }
    })
}

// Performance optimization variables
let frameSkip = 0
const TARGET_FPS = 60
const FRAME_TIME = 1000 / TARGET_FPS

// Game loop
function gameLoop(currentTime) {
    // Calculate FPS and frame timing
    if (currentTime) {
        const deltaTime = currentTime - lastTime
        fps = Math.round(1000 / deltaTime)
        
        // Skip frame if running too fast
        if (deltaTime < FRAME_TIME * 0.8) {
            requestAnimationFrame(gameLoop)
            return
        }
        
        lastTime = currentTime
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw background gradient
    drawBackground()
    
    // Update and draw clouds
    updateClouds()
    drawClouds()
    
    // Draw FPS counter (update less frequently for performance)
    if (frameCount % 10 === 0) {
        ctx.fillStyle = '#000'
        ctx.font = '16px Arial'
        ctx.fillText(`FPS: ${fps}`, 10, 20)
    }
    
    // Draw debug info
    if (debugMode) {
        ctx.fillStyle = '#000'
        ctx.font = '14px Arial'
        ctx.fillText('DEBUG MODE (Press D to toggle)', 10, 40)
        ctx.fillText('Red box = Bird hitbox', 10, 60)
        ctx.fillText('Blue lines = Pipe gap boundaries', 10, 80)
        
        // Show hitbox dimensions
        const topReduction = 8
        const bottomReduction = 2
        const sideReduction = 5
        ctx.fillText(`Bird hitbox: ${bird.width - sideReduction * 2}x${bird.height - topReduction - bottomReduction}`, 10, 100)
        ctx.fillText(`Original bird: ${bird.width}x${bird.height}`, 10, 120)
    }
    
    // Draw sound status
    ctx.fillStyle = '#000'
    ctx.font = '14px Arial'
    ctx.fillText(`Sound: ${soundEnabled ? 'ON' : 'OFF'} (Press S to toggle)`, CANVAS_WIDTH - 150, 20)
    
    // Game state specific rendering
    if (gameState === 'menu') {
        // Draw ground and bird for menu
        drawBird()
        drawGround()
        drawStartScreen()
    } else if (gameState === 'playing') {
        // Update bird
        updateBird()
        
        // Update and draw pipes
        updatePipes()
        drawPipes()
        
        // Draw bird
        drawBird()
        
        // Draw ground
        drawGround()
        
        // Draw score
        drawScore()
    } else if (gameState === 'gameover') {
        // Draw static game state
        drawPipes()
        drawBird()
        drawGround()
        drawScore()
        drawGameOverScreen()
    }
    
    // Update frame count
    frameCount++
    
    // Request next frame
    requestAnimationFrame(gameLoop)
}

// Handle jump
function jump() {
    // Initialize audio on first user interaction
    if (!audioContext) {
        initAudio()
    }
    
    if (gameState === 'menu') {
        gameState = 'playing'
        score = 0
        pipes = []
        bird.y = CANVAS_HEIGHT / 3
        bird.velocity = 0
        bird.isDead = false
        bird.deathAnimation = 0
        bird.rotation = 0
        // Reset difficulty
        pipeSpeed = BASE_PIPE_SPEED
        pipeGap = BASE_PIPE_GAP
        console.log('Game started')
    } else if (gameState === 'playing') {
        bird.velocity = JUMP_VELOCITY
        playSound('jump')
    } else if (gameState === 'gameover') {
        // Reset game
        gameState = 'playing'
        score = 0
        pipes = []
        bird.y = CANVAS_HEIGHT / 3
        bird.velocity = 0
        bird.rotation = 0
        bird.isDead = false
        bird.deathAnimation = 0
        // Reset difficulty
        pipeSpeed = BASE_PIPE_SPEED
        pipeGap = BASE_PIPE_GAP
        console.log('Game restarted')
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault()
        jump()
    } else if (e.code === 'KeyD') {
        debugMode = !debugMode
        console.log('Debug mode:', debugMode)
    } else if (e.code === 'KeyS') {
        soundEnabled = !soundEnabled
        console.log('Sound:', soundEnabled ? 'ON' : 'OFF')
    }
})

canvas.addEventListener('click', jump)

// Touch event support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    jump()
})

// Prevent double-tap zoom on mobile
let lastTouchEnd = 0
document.addEventListener('touchend', (e) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
        e.preventDefault()
    }
    lastTouchEnd = now
}, false)

// Initialize clouds
initClouds()

// Start game loop
gameLoop()
console.log('Game loop started')

// Expose some functions for testing
if (window.location.protocol === 'file:') {
    window.updateDifficulty = updateDifficulty
    window.getCurrentDifficulty = () => ({ pipeSpeed, pipeGap, score })
}