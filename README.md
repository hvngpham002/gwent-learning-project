# Gwent Card Game - Learning Project 🎮

A React-based implementation of the card game Gwent, inspired by The Witcher 3: Wild Hunt. This project serves as an educational exercise in modern web development and game logic implementation.

## ⚠️ Important Disclaimer

This is a non-commercial fan project created solely for educational purposes and portfolio demonstration:
- Not affiliated with CD PROJEKT RED
- All Witcher-related intellectual property belongs to CD PROJEKT RED
- Not for commercial use
- Created for learning and portfolio demonstration only

## ✨ Features

### 🎲 Game Mechanics
* Complete implementation of basic Gwent gameplay rules
* AI opponent with strategic decision-making
* Weather effects system
* Card abilities (Spy, Tight Bond, Morale Boost, etc.)
* Multiple factions (Northern Realms, Nilfgaard)

### ⚛️ Modern React Architecture
* Built with Vite for fast development and optimized builds
* TypeScript for type safety and better development experience
* Component-based architecture with custom hooks
* State management using React hooks and context
* Proper separation of concerns (game logic, UI, AI)

### 🎨 UI/UX Features
* Responsive design that adapts to screen size
* Interactive card placement and selection
* Visual feedback for game state changes
* Smooth animations for card movements
* Faction-specific styling and theming

## 🛠️ Technologies Used

### Core
* React 18
* TypeScript
* Vite
* SWC

### Styling
* CSS Modules
* Tailwind CSS for utility classes
* Styled Components for dynamic styling

### Development Tools
* ESLint with TypeScript support
* Path aliases for clean imports
* Modern JavaScript features (ES2022+)

## 🎯 Design Patterns & Architecture

### React Patterns
* Custom hooks for complex logic (useGameLogic, useAI)
* Component composition for reusability
* Controlled components for form handling
* Error boundaries for graceful error handling

### Game Logic Patterns
* State machine for game flow
* Strategy pattern for AI decision making
* Observer pattern for game events
* Factory pattern for card creation

### Code Organization
```
├── src/
│   ├── components/     # React components
│   │   ├── card/      # Card-related components
│   │   ├── game/      # Game management components
│   │   └── player/    # Player-related components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── styles/        # Global styles and CSS modules
│   └── ai/            # AI strategy implementation
```

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## 🧪 Technical Highlights

### AI Implementation
* Multi-strategy decision making
* Card value evaluation system
* Situational awareness for weather effects
* Adaptive play style based on game state

### Game Logic
* Comprehensive rule enforcement
* Special card ability handling
* Score calculation system
* Round management

### Performance Optimizations
* Efficient card rendering
* Memoization of expensive calculations
* Optimized state updates
* Proper React reconciliation usage

## 📄 License

This project is licensed under MIT for the codebase. All Witcher-related content, including card names, descriptions, and game mechanics, are intellectual property of CD PROJEKT RED.

## 🙏 Acknowledgements

* CD PROJEKT RED for creating The Witcher series and the original Gwent mini-game
* React and Vite communities for excellent documentation and tools
* TypeScript team for providing great type safety tools
* All contributors and reviewers

## 📫 Contact

Viet Hung Pham - hung.v.pham002@gmail.com

Project Link: [[Repository URL](https://github.com/HungVPham/gwent-learning-project)]