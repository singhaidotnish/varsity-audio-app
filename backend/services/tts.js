const textToSpeech = require('@google-cloud/text-to-speech');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const path = require('path');

// CONFIGURATION
const MAX_CHARS = 4800; // Safety buffer (Google limit is 5000)

// Initialize Clients
const ttsClient = new textToSpeech.TextToSpeechClient({
    // Ensure this path points to your actual JSON key file
    keyFile: path.join(__dirname, '../text-to-speech-api-457510-37290210a01c.json')
});

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

/**
 * Helper: Splits long text into chunks by sentences
 */
function splitTextIntoChunks(text) {
    if (text.length <= MAX_CHARS) return [text];

    const chunks = [];
    let currentChunk = "";
    
    // Split by period to keep sentences intact
    const sentences = text.split('. ');

    sentences.forEach(sentence => {
        const potentialChunk = currentChunk + sentence + ". ";
        
        if (potentialChunk.length < MAX_CHARS) {
            currentChunk = potentialChunk;
        } else {
            chunks.push(currentChunk);
            currentChunk = sentence + ". ";
        }
    });
    
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

/**
 * Main Function called by adminController.js
 */
async function convertTextToSpeech(content, chapterId, title) {
    console.log(`🎤 Starting TTS for: ${title} (Length: ${content.length} chars)`);
    
    // 1. Clean Content (Remove HTML tags if they exist in the raw text)
    // Simple regex to strip tags, adjust if you need to keep pauses
    const cleanText = content.replace(/<[^>]*>?/gm, '');
    
    const chunks = splitTextIntoChunks(cleanText);
    console.log(`   -> Split into ${chunks.length} chunks.`);

    const audioBuffers = [];

    try {
        // 2. Generate Audio for each chunk
        for (let i = 0; i < chunks.length; i++) {
            console.log(`   -> Processing chunk ${i + 1}/${chunks.length}...`);
            
            const request = {
                input: { text: chunks[i] },
                voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-D' },
                audioConfig: { audioEncoding: 'MP3' },
            };

            const [response] = await ttsClient.synthesizeSpeech(request);
            audioBuffers.push(response.audioContent);
        }

        // 3. Combine all buffers into one
        const finalAudioBuffer = Buffer.concat(audioBuffers);

        // 4. Save to temp file
        const tempPath = path.join(__dirname, `../temp_${chapterId}.mp3`);
        await util.promisify(fs.writeFile)(tempPath, finalAudioBuffer, 'binary');

        // 5. Upload to Cloudinary
        console.log("☁️ Uploading combined audio to Cloudinary...");
        const uploadResult = await cloudinary.uploader.upload(tempPath, {
            resource_type: "video",
            folder: "varsity-audio",
            public_id: `chap_${chapterId}`,
            overwrite: true
        });

        // 6. Cleanup
        fs.unlinkSync(tempPath);

        console.log("✅ Audio Complete:", uploadResult.secure_url);

        return {
            success: true,
            audioUrl: uploadResult.secure_url,
            duration: uploadResult.duration,
            message: "Audio converted successfully"
        };

    } catch (error) {
        console.error("❌ TTS Service Error:", error);
        return {
            success: false,
            message: error.message
        };
    }
}

module.exports = { convertTextToSpeech };