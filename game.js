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
const PIPE_SPEED = 2
const PIPE_GAP = 150
const PIPE_WIDTH = 80
const GROUND_HEIGHT = 50

// Game state
let gameState = 'menu' // menu, playing, gameover
let score = 0
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
                console.log('Game Over - Hit top pipe')
            }
            
            // Check collision with bottom pipe (less forgiving)
            if (bird.y + bird.height / 2 - bottomReduction > pipe.gapY + PIPE_GAP) {
                gameState = 'gameover'
                bird.isDead = true
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
        groundOffset -= PIPE_SPEED
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
    
    // Draw instructions
    ctx.font = '24px Arial'
    ctx.strokeText('Press SPACE or Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    ctx.fillText('Press SPACE or Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    
    // Draw controls
    ctx.font = '18px Arial'
    ctx.strokeText('Press SPACE or Click to Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    ctx.fillText('Press SPACE or Click to Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
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
    ctx.strokeText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    
    // Draw restart instruction
    ctx.font = '24px Arial'
    ctx.strokeText('Press SPACE or Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
    ctx.fillText('Press SPACE or Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
}

// Create pipe
function createPipe() {
    const gapY = Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50
    return {
        x: CANVAS_WIDTH,
        gapY: gapY,
        width: PIPE_WIDTH,
        passed: false
    }
}

// Update pipes
function updatePipes() {
    if (gameState === 'playing') {
        // Move pipes
        pipes.forEach(pipe => {
            pipe.x -= PIPE_SPEED
            
            // Check if bird passed the pipe
            if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                pipe.passed = true
                score++
                console.log('Score:', score)
            }
        })
        
        // Add new pipe when the last pipe has moved enough
        if (pipes.length === 0 || pipes[pipes.length - 1].x < CANVAS_WIDTH - 250) {
            pipes.push(createPipe())
        }
        
        // Remove pipes that are off-screen
        pipes = pipes.filter(pipe => pipe.x + pipe.width > -50)
    }
}

// Draw pipes
function drawPipes() {
    pipes.forEach(pipe => {
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
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, pipe.width, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - GROUND_HEIGHT)
        
        // Bottom pipe highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(pipe.x + 5, pipe.gapY + PIPE_GAP + 30, 10, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - GROUND_HEIGHT - 30)
        
        // Bottom pipe cap
        ctx.fillStyle = capGradient
        ctx.fillRect(pipe.x - 5, pipe.gapY + PIPE_GAP, pipe.width + 10, 30)
        
        // Bottom pipe cap highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP + 5, pipe.width, 5)
        
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
            ctx.moveTo(pipe.x, pipe.gapY + PIPE_GAP)
            ctx.lineTo(pipe.x + pipe.width, pipe.gapY + PIPE_GAP)
            ctx.stroke()
            
            // Pipe edges
            ctx.strokeStyle = 'purple'
            ctx.strokeRect(pipe.x, 0, pipe.width, CANVAS_HEIGHT)
            
            ctx.setLineDash([])
        }
    })
}

// Game loop
function gameLoop(currentTime) {
    // Calculate FPS
    if (currentTime) {
        const deltaTime = currentTime - lastTime
        fps = Math.round(1000 / deltaTime)
        lastTime = currentTime
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw background gradient
    drawBackground()
    
    // Update and draw clouds
    updateClouds()
    drawClouds()
    
    // Draw FPS counter
    ctx.fillStyle = '#000'
    ctx.font = '16px Arial'
    ctx.fillText(`FPS: ${fps}`, 10, 20)
    
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
    if (gameState === 'menu') {
        gameState = 'playing'
        score = 0
        pipes = []
        bird.y = CANVAS_HEIGHT / 3
        bird.velocity = 0
        bird.isDead = false
        bird.deathAnimation = 0
        bird.rotation = 0
        console.log('Game started')
    } else if (gameState === 'playing') {
        bird.velocity = JUMP_VELOCITY
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
    }
})

canvas.addEventListener('click', jump)

// Initialize clouds
initClouds()

// Start game loop
gameLoop()
console.log('Game loop started')