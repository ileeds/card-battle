# Card Battle Game

A real-time multiplayer card battle game built with Next.js, Socket.IO, and deployed on AWS App Runner.

## Game Rules

- 2-player game that lasts exactly 60 seconds
- Each player starts with 10 cards: 5×(1), 4×(5), 1×(10)
- Cards are automatically played every second from the top of your deck
- Points from played cards are added to your score
- 3 shop cards are always available for purchase
- Buy cards using your accumulated points
- Purchased cards go to your discard pile and get shuffled back when your deck runs out
- Player with the highest score after 60 seconds wins

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd card-battle
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in two browser tabs to test multiplayer functionality.

## Deployment on AWS

### Option 1: AWS App Runner (Recommended)

1. **Push your code to GitHub**:
   - Create a new repository on GitHub
   - Push all the code to your repository
   - Make sure the `apprunner.yaml` file is in the root directory

2. **Deploy using CloudFormation**:
   - Open the AWS CloudFormation console
   - Click "Create stack" → "With new resources"
   - Choose "Upload a template file" and upload `cloudformation-template.yaml`
   - Update the `GitHubRepository` parameter with your GitHub repository URL
   - Click through the wizard and create the stack

3. **Access your game**:
   - Once the stack is created, check the Outputs tab for the service URL
   - Your game will be available at the provided URL

### Option 2: Docker Deployment

1. **Build the Docker image**:
```bash
docker build -t card-battle .
```

2. **Run locally**:
```bash
docker run -p 8080:8080 card-battle
```

3. **Deploy to any cloud provider that supports Docker containers**

## File Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Card.tsx
│   └── GameBoard.tsx
├── hooks/
│   └── useSocket.ts
├── lib/
│   └── socket-server.ts
├── pages/api/
│   └── socket.ts
└── types/
    └── game.ts
```

## Key Features

- **Real-time multiplayer**: Socket.IO handles real-time communication
- **Automatic gameplay**: Cards are played automatically every second
- **Race condition protection**: Only one player can purchase each shop card
- **Responsive design**: Works on desktop and mobile
- **Simple deployment**: One-click AWS deployment via CloudFormation

## Environment Variables

The application uses these environment variables in production:

- `NODE_ENV=production`
- `PORT=8080` (for App Runner compatibility)

## Troubleshooting

**Game not connecting**: Make sure the Socket.IO server is properly initialized by visiting `/api/socket` first.

**Players can't join**: The game supports exactly 2 players. If someone disconnects during a game, the game will end automatically.

**Cards not updating**: The game state updates every second. If you're not seeing updates, check the browser console for WebSocket connection errors.

## Technical Notes

- Uses Next.js API routes for Socket.IO server
- Game state is stored in memory (resets on server restart)
- WebSocket connections handle all real-time updates
- Cards are shuffled using Fisher-Yates algorithm
- Race conditions are prevented through server-side validation