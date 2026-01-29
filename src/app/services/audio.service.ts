import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private sounds: { [key: string]: HTMLAudioElement } = {};
    private isMuted: boolean = false;

    constructor() {
        this.preloadSounds();
    }

    private preloadSounds(): void {
        // Define all game sounds
        const soundFiles: { [key: string]: string } = {
            spin: 'assets/sounds/spin.wav',
            correct: 'assets/sounds/correct.wav',
            wrong: 'assets/sounds/wrong.wav',
            tick: 'assets/sounds/tick.wav',
            complete: 'assets/sounds/complete.wav',
            click: 'assets/sounds/click.wav',
            achievement: 'assets/sounds/achievement.wav'
        };

        // Preload each sound
        for (const [name, path] of Object.entries(soundFiles)) {
            const audio = new Audio();
            audio.src = path;
            audio.preload = 'auto';
            this.sounds[name] = audio;
        }
    }

    play(soundName: string, volume: number = 0.5): void {
        if (this.isMuted) return;

        const sound = this.sounds[soundName];
        if (sound) {
            // Clone audio for overlapping sounds
            const clone = sound.cloneNode(true) as HTMLAudioElement;
            clone.volume = Math.min(1, Math.max(0, volume));
            clone.play().catch(err => {
                console.log('Audio play failed:', err);
            });
        }
    }

    playCorrect(): void {
        this.play('correct', 0.6);
    }

    playWrong(): void {
        this.play('wrong', 0.6);
    }

    playSpin(): void {
        this.play('spin', 0.4);
    }

    playTick(): void {
        this.play('tick', 0.3);
    }

    playComplete(): void {
        this.play('complete', 0.7);
    }

    playClick(): void {
        this.play('click', 0.3);
    }

    playAchievement(): void {
        this.play('achievement', 0.8);
    }

    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    setMuted(muted: boolean): void {
        this.isMuted = muted;
    }

    getMuted(): boolean {
        return this.isMuted;
    }
}
