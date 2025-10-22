# 🏭 ReFactory

**A factory automation programming game where you write Python code to control robots and optimize production chains.**

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

## 🎮 About

ReFactory is an idle programming game that teaches Python through interactive gameplay. Instead of traditional farming mechanics, you're programming a swarm of robots to automate an ever-expanding factory floor. Your code runs in real-time using Pyodide (Python in the browser), and you can see your functions execute as robots carry out your instructions.

### Key Features

- **🐍 Python Programming** - Write real Python code that executes in your browser
- **📚 Interactive Tutorial** - Learn through hands-on coding challenges with immediate feedback
- **⚡ Energy System** - Optimize your code for efficiency - wasteful code drains power!
- **🤖 Real-time Execution** - Watch your robots execute your code live on the factory floor
- **🎨 Isometric Factory View** - Beautiful canvas-rendered factory with robots, resources, and machines
- **💾 Auto-save** - Your progress is automatically saved to local storage
- **🎯 Progressive Gameplay** - Start simple, unlock complex production chains and departments

## 🚀 Getting Started

Not looking to contribute? Just want to play and optimize to the top of the leaderboard?
https://refactory-swart.vercel.app/

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd refactory

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173` to start playing!

## 🎓 How to Play

### Tutorial

When you first launch the game, you'll go through an interactive tutorial that teaches you:

1. **Moving Robots** - Use `robot.move_to(x, y)` to position your robots
2. **Finding Resources** - Scan for nearby resources with `robot.get_nearby_resources(radius)`
3. **Collecting Resources** - Pick up resources with `robot.pickup(resource)`
4. **Automation** - Build loops and conditionals to automate production

### Python API Reference

Each robot has access to these functions:

```python
# Movement
robot.move_to(x, y)                    # Move to coordinates (x, y)
robot.get_position()                    # Get current position

# Resources
robot.get_nearby_resources(radius)      # Find resources within radius
robot.pickup(resource)                  # Pick up a resource
robot.get_inventory()                   # Check what you're carrying

# Machines
robot.get_nearby_machines(radius)       # Find machines within radius
robot.dropoff(machine)                  # Drop resources at a machine

# Status
robot.get_status()                      # Returns: 'idle', 'moving', 'working', or 'error'
robot.get_energy()                      # Get robot's energy level
```

### Example Code

Here's a basic automation script:

```python
# Get robot status
status = robot.get_status()

# Only act when idle
if status == "idle":
    # Find nearby resources
    resources = robot.get_nearby_resources(200)

    # Check inventory
    inventory = robot.get_inventory()

    # If we found resources and aren't carrying anything
    if len(resources) > 0 and inventory["type"] is None:
        # Get the first resource
        resource = resources[0]

        # Move to it
        robot.move_to(resource["position"]["x"], resource["position"]["y"])

        # Pick it up
        robot.pickup(resource)
```

## 🛠️ Technical Stack

- **Frontend**: SvelteKit 5 (Runes mode)
- **Python Runtime**: Pyodide (Python in WebAssembly)
- **Rendering**: HTML5 Canvas
- **State Management**: Svelte 5 reactive stores
- **Styling**: Scoped CSS

## 📁 Project Structure

```
refactory/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte components
│   │   │   ├── CodeEditor.svelte
│   │   │   ├── FactoryCanvas.svelte
│   │   │   ├── GameHUD.svelte
│   │   │   ├── GameControls.svelte
│   │   │   └── InteractiveTutorial.svelte
│   │   ├── engine/           # Game logic
│   │   │   ├── gameLoop.svelte.ts
│   │   │   ├── pythonExecutor.ts
│   │   │   ├── robotController.ts
│   │   │   └── machineController.ts
│   │   ├── stores/           # State management
│   │   │   └── gameState.svelte.ts
│   │   └── types/            # TypeScript types
│   │       └── game.ts
│   └── routes/               # SvelteKit routes
│       └── +page.svelte
├── static/                   # Static assets
└── package.json
```

## 🎯 Game Mechanics

### Energy System
Every action costs energy:
- Function calls: 0.01 energy
- Movement: 0.1 energy per move command
- Picking up resources: 0.5 energy
- Dropping off resources: 0.5 energy

Energy regenerates slowly over time. Write efficient code to maximize productivity!

### Resources
- **Iron Ore** ⚙️ - Basic metal resource
- **Copper Ore** 🟠 - Electrical component resource
- **Circuit Boards** 💾 - Advanced manufactured goods

### Robot States
- `idle` - Ready for new commands
- `moving` - Traveling to target position
- `working` - Executing a task
- `error` - Something went wrong (check error message)

## 🔧 Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run check
```

## 🗺️ Roadmap

Future features planned:
- ✅ Python programming interface
- ✅ Interactive tutorial system
- ⬜ Multiple robot support
- ⬜ Machine crafting system
- ⬜ Department unlocks (Electronics, Textiles, Food Processing)
- ⬜ Profiler/heat map for code optimization
- ⬜ Multiplayer leaderboards
- ⬜ Code sharing via URL
- ⬜ Version control features (git-like)
- ⬜ Worker threads for parallel processing
- ⬜ PWA support for offline play

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using SvelteKit and Python**
