import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Download, Maximize2, Image as ImageIcon, Video, Mic, ChevronLeft, ChevronRight } from 'lucide-react';

interface Attachment {
  file_id?: string;
  fileId?: string;
  filename: string;
  original_name?: string;
  originalName?: string;
  mime_type?: string;
  mimeType?: string;
  size?: number;
  url: string;
}

interface MediaViewerProps {
  attachments: Attachment[];
  baseUrl?: string;
}

const getFullUrl = (url: string, baseUrl: string = ''): string => {
  if (url.startsWith('http')) return url;

  // Remove trailing slash from baseUrl
  let cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // If url starts with /api and baseUrl ends with /api, avoid duplicate
  if (url.startsWith('/api') && cleanBaseUrl.endsWith('/api')) {
    cleanBaseUrl = cleanBaseUrl.replace(/\/api$/, '');
  }

  return `${cleanBaseUrl}${url}`;
};

const getAttachmentType = (attachment: Attachment): 'image' | 'video' | 'audio' | 'other' => {
  const mimeType = attachment.mime_type || attachment.mimeType || '';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Image Viewer Component
const ImageViewer: React.FC<{
  url: string;
  alt: string;
  onFullscreen: () => void;
}> = ({ url, alt, onFullscreen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      )}
      {error ? (
        <div className="h-32 flex items-center justify-center text-gray-400">
          <ImageIcon size={24} />
          <span className="ml-2">Không thể tải ảnh</span>
        </div>
      ) : (
        <>
          <img
            src={url}
            alt={alt}
            className="w-full h-auto object-cover cursor-pointer transition-transform hover:scale-105"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError(true);
            }}
            onClick={onFullscreen}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={onFullscreen}
              className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <Maximize2 size={20} className="text-gray-700" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Video Player Component
const VideoPlayer: React.FC<{
  url: string;
  title: string;
}> = ({ url, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <Video size={20} />
          <span className="ml-2">Không thể tải video: {title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg overflow-hidden max-w-md">
      <div className="relative" style={{ maxHeight: '400px' }}>
        <video
          ref={videoRef}
          src={url}
          className="w-full h-auto max-h-[400px] object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={() => setError(true)}
        />

        {/* Play overlay */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play size={32} className="text-gray-800 ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isPlaying ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play size={20} className="text-white" />
            )}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          <span className="text-white text-xs min-w-[80px] text-center">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isMuted ? (
              <VolumeX size={20} className="text-white" />
            ) : (
              <Volume2 size={20} className="text-white" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Video size={14} className="text-gray-400" />
          <span className="text-gray-400 text-xs truncate">{title}</span>
        </div>
      </div>
    </div>
  );
};

// Audio Player Component
const AudioPlayer: React.FC<{
  url: string;
  title: string;
}> = ({ url, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <Mic size={20} />
          <span className="ml-2">Không thể tải audio: {title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(true)}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <Pause size={24} className="text-white" />
          ) : (
            <Play size={24} className="text-white ml-1" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Mic size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm font-medium text-red-900 dark:text-red-200 truncate">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 bg-red-200 dark:bg-red-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <span className="text-xs text-red-700 dark:text-red-300 min-w-[70px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fullscreen Image Modal
const ImageModal: React.FC<{
  images: Attachment[];
  currentIndex: number;
  baseUrl: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}> = ({ images, currentIndex, baseUrl, onClose, onPrevious, onNext }) => {
  const currentImage = images[currentIndex];
  const url = getFullUrl(currentImage.url, baseUrl);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-white/10 rounded-full z-10">
        <span className="text-white text-sm">
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrevious}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={url}
        alt={currentImage.original_name || currentImage.originalName || 'Image'}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      {/* Download button */}
      <a
        href={url}
        download={currentImage.original_name || currentImage.originalName}
        className="absolute bottom-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <Download size={20} className="text-white" />
      </a>
    </div>
  );
};

// Main MediaViewer Component
export const MediaViewer: React.FC<MediaViewerProps> = ({ attachments, baseUrl = '' }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const images = attachments.filter(a => getAttachmentType(a) === 'image');
  const videos = attachments.filter(a => getAttachmentType(a) === 'video');
  const audios = attachments.filter(a => getAttachmentType(a) === 'audio');

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const handlePrevious = () => {
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-6">
      {/* Images */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon size={16} className="text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Hình ảnh ({images.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img, index) => (
              <ImageViewer
                key={img.file_id || img.fileId || index}
                url={getFullUrl(img.url, baseUrl)}
                alt={img.original_name || img.originalName || 'Image'}
                onFullscreen={() => openImageModal(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Video size={16} className="text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Video ({videos.length})
            </h4>
          </div>
          <div className="space-y-3">
            {videos.map((video, index) => (
              <VideoPlayer
                key={video.file_id || video.fileId || index}
                url={getFullUrl(video.url, baseUrl)}
                title={video.original_name || video.originalName || 'Video'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audios */}
      {audios.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mic size={16} className="text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Ghi âm ({audios.length})
            </h4>
          </div>
          <div className="space-y-3">
            {audios.map((audio, index) => (
              <AudioPlayer
                key={audio.file_id || audio.fileId || index}
                url={getFullUrl(audio.url, baseUrl)}
                title={audio.original_name || audio.originalName || 'Audio'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {modalOpen && images.length > 0 && (
        <ImageModal
          images={images}
          currentIndex={currentImageIndex}
          baseUrl={baseUrl}
          onClose={() => setModalOpen(false)}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  );
};

export default MediaViewer;
