import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import Slider from '@react-native-community/slider'; // Не забудь установить, если еще нет: npx expo install @react-native-community/slider
import TrackPlayer, { 
  State, 
  usePlaybackState, 
  useProgress, 
  Event, 
  useTrackPlayerEvents 
} from 'react-native-track-player';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// Временный хардкод трека для проверки
const PLAYLIST = [
  {
    id: '1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Сюда потом пойдет линк от твоего Boeing Music Bot
    title: 'Boeing Flight Track',
    artist: 'Boeing Music System',
    artwork: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=500', // Красивое превью для шторки iOS
  }
];

export default function App() {
  const playbackState = usePlaybackState();
  const progress = useProgress(); // Хук автоматически обновляет duration и position каждую секунду
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  // 1. Инициализация нативного плеера
  useEffect(() => {
    async function setup() {
      try {
        // Проверяем, не инициализирован ли уже плеер (чтобы избежать ошибок при Fast Refresh)
        try {
          await TrackPlayer.getActiveTrackIndex();
          setIsPlayerReady(true);
        } catch {
          await TrackPlayer.setupPlayer({
            waitForBuffer: true,
          });
          
          // Настраиваем системные кнопки управления в шторке
          await TrackPlayer.updateOptions({
            capabilities: [
              Capability.Play,
              Capability.Pause,
              Capability.SkipToNext,
              Capability.SkipToPrevious,
              Capability.Stop,
              Capability.Seek,
            ],
            compactCapabilities: [Capability.Play, Capability.Pause],
          });

          await TrackPlayer.add(PLAYLIST);
          setIsPlayerReady(true);
        }
      } catch (error) {
        console.log('Ошибка при инициализации TrackPlayer:', error);
      }
    }

    setup();
  }, []);

  // 2. Отслеживаем смену треков для обновления UI
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.track != null) {
      setCurrentTrack(event.track);
    }
  });

  if (!isPlayerReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#000000" />
      </View>
    );
  }

  // Обработчик кнопки Play/Pause
  const togglePlayback = async () => {
    const currentState = playbackState.state ?? playbackState;
    if (currentState === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  // Перемотка слайдером
  const handleSeek = async (value) => {
    await TrackPlayer.seekTo(value);
  };

  // Форматирование времени (00:00)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const currentState = playbackState.state ?? playbackState;
  const isPlaying = currentState === State.Playing;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Логотип / Хедер в стиле минимализма */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>BOEING MUSIC</Text>
      </View>

      {/* Информационный блок трека */}
      <View style={styles.metaContainer}>
        <Text style={styles.trackTitle}>{currentTrack?.title || PLAYLIST[0].title}</Text>
        <Text style={styles.trackArtist}>{currentTrack?.artist || PLAYLIST[0].artist}</Text>
      </View>

      {/* Прогресс-бар */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          value={progress.position}
          minimumValue={0}
          maximumValue={progress.duration || 100}
          thumbTintColor="#000000"
          minimumTrackTintColor="#000000"
          maximumTrackTintColor="#E5E5EA"
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
          <Text style={styles.timeText}>-{formatTime(progress.duration - progress.position)}</Text>
        </View>
      </View>

      {/* Панель управления кнопками */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.6}>
          <Text style={styles.secondaryButtonText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.playButton} 
          onPress={togglePlayback}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.6}>
          <Text style={styles.secondaryButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    color: '#8E8E93',
  },
  metaContainer: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 40,
  },
  trackTitle: {
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: -0.5,
    color: '#000000',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  slider: {
    width: width - 32,
    height: 40,
    alignSelf: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: -4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Courier', // Моноширинный шрифт, чтобы цифры не "прыгали" при замене
    color: '#8E8E93',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  playButton: {
    backgroundColor: '#000000',
    width: 140,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  secondaryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '300',
  },
});