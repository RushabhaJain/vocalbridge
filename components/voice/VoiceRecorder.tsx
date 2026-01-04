'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  isProcessing = false,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-full animate-pulse">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            {formatDuration(recordingDuration)}
          </span>
        </div>
      )}

      <Button
        type="button"
        variant={isRecording ? 'destructive' : 'outline'}
        size="icon"
        disabled={disabled || isProcessing}
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "rounded-full transition-all duration-300",
          isRecording && "scale-110 shadow-lg shadow-red-500/20"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
