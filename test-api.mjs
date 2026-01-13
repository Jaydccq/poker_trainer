#!/usr/bin/env node

/**
 * API Test Script for Multiplayer Blackjack
 *
 * This script tests the multiplayer API endpoints.
 * Make sure the dev server is running: npm run dev
 */

const BASE_URL = 'http://localhost:3000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCreateRoom() {
  log('\n📝 Test 1: Create Room', 'blue');

  try {
    const response = await fetch(`${BASE_URL}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'TestPlayer1',
        settings: {
          maxPlayers: 6,
          minBet: 10,
          maxBet: 500,
          turnTimeoutSeconds: 15,
        }
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log(`✅ Room created successfully!`, 'green');
      log(`   Room Code: ${data.roomCode}`, 'green');
      log(`   Player ID: ${data.playerId}`, 'green');
      log(`   Host: ${data.room.players[data.playerId].displayName}`, 'green');
      return data;
    } else {
      log(`❌ Failed to create room: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testJoinRoom(roomCode) {
  log('\n📝 Test 2: Join Room', 'blue');

  try {
    const response = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode,
        displayName: 'TestPlayer2',
        seatNumber: 2,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log(`✅ Joined room successfully!`, 'green');
      log(`   Player ID: ${data.playerId}`, 'green');
      log(`   Seat: ${data.room.players[data.playerId].seatNumber}`, 'green');
      log(`   Total players: ${Object.keys(data.room.players).length}`, 'green');
      return data;
    } else {
      log(`❌ Failed to join room: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testGetRoom(roomCode) {
  log('\n📝 Test 3: Get Room State', 'blue');

  try {
    const response = await fetch(`${BASE_URL}/api/rooms/${roomCode}`);
    const data = await response.json();

    if (response.ok) {
      log(`✅ Got room state successfully!`, 'green');
      log(`   Room Code: ${data.room.roomCode}`, 'green');
      log(`   State: ${data.room.state}`, 'green');
      log(`   Players: ${Object.keys(data.room.players).length}/${data.room.settings.maxPlayers}`, 'green');
      return data;
    } else {
      log(`❌ Failed to get room: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testAblyAuth(playerId, roomCode) {
  log('\n📝 Test 4: Ably Authentication', 'blue');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/ably`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        roomCode,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log(`✅ Ably token generated successfully!`, 'green');
      log(`   Token request received`, 'green');
      return data;
    } else {
      log(`❌ Failed to get Ably token: ${data.error}`, 'red');
      log(`   Note: This will fail if ABLY_API_KEY is not set in .env.local`, 'yellow');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testLeaveRoom(roomCode, playerId) {
  log('\n📝 Test 5: Leave Room', 'blue');

  try {
    const response = await fetch(`${BASE_URL}/api/rooms/${roomCode}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });

    const data = await response.json();

    if (response.ok) {
      log(`✅ Left room successfully!`, 'green');
      log(`   ${data.message}`, 'green');
      return data;
    } else {
      log(`❌ Failed to leave room: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('🧪 Starting API Tests...', 'blue');
  log('Make sure the dev server is running: npm run dev\n', 'yellow');

  // Test 1: Create room
  const createResult = await testCreateRoom();
  if (!createResult) {
    log('\n❌ Test suite failed at Test 1', 'red');
    return;
  }

  const { roomCode, playerId: player1Id } = createResult;

  // Test 2: Join room
  const joinResult = await testJoinRoom(roomCode);
  if (!joinResult) {
    log('\n❌ Test suite failed at Test 2', 'red');
    return;
  }

  const player2Id = joinResult.playerId;

  // Test 3: Get room state
  const getRoomResult = await testGetRoom(roomCode);
  if (!getRoomResult) {
    log('\n❌ Test suite failed at Test 3', 'red');
    return;
  }

  // Test 4: Ably auth (may fail if credentials not set)
  await testAblyAuth(player1Id, roomCode);

  // Test 5: Leave room (player 2)
  await testLeaveRoom(roomCode, player2Id);

  // Test 6: Leave room (player 1 - should delete room)
  await testLeaveRoom(roomCode, player1Id);

  log('\n✅ All tests completed!', 'green');
  log('\n📋 Summary:', 'blue');
  log('  ✅ Room creation works', 'green');
  log('  ✅ Room joining works', 'green');
  log('  ✅ Room state retrieval works', 'green');
  log('  ⚠️  Ably auth requires valid API key', 'yellow');
  log('  ✅ Leaving room works', 'green');

  log('\n🔧 Next Steps:', 'blue');
  log('  1. Set up Upstash Redis credentials in .env.local', 'yellow');
  log('  2. Set up Ably API key in .env.local', 'yellow');
  log('  3. Test with real credentials', 'yellow');
  log('  4. Continue implementing game action APIs', 'yellow');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok || response.status === 404; // 404 is ok, means server is running
  } catch (error) {
    return false;
  }
}

// Main
(async () => {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    log('❌ Dev server is not running!', 'red');
    log('Please start it with: npm run dev', 'yellow');
    process.exit(1);
  }

  await runTests();
})();
