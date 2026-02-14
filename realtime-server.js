const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const { CDL_TUTOR_PROMPT } = require('./prompts/system');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/realtime-api' });

wss.on('connection', (ws) => {
    console.log('--- RELAY: Client Connected ---');
    
    // Connect with minimal headers and standard model name
    const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1',
        },
    });

    openAiWs.on('open', () => {
        console.log('--- RELAY: Connected to OpenAI ---');
        
        // NO session.update yet - let's see if default session works
        console.log('Waiting for session.created from OpenAI...');
    });

    ws.on('message', (data) => {
        if (openAiWs.readyState === WebSocket.OPEN) {
            openAiWs.send(data.toString());
        }
    });

    openAiWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log('From OpenAI:', msg.type);
        
        if (msg.type === 'session.created') {
            console.log('Session created! Configuring...');
            openAiWs.send(JSON.stringify({
                type: 'session.update',
                session: {
                    instructions: CDL_TUTOR_PROMPT,
                    voice: 'alloy',
                    modalities: ["text", "audio"],
                    turn_detection: { type: "server_vad" }
                }
            }));
            
            // Manual trigger for first response
            openAiWs.send(JSON.stringify({
                type: 'response.create',
                response: {
                    instructions: "Joey is here. Give him a warm welcome as Red and ask if he's ready to start."
                }
            }));
        }

        if (msg.type === 'error') {
            console.error('OpenAI Error Details:', JSON.stringify(msg.error, null, 2));
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString());
        }
    });

    ws.on('close', () => {
        console.log('Client Disconnected');
        openAiWs.close();
    });
    
    openAiWs.on('close', () => {
        console.log('OpenAI Disconnected');
        ws.close();
    });
});

app.use(express.static('public'));
server.listen(3948, () => console.log('Realtime Relay on 3948 (Minimal Mode)'));
