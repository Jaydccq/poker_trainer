#!/usr/bin/env node

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://massive-kingfish-31121.upstash.io',
  token: 'AXmRAAIncDI3MTdmNzhhZmYxMmQ0YWFiYWQ5ZmRiYzgzZWUxYWY2NHAyMzExMjE'
});

async function testRedisStorage() {
  console.log('=== Testing Redis Storage ===\n');
  
  const testRoom = {
    roomCode: 'TEST',
    state: 'lobby',
    players: {}
  };
  
  console.log('1. Storing room with JSON.stringify...');
  await redis.set('room:TEST', JSON.stringify(testRoom), { ex: 3600 });
  console.log('   ✓ Stored\n');
  
  console.log('2. Retrieving with plain get()...');
  const resultAsString = await redis.get('room:TEST');
  console.log('   Type:', typeof resultAsString);
  console.log('   Value:', resultAsString);
  console.log('');
  
  console.log('3. Retrieving with plain get() (no generic)...');
  const resultPlain = await redis.get('room:TEST');
  console.log('   Type:', typeof resultPlain);
  console.log('   Value:', resultPlain);
  console.log('');
  
  console.log('4. Testing parse logic...');
  if (typeof resultPlain === 'object') {
    console.log('   ✓ Result is already an object!');
    console.log('   Room code:', resultPlain.roomCode);
  } else if (typeof resultPlain === 'string') {
    console.log('   ℹ Result is a string, needs parsing');
    const parsed = JSON.parse(resultPlain);
    console.log('   Room code:', parsed.roomCode);
  }
  
  console.log('\n✓ Test complete');
  process.exit(0);
}

testRedisStorage().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
