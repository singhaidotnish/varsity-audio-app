// backend/services/tts.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

// For Google Cloud TTS v6.x
let ttsClient = null;
try {
  // Check if we have Google credentials
  const credentialsPath = path.join(__dirname, '..', 'google-credentials.json');
  if (require('fs').existsSync(credentialsPath)) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    ttsClient = new textToSpeech.TextToSpeechClient({
      keyFilename: credentialsPath
    });
    console.log('✅ Google TTS client initialized');
  } else {
    console.warn('⚠️ Google credentials not found. TTS will use mock service.');
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Google TTS:', error.message);
}

class TTSService {
  constructor() {
    this.maxTextLength = 4500; // Google TTS limit
  }

  async convertTextToSpeech(text, chapterId, title) {
    try {
      console.log(`🎙️ Converting to audio: ${title} (${chapterId})`);
      
      // Truncate text if too long
      const truncatedText = text.length > this.maxTextLength 
        ? text.substring(0, this.maxTextLength) + '... [Content truncated]'
        : text;
      
      let audioBuffer;
      
      // Use Google TTS if available, otherwise mock
      if (ttsClient) {
        audioBuffer = await this.useGoogleTTS(truncatedText);
      } else {
        audioBuffer = await this.useMockTTS(truncatedText, chapterId);
      }
      
      // Upload to Cloudinary
      const uploadResult = await this.uploadToCloudinary(audioBuffer, chapterId);
      
      return {
        success: true,
        message: 'Audio converted and uploaded successfully',
        audioUrl: uploadResult.url,
        duration: uploadResult.duration,
        publicId: uploadResult.publicId
      };
      
    } catch (error) {
      console.error('❌ TTS conversion error:', error);
      return {
        success: false,
        message: `TTS conversion failed: ${error.message}`,
        audioUrl: null,
        duration: null
      };
    }
  }

  async useGoogleTTS(text) {
    console.log('🔊 Using Google TTS');
    
    const request = {
      input: { text: text },
      voice: { 
        languageCode: 'en-US',
        name: 'en-US-Standard-C',
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    return Buffer.from(response.audioContent, 'base64');
  }

  async useMockTTS(text, chapterId) {
    console.log('🔊 Using Mock TTS (for testing)');
    
    // Create a mock audio file
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a small MP3 header as buffer (fake audio)
    const mockAudio = Buffer.from([
      0x49, 0x44, 0x33, // "ID3" header
      0x03, 0x00, // ID3v2.3
      0x00, // Flags
      0x00, 0x00, 0x00, 0x00, // Size
      // Minimal MP3 frame
      0xFF, 0xFB, 0x90, 0x64, 0x00, 0x0F, 0xF0, 0x00,
      0x00, 0x69, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00,
      0x0D, 0x20, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01,
      0xA4, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x34,
      0x80, 0x00, 0x00, 0x04, 0x4C, 0x41, 0x4D, 0x45,
      0x33, 0x2E, 0x31, 0x30, 0x30, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x4C,
      0x41, 0x4D, 0x45, 0x33, 0x2E, 0x31, 0x30, 0x30
    ]);
    
    return mockAudio;
  }

  async uploadToCloudinary(audioBuffer, chapterId) {
    return new Promise((resolve, reject) => {
      const folder = process.env.CLOUDINARY_FOLDER || 'varsity-audio';
      const publicId = `${folder}/${chapterId}-${Date.now()}`;
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: folder,
          public_id: publicId,
          overwrite: true,
          tags: ['tts-audio', chapterId]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Audio uploaded to Cloudinary:', result.secure_url);
            resolve({
              url: result.secure_url,
              duration: result.duration || 120,
              publicId: result.public_id
            });
          }
        }
      );
      
      uploadStream.end(audioBuffer);
    });
  }

  // Check TTS service availability
  async checkServiceStatus() {
    return {
      googleTTS: !!ttsClient,
      cloudinary: !!process.env.CLOUDINARY_URL,
      maxTextLength: this.maxTextLength,
      status: ttsClient ? 'ready' : 'mock-mode'
    };
  }
}

module.exports = new TTSService();