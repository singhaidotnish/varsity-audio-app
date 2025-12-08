// backend/services/tts.js
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');

// Initialize TTS client
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, '..', 'google-credentials.json')
});

async function synthesizeAudio({ text, voiceName = 'en-US-Standard-C' }) {
  try {
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { 
        languageCode: 'en-US', 
        name: voiceName 
      },
      audioConfig: { 
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0
      },
    });
    
    return Buffer.from(response.audioContent, 'base64');
  } catch (error) {
    console.error('TTS Error:', error);
    throw new Error('Failed to synthesize audio');
  }
}

module.exports = { synthesizeAudio };