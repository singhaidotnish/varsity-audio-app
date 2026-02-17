const textToSpeech = require('@google-cloud/text-to-speech');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const path = require('path');

// 1. Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// 2. Configure Google TTS
// Ensure your credentials.json is in the root or referenced correctly
const ttsClient = new textToSpeech.TextToSpeechClient(
    process.env.GOOGLE_CREDENTIALS 
    ? { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS) }
    : { keyFile: './credentials.json' } // Fallback for local
);

async function generateAndUploadAudio(text, chapterId) {
    console.log(`🎤 Generating audio for ${chapterId}...`);

    // Clean text (limit to 5000 chars for now to save cost/errors)
    const safeText = text.substring(0, 4900); 

    const request = {
        input: { text: safeText },
        voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-D' }, 
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        const [response] = await ttsClient.synthesizeSpeech(request);
        
        // Save temp file
        const tempFilePath = path.join(__dirname, `temp_${chapterId}.mp3`);
        await fs.promises.writeFile(tempFilePath, response.audioContent, 'binary');

        // Upload to Cloudinary
        console.log("☁️ Uploading to Cloudinary...");
        const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: "video",
            public_id: `varsity/audio/${chapterId}`,
            overwrite: true
        });

        // Cleanup
        fs.unlinkSync(tempFilePath);

        return { 
            audioUrl: uploadResult.secure_url,
            duration: uploadResult.duration 
        };

    } catch (error) {
        console.error("❌ Audio Gen Error:", error);
        throw error;
    }
}

module.exports = { generateAndUploadAudio };