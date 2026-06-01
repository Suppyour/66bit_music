using System;
using System.IO;

namespace MusicalLotoBackend.Core.Services;

public static class AudioTrimmer
{
    public static MemoryStream? TryTrimMp3(Stream inputStream, int targetDurationSeconds)
    {
        try
        {
            byte[] fileBytes;
            if (inputStream is MemoryStream msInput)
            {
                fileBytes = msInput.ToArray();
            }
            else
            {
                using (var ms = new MemoryStream())
                {
                    inputStream.CopyTo(ms);
                    fileBytes = ms.ToArray();
                }
            }

            int length = fileBytes.Length;
            if (length < 10) return null;

            int offset = 0;

            if (fileBytes[0] == 0x49 && fileBytes[1] == 0x44 && fileBytes[2] == 0x33)
            {
                int size = ((fileBytes[6] & 0x7F) << 21) |
                           ((fileBytes[7] & 0x7F) << 14) |
                           ((fileBytes[8] & 0x7F) << 7)  |
                           (fileBytes[9] & 0x7F);
                
                offset = 10 + size;
                if (offset >= length)
                {
                    return null;
                }
            }

            int[] bitratesMpeg1L3 = { 0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0 };
            int[] bitratesMpeg2L3 = { 0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0 };

            int[] sampleRatesMpeg1 = { 44100, 48000, 32000, 0 };
            int[] sampleRatesMpeg2 = { 22050, 24000, 16000, 0 };
            int[] sampleRatesMpeg25 = { 11025, 12000, 8000, 0 };

            var outputMs = new MemoryStream();

            if (offset > 0)
            {
                outputMs.Write(fileBytes, 0, offset);
            }

            double accumulatedDurationSeconds = 0.0;
            bool frameFound = false;

            while (offset < length - 4)
            {
                byte b0 = fileBytes[offset];
                byte b1 = fileBytes[offset + 1];

                if (b0 == 0xFF && (b1 & 0xE0) == 0xE0)
                {
                    int mpegVersionIndex = (b1 & 0x18) >> 3;
                    int layerIndex = (b1 & 0x06) >> 1;

                    if (layerIndex != 1)
                    {
                        offset++;
                        continue;
                    }

                    byte b2 = fileBytes[offset + 2];
                    int bitrateIndex = (b2 & 0xF0) >> 4;
                    int sampleRateIndex = (b2 & 0x0C) >> 2;
                    int padding = (b2 & 0x02) >> 1;

                    if (bitrateIndex == 0 || bitrateIndex == 15 || sampleRateIndex == 3)
                    {
                        offset++;
                        continue;
                    }

                    int bitrate = 0;
                    int sampleRate = 0;

                    if (mpegVersionIndex == 3)
                    {
                        bitrate = bitratesMpeg1L3[bitrateIndex] * 1000;
                        sampleRate = sampleRatesMpeg1[sampleRateIndex];
                    }
                    else if (mpegVersionIndex == 2)
                    {
                        bitrate = bitratesMpeg2L3[bitrateIndex] * 1000;
                        sampleRate = sampleRatesMpeg2[sampleRateIndex];
                    }
                    else if (mpegVersionIndex == 0)
                    {
                        bitrate = bitratesMpeg2L3[bitrateIndex] * 1000;
                        sampleRate = sampleRatesMpeg25[sampleRateIndex];
                    }
                    else
                    {
                        offset++;
                        continue;
                    }

                    if (sampleRate == 0 || bitrate == 0)
                    {
                        offset++;
                        continue;
                    }

                    int frameSize;
                    if (mpegVersionIndex == 3)
                    {
                        frameSize = (144 * bitrate / sampleRate) + padding;
                    }
                    else
                    {
                        frameSize = (72 * bitrate / sampleRate) + padding;
                    }

                    if (frameSize <= 4 || offset + frameSize > length)
                    {
                        offset++;
                        continue;
                    }

                    frameFound = true;
                    outputMs.Write(fileBytes, offset, frameSize);

                    double frameDuration = (mpegVersionIndex == 3 ? 1152.0 : 576.0) / sampleRate;
                    accumulatedDurationSeconds += frameDuration;

                    offset += frameSize;

                    if (accumulatedDurationSeconds >= targetDurationSeconds)
                    {
                        break;
                    }
                }
                else
                {
                    offset++;
                }
            }

            if (!frameFound)
            {
                return null;
            }

            outputMs.Position = 0;
            return outputMs;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AudioTrimmer] Error during MP3 trimming: {ex.Message}");
            return null;
        }
    }
}
