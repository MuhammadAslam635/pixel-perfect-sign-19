/**
 * Notification Sound Utility
 * Handles playing notification sounds based on user preferences
 */

export type SoundOption = 'off' | 'gentle' | 'bell' | 'pop';

export const SOUND_OPTIONS = [
  { value: 'off' as const, label: 'Off', description: 'No sound' },
  { value: 'gentle' as const, label: 'Gentle', description: 'Soft tone' },
  { value: 'bell' as const, label: 'Bell', description: 'Chime tone' },
  { value: 'pop' as const, label: 'Pop', description: 'Quick tone' },
] as const;

class NotificationSoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private currentSound: SoundOption = 'off';

  constructor() {
    // Preload sounds on initialization
    this.preloadSounds();
  }

  /**
   * Preload all sound files for better performance
   */
  private preloadSounds() {
    const sounds: SoundOption[] = ['gentle', 'bell', 'pop'];
    sounds.forEach(sound => {
      // Try MP3 first, fallback to WAV
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.preload = 'auto';
      audio.onerror = () => {
        // Fallback to WAV if MP3 not found
        const wavAudio = new Audio(`/sounds/${sound}.wav`);
        wavAudio.preload = 'auto';
        this.audioCache.set(sound, wavAudio);
      };
      this.audioCache.set(sound, audio);
    });
  }

  /**
   * Set the current notification sound preference
   */
  setSound(sound: SoundOption) {
    this.currentSound = sound;
  }

  /**
   * Get the current notification sound preference
   */
  getSound(): SoundOption {
    return this.currentSound;
  }

  /**
   * Play the current notification sound
   */
  async play() {
    if (this.currentSound === 'off') {
      return;
    }

    try {
      let audio = this.audioCache.get(this.currentSound);
      
      // If not cached, create new audio element
      if (!audio) {
        audio = new Audio(`/sounds/${this.currentSound}.mp3`);
        this.audioCache.set(this.currentSound, audio);
      }

      // Reset audio to start if already playing
      audio.currentTime = 0;
      
      // Play the sound
      await audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Test play a specific sound
   */
  async testPlay(sound: SoundOption): Promise<void> {
    if (sound === 'off') {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        let audio = this.audioCache.get(sound);
        
        if (!audio) {
          console.log(`Loading sound: ${sound}.mp3`);
          audio = new Audio(`/sounds/${sound}.mp3`);
          audio.preload = 'auto';
          
          // Handle audio load errors
          audio.onerror = (e) => {
            console.error(`Failed to load ${sound}.mp3, trying WAV fallback...`);
            const wavAudio = new Audio(`/sounds/${sound}.wav`);
            wavAudio.preload = 'auto';
            
            wavAudio.onerror = () => {
              reject(new Error(`Sound file not found: ${sound}`));
            };
            
            wavAudio.oncanplaythrough = () => {
              wavAudio.currentTime = 0;
              wavAudio.play()
                .then(() => resolve())
                .catch(err => reject(err));
            };
          };
          
          this.audioCache.set(sound, audio);
        }

        // Reset and play
        audio.currentTime = 0;
        console.log(`Playing sound: ${sound}`);
        
        audio.play()
          .then(() => {
            console.log(`Successfully played: ${sound}`);
            resolve();
          })
          .catch((err) => {
            console.error(`Play failed for ${sound}:`, err);
            reject(err);
          });
          
      } catch (error) {
        console.error('Error in testPlay:', error);
        reject(error);
      }
    });
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();
  }
}

// Export singleton instance
export const notificationSoundManager = new NotificationSoundManager();

/**
 * Load sound preference from localStorage
 */
export const loadSoundPreference = (): SoundOption => {
  try {
    const stored = localStorage.getItem('notificationSound');
    if (stored && ['off', 'gentle', 'bell', 'pop'].includes(stored)) {
      return stored as SoundOption;
    }
  } catch (error) {
    console.error('Error loading sound preference:', error);
  }
  return 'pop'; // Default to pop
};

/**
 * Save sound preference to localStorage
 */
export const saveSoundPreference = (sound: SoundOption) => {
  try {
    localStorage.setItem('notificationSound', sound);
    notificationSoundManager.setSound(sound);
  } catch (error) {
    console.error('Error saving sound preference:', error);
  }
};
