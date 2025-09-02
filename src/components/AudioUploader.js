import React, { useState, useRef } from 'react';
import { extractAudioMetadata, analyzeAudioFile } from '../utils/audioUtils';

const AudioUploader = ({ onFileSelect, isUploading = false, uploadProgress = 0 }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioMetadata, setAudioMetadata] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const supportedFormats = process.env.REACT_APP_SUPPORTED_FORMATS?.split(',') || [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp4',
    'audio/webm',
    'audio/ogg'
  ];

  const maxFileSize = parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 26214400; // 25MB

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = async (file) => {
    // File validation
    if (!supportedFormats.includes(file.type)) {
      alert(`지원하지 않는 파일 형식입니다. 지원 형식: ${supportedFormats.join(', ')}`);
      return;
    }

    if (file.size > maxFileSize) {
      alert(`파일 크기가 너무 큽니다. 최대 크기: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setSelectedFile(file);
    setAudioMetadata(null);
    setAudioAnalysis(null);
    
    // Extract metadata and analyze audio
    setIsAnalyzing(true);
    try {
      const [metadata, analysis] = await Promise.all([
        extractAudioMetadata(file),
        analyzeAudioFile(file).catch(err => {
          console.warn('Audio analysis failed:', err);
          return null; // Continue without analysis
        })
      ]);
      
      setAudioMetadata(metadata);
      setAudioAnalysis(analysis);
    } catch (error) {
      console.error('Failed to process audio file:', error);
    } finally {
      setIsAnalyzing(false);
    }
    
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getQualityBadgeColor = (quality) => {
    const colors = {
      'Excellent': 'bg-green-100 text-green-800',
      'Very Good': 'bg-blue-100 text-blue-800',
      'Good': 'bg-yellow-100 text-yellow-800',
      'Fair': 'bg-orange-100 text-orange-800',
      'Poor': 'bg-red-100 text-red-800'
    };
    return colors[quality] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drag and Drop Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : selectedFile 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <div>
              <p className="text-lg font-medium text-gray-700">업로드 중...</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        ) : selectedFile ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">파일 선택 완료</h3>
              <p className="text-sm text-gray-600 mt-1">다른 파일을 선택하려면 클릭하세요</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">오디오 파일 업로드</h3>
              <p className="text-sm text-gray-600 mt-1">
                파일을 드래그해서 놓거나 클릭해서 선택하세요
              </p>
              <p className="text-xs text-gray-500 mt-2">
                지원 형식: MP3, WAV, M4A, WEBM, OGG (최대 25MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      {selectedFile && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">파일 정보</h4>
            {isAnalyzing && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                분석 중...
              </div>
            )}
          </div>

          {/* Basic File Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500">파일명:</span>
              <p className="font-medium text-gray-900 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">크기:</span>
              <p className="font-medium text-gray-900">
                {audioMetadata ? audioMetadata.formattedSize : '계산 중...'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">길이:</span>
              <p className="font-medium text-gray-900">
                {audioMetadata ? audioMetadata.formattedDuration : '계산 중...'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">형식:</span>
              <p className="font-medium text-gray-900">
                {selectedFile.type.split('/')[1].toUpperCase()}
              </p>
            </div>
          </div>

          {/* Audio Quality Info */}
          {audioAnalysis && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">오디오 품질</h5>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(audioAnalysis.quality)}`}>
                  {audioAnalysis.quality}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">샘플링 레이트:</span>
                  <p className="font-medium text-gray-900">{audioAnalysis.sampleRate?.toLocaleString()} Hz</p>
                  <p className="text-xs text-gray-500">{audioAnalysis.sampleRateQuality}</p>
                </div>
                <div>
                  <span className="text-gray-500">채널:</span>
                  <p className="font-medium text-gray-900">{audioAnalysis.channelConfiguration}</p>
                </div>
                <div>
                  <span className="text-gray-500">비트레이트:</span>
                  <p className="font-medium text-gray-900">
                    {audioMetadata ? `${audioMetadata.bitrate} kbps` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">예상 비트 깊이:</span>
                  <p className="font-medium text-gray-900">{audioAnalysis.bitDepth || '-'} bit</p>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details (Collapsible) */}
          {audioMetadata && (
            <div className="border-t pt-4 mt-4">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  기술 세부사항
                  <span className="ml-1 group-open:rotate-90 transition-transform inline-block">▶</span>
                </summary>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-600">
                  <div>
                    <span>재생 가능:</span>
                    <span className="ml-1">{audioMetadata.canPlay ? '✓' : '✗'}</span>
                  </div>
                  <div>
                    <span>탐색 가능:</span>
                    <span className="ml-1">{audioMetadata.seekable ? '✓' : '✗'}</span>
                  </div>
                  <div>
                    <span>수정 날짜:</span>
                    <span className="ml-1">{new Date(audioMetadata.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioUploader;