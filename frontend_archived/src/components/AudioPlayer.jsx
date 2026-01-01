import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

// 1. Added 'chapterId' to props
const AudioPlayer = ({ audioUrl, chapterTitle, chapterId, status, isAdmin }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  // --- LOGIC: Handle User Request (Local Storage) ---
  const storageKey = `request_sent_${chapterTitle}`;
  const [localRequestSent, setLocalRequestSent] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const handleRequestAudio = async () => {
    setLocalRequestSent(true); 
    localStorage.setItem(storageKey, 'true'); 
    // In a real app, you might send a "vote" to the backend here
    await new Promise(r => setTimeout(r, 1000));
  };

  // --- 2. UPDATED LOGIC: Call Backend Directly ---
  const handleAdminConvert = async () => {
    if (!chapterId) {
        alert("Error: Cannot find Chapter ID.");
        return;
    }

    if (!confirm(`Generate audio for "${chapterTitle}"?\nThis will take about 1-2 minutes.`)) return;

    setIsConverting(true);

    try {
      // Calls your existing route in admin.js: router.post('/chapters/:chapterId/convert', ...)

      const response = await fetch(`http://localhost:5000/api/admin/chapters/${chapterId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });      

      const result = await response.json();

      if (result.success) {
        alert("✅ Audio generation started! The page will reload to update status.");
        window.location.reload(); // Reloads page to show "Processing..." state
      } else {
        alert("❌ Server Error: " + (result.error || "Unknown error"));
        setIsConverting(false);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Network Error: Is the backend running?");
      setIsConverting(false);
    }
  };

  // --- LOGIC: Waveform (Standard) ---
  useEffect(() => {
    if (audioUrl && waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#d1d5db',
        progressColor: '#2563eb',
        cursorColor: 'transparent',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 40,
        normalize: true,
        backend: 'MediaElement',
      });
      wavesurfer.current.load(audioUrl);
      wavesurfer.current.on('ready', () => setLoading(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));
      return () => wavesurfer.current && wavesurfer.current.destroy();
    }
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  // ================= RENDER LOGIC =================

  // 1. AUDIO READY
  if (audioUrl) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={handlePlayPause} disabled={loading} className="flex-shrink-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md">
            {loading ? <span className="animate-spin text-lg">⟳</span> : isPlaying ? "⏸" : "▶"}
          </button>
          <div className="flex-grow flex flex-col justify-center">
             <p className="text-xs font-semibold text-gray-500 mb-1">Now Playing: {chapterTitle}</p>
             <div ref={waveformRef} className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 2. ADMIN MODE (The "Convert" Button)
  if (isAdmin) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-yellow-100 p-4 shadow-lg z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">Admin Mode</p>
            <p className="text-xs text-gray-500">
               {status === 'processing' ? 'Status: Processing...' : 'Audio missing.'}
            </p>
          </div>
          <button 
            onClick={handleAdminConvert} 
            disabled={isConverting || status === 'processing'} 
            className={`px-6 py-2 rounded-full text-sm font-bold shadow-lg text-white transition-colors ${
              isConverting || status === 'processing' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isConverting || status === 'processing' ? 'Processing...' : '⚡ Convert to Audio'}
          </button>
        </div>
      </div>
    );
  }

  // 3. PROCESSING
  if (status === 'processing') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <div>
            <p className="text-sm font-bold text-gray-800">Audio Coming Soon</p>
            <p className="text-xs text-gray-500">We are currently generating the audio for this chapter.</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. REQUEST SENT (Local)
  if (localRequestSent) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
        <div className="max-w-3xl mx-auto">
           <p className="text-sm font-bold text-green-600">✓ Request Received!</p>
           <p className="text-xs text-gray-500">Come back later. Enjoy reading!</p>
        </div>
      </div>
    );
  }

  // 5. DEFAULT (User Request Button)
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">Audio not available</p>
          <p className="text-xs text-gray-500">Request an AI narration for this chapter.</p>
        </div>
        <button onClick={handleRequestAudio} className="bg-gray-800 hover:bg-black text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg transition-all">
          Request Audio
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;