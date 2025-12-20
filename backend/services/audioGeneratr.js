const textToSpeech = require('@google-cloud/text-to-speech');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const path = require('path');

// 1. Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'YOUR_CLOUD_NAME', 
  api_key: 'YOUR_API_KEY', 
  api_secret: 'YOUR_API_SECRET' 
});

// 2. Configure Google TTS
// Ensure your credentials.json is in the root or referenced correctly
const ttsClient = new textToSpeech.TextToSpeechClient({
    keyFile: './credentials.json'
});

async function generateAndUploadAudio(text, chapterId) {
    console.log("🎤 Generating audio...");

    // A. Construct the request
    const request = {
        input: { text: text },
        // Select the language and SSML voice gender (optional)
        voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-D' }, // Indian English accent
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        // B. Call Google API
        const [response] = await ttsClient.synthesizeSpeech(request);
        
        // C. Save temporarily to disk
        const tempFilePath = path.join(__dirname, `temp_${chapterId}.mp3`);
        const writeFile = util.promisify(fs.writeFile);
        await writeFile(tempFilePath, response.audioContent, 'binary');
        console.log('   Audio content written to file: ' + tempFilePath);

        // D. Upload to Cloudinary
        console.log("☁️ Uploading to Cloudinary...");
        const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: "video", // Cloudinary treats audio as 'video' for resource type
            public_id: `varsity/audio/chap_${chapterId}`,
            overwrite: true
        });

        // E. Cleanup: Delete temp file
        fs.unlinkSync(tempFilePath);

        console.log("✅ Success! Audio URL:", uploadResult.secure_url);
        return uploadResult.secure_url;

    } catch (error) {
        console.error("❌ Audio Generation Failed:", error);
        throw error;
    }
}

// Example usage if you want to test this file alone:
// generateAndUploadAudio("This is a test of the emergency broadcast system.", "9-2");

module.exports = { generateAndUploadAudio };