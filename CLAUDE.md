# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Flappy Bird clone - a client-only web-based game built with vanilla JavaScript, HTML5 Canvas, and CSS.

## Tech Stack

- **HTML5 Canvas** - For rendering game graphics
- **Vanilla JavaScript** - For game logic (no frameworks)
- **CSS** - For styling and layout
- No build tools or dependencies required

## Development Commands

This is a client-only project with no build process:

- Open `index.html` in a web browser to run the game
- Use Live Server extension in VS Code for development with auto-reload
- No package manager needed (pure vanilla JS)

## Code Style

- Do NOT use semicolons at the end of lines in JavaScript
- Use modern ES6+ JavaScript features
- Keep functions small and focused
- Use descriptive variable names

## Architecture Notes

### Project Structure
```
flappybird/
├── index.html          # Main HTML file with canvas element
├── style.css           # Game styling and layout
├── game.js             # Main game logic
├── assets/             # Game assets directory
│   ├── images/         # Sprites and backgrounds
│   └── sounds/         # Sound effects
└── CLAUDE.md           # This file
```

### Core Game Components

1. **Game Loop** - Uses requestAnimationFrame for smooth 60fps gameplay
2. **Bird Physics** - Gravity simulation and jump mechanics
3. **Pipe System** - Procedural generation and movement
4. **Collision Detection** - Rectangle-based collision between bird and pipes
5. **Score System** - Points awarded for passing pipes
6. **Game States** - Start screen, playing, and game over states

### Key Game Parameters
- Canvas size: 400x600 pixels (portrait orientation)
- Gravity: 0.5 pixels per frame²
- Jump velocity: -8 pixels per frame
- Pipe gap: 150 pixels
- Pipe speed: 2 pixels per frame

## Implementation Steps (Test-Driven Development)

### Phase 1: Basic Setup and Canvas
1. Create index.html with basic HTML structure
2. Add canvas element with id and dimensions
3. Create style.css with basic page styling
4. Style canvas with border and center alignment
5. Create game.js and link to HTML
6. Get canvas context and test with simple rectangle

### Phase 2: Game Loop Foundation
7. Create game variables (canvas dimensions, game state)
8. Implement basic game loop with requestAnimationFrame
9. Add FPS counter for performance testing

### Phase 3: Bird Implementation
10. Create bird object with position properties
11. Draw bird as simple circle/rectangle
12. Add gravity to bird (velocity and acceleration)
13. Implement bird jump on spacebar/click
14. Add bird rotation based on velocity
15. Create ground with collision detection
16. Add ceiling boundary check

### Phase 4: Pipe System
17. Create pipe object structure
18. Draw single pipe pair (top and bottom)
19. Implement pipe movement (left to right)
20. Create pipe array and spawning system
21. Add pipe removal when off-screen
22. Randomize pipe gap positions

### Phase 5: Collision and Scoring
23. Implement bird-pipe collision detection
24. Add score variable and display
25. Increment score when passing pipes

### Phase 6: Game States
26. Create game state enum (menu, playing, gameover)
27. Implement start screen with instructions
28. Add game over screen with score display
29. Implement restart functionality

### Phase 7: Visual Polish
30. Add background color/gradient
31. Create simple cloud sprites
32. Add parallax background scrolling
33. Design bird sprite or use CSS shapes
34. Style pipes with gradients
35. Add death animation for bird

### Phase 8: Advanced Features
36. Implement high score tracking (localStorage)
37. Add sound effect system
38. Create jump sound effect
39. Add score sound effect
40. Add collision/death sound
41. Optimize render performance
42. Add mobile touch support
43. Test on different screen sizes
44. Add difficulty progression

## Testing Approach
- Each step should be independently testable
- Use console.log() for debugging game state
- Test in browser console with game object exposed
- Visual testing by rendering each component separately
- Performance testing with FPS counter

## Project Collaboration Notes
- 앞으로 기능 구현할 때는 너가 구현하고, 내가 테스트하고 Okay하면 다음 단계로 넘어갈꺼야.

## Development Workflow
- 이제는 단계별 구현, 테스트를 계속 반복해줘. 중요 Phase에서만 멈춰서 사용자의 피드백을 받아줘

## Testing Recommendations
- **테스트 전략**
  - Phase 별로 테스트하지 말고, 각 작은 단계별로 테스트해줘.