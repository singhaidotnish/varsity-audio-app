import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const AudioPlayer = ({ audioUrl, chapterTitle }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Initialize Waveform only if audioUrl exists
  useEffect(() => {
    if (audioUrl && waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#d1d5db',      // Gray (unplayed)
        progressColor: '#2563eb',  // Blue (played)
        cursorColor: 'transparent',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 40,
        normalize: true,
        backend: 'MediaElement', // Better stability for long audio
      });

      // Load the audio
      wavesurfer.current.load(audioUrl);

      // Listen for ready state
      wavesurfer.current.on('ready', () => {
        setLoading(false);
      });

      // Update play state when audio finishes
      wavesurfer.current.on('finish', () => setIsPlaying(false));

      // Cleanup on unmount
      return () => {
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
        }
      };
    }
  }, [audioUrl]);

  // Toggle Play/Pause
  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  // Mock "Request Audio" function
// WhatsApp Request Logic
  const handleRequestAudio = () => {
    // 1. REPLACE WITH YOUR PHONE NUMBER (International format, no + or -)
    // Example: 919999999999 for India
    const adminNumber = "919029555541"; 

    // 2. Create the message
    const text = `Hi Admin, I want to request the audio for:\n\nModule: ${chapterTitle}\n(URL: ${window.location.href})`;
    
    // 3. Encode for URL
    const encodedText = encodeURIComponent(text);
    
    // 4. Open WhatsApp
    const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- SCENARIO 2: AUDIO EXISTS (WAVEFORM) ---
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
      <div className="max-w-3xl mx-auto flex items-center gap-4">
        
        {/* Play/Pause Button */}
        <button 
          onClick={handlePlayPause}
          disabled={loading}
          className="flex-shrink-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin text-lg">⟳</span>
          ) : isPlaying ? (
            <span className="text-xl font-bold">⏸</span>
          ) : (
            <span className="text-xl font-bold ml-1">▶</span>
          )}
        </button>

        {/* Waveform Container */}
        <div className="flex-grow flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 mb-1 line-clamp-1">
                Now Playing: {chapterTitle}
            </p>
            {/* This div is where the waveform draws itself */}
            <div ref={waveformRef} className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;