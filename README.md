# Unicity Demo Engine

Welcome to the **Unicity Demo Engine**! This project serves as a framework for creating interactive, web-based demo applications for Unicity agents. The engine provides a flexible structure for easily building and extending games or other interactive demos with a focus on simplicity and real-time interactions. 

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Socket.IO** - Real-time, bidirectional communication
- **Pug** - Template engine
- **Bootstrap** - Frontend framework for responsive design


Uses JSON RPC cals to access the Unicity Consensus Layer and Unicity Proof Aggregation Layer.

## Getting Started

To run the Unicity Demo Engine locally, follow these steps:

Create a `.env` (or copy `.env-sample`) and configure

3. Create a `.env` file in the root directory:

```bash
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-session-secret-here
COOKIE_SECRET=your-cookie-secret-here
DEBUG=unicity:*
```
clone the repo, install node libraries and run 

```bash
git clone https://github.com/your-repo/unicity-demo-engine.git
cd unicity-demo-engine
npm install
npm start
```

Visit `http://localhost:3000` in your browser. 


`NODE_ENV=production` will take you to demos.unicity-labs.com


## Setting up a new demo

**Create a new route for your web page in** `routes/demoRouter.js`:

```javascript
router.get("/newdemo", (req, res) => {
    debugLog('Loading new demo page');
    res.render("newdemo");
});
```

**Create a new template in** `views/newdemo.pug`:

```pug
extends layout

block content
    div.container.mt-5
        h1.text-center.mb-4 New Demo
        div.game-container
            //- Demo-specific content
```


**Add client-side JavaScript in** `public/js/`:


```javascript
// public/js/newdemo-sock.js
document.addEventListener('DOMContentLoaded', () => {
    // Demo initialization code
});
```

**Add server-side game logic in**`app/newdemo.js` :

```
class NewDemoGame {
    constructor() {
        this.gameState = {
            // Initialize game state
        };
    }
}
```

**Update WebSocket handler in** `web-sockets/wsHandler.js`:

```
switch (data.gameType) {
	case 'playervModel':
		activeServer = PlayervModelServer;
      	break;
   ...
    case 'NewDemo':
        activeServer = NewDemoServer;
        break;
```










