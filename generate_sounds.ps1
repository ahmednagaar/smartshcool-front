# Script to generate placeholder sound files
$soundDir = "d:\SmartShcool\Frontend\nafes-platform\src\assets\sounds"
New-Item -ItemType Directory -Force -Path $soundDir

function New-SoundFile {
    param([string]$Name, [int]$Frequency, [int]$Duration)
    $path = Join-Path $soundDir $Name
    
    # Create a simple header for a WAVE file (PCM)
    # This is a crude way to make a valid-ish sound file purely with script
    # For actual valid MP3/WAV, we'd need a real encoder.
    # INSTEAD: We will try to download dummy samples if internet works, 
    # OR create empty files so the 404 errors stop (but no sound will play).
    # Since I cannot guarantee internet access or binary generation capabilities:
    
    Set-Content -Path $path -Value "RIFF....WAVEfmt ...." -NoNewline # Corrupt/Empty placeholder
}

# Actually, a better approach for "making it work" without external assets
# is to rely on browser SpeechSynthesis or AudioContext in the service if files are missing.
# BUT, the user asked to "apply anything needed".
# I will try to generate simple valid WAV files using C# inline in PowerShell.

$code = @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class WavGenerator
{
    public static void Generate(string filePath, int frequency, int durationMs)
    {
        var fs = new FileStream(filePath, FileMode.Create);
        var bw = new BinaryWriter(fs);
        
        int sampleRate = 44100;
        short bitsPerSample = 16;
        short channels = 1;
        int numSamples = sampleRate * durationMs / 1000;
        int subChunk2Size = numSamples * channels * bitsPerSample / 8;
        int chunkSize = 36 + subChunk2Size;

        // RIFF header
        bw.Write("RIFF".ToCharArray());
        bw.Write(chunkSize);
        bw.Write("WAVE".ToCharArray());
        bw.Write("fmt ".ToCharArray());
        bw.Write(16); // Subchunk1Size
        bw.Write((short)1); // AudioFormat (1=PCM)
        bw.Write(channels);
        bw.Write(sampleRate);
        bw.Write(sampleRate * channels * bitsPerSample / 8); // ByteRate
        bw.Write((short)(channels * bitsPerSample / 8)); // BlockAlign
        bw.Write(bitsPerSample);

        // Data chunk
        bw.Write("data".ToCharArray());
        bw.Write(subChunk2Size);

        // Waveform data (Sine wave)
        double amplitude = 32760; // Max amplitude for 16-bit
        for (int i = 0; i < numSamples; i++)
        {
            double time = (double)i / sampleRate;
            short sample = (short)(amplitude * Math.Sin(2 * Math.PI * frequency * time));
            bw.Write(sample);
        }

        bw.Close();
        fs.Close();
    }
}
"@

Add-Type -TypeDefinition $code -Language CSharp

# Generate sounds
# Spin: Low continuous hum (approx)
[WavGenerator]::Generate("$soundDir\spin.wav", 200, 1000) 

# Correct: High pitch happy
[WavGenerator]::Generate("$soundDir\correct.wav", 800, 500)

# Wrong: Low pitch sad
[WavGenerator]::Generate("$soundDir\wrong.wav", 150, 500)

# Tick: Short click
[WavGenerator]::Generate("$soundDir\tick.wav", 1000, 100)

# Complete: Fanfare-ish (long tone)
[WavGenerator]::Generate("$soundDir\complete.wav", 600, 2000)

# Click: Short mid tone
[WavGenerator]::Generate("$soundDir\click.wav", 400, 100)

# Achievement: High pitch magic
[WavGenerator]::Generate("$soundDir\achievement.wav", 1200, 1000)

Write-Host "Sounds generated in $soundDir"
