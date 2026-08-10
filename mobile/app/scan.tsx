import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {
  TextRecognitionScript,
  captureAndRecognizeText,
  recognizeTextFromImage,
  useTextRecognition,
} from 'react-native-vision-camera-mlkit-plugin';
import { Worklets } from 'react-native-worklets-core';

import { AppButton } from '@/components/AppButton';
import { API_BASE_URL, verifyQuote } from '@/lib/api';
import { saveVerification } from '@/lib/storage';

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [liveText, setLiveText] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const { scanText } = useTextRecognition({ language: TextRecognitionScript.LATIN });

  const onTextDetected = Worklets.createRunOnJS((text: string) => {
    if (text?.trim()) setLiveText(text.trim());
  });

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const result = scanText(frame);
      if (result?.text) {
        onTextDetected(result.text);
      }
    },
    [scanText, onTextDetected]
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const mutation = useMutation({
    mutationFn: verifyQuote,
    onSuccess: async (data) => {
      await saveVerification(data);
      router.replace({
        pathname: '/result',
        params: { payload: JSON.stringify(data) },
      });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Verification failed';
      Alert.alert('Could not verify', `${message}\n\nAPI: ${API_BASE_URL}`);
    },
  });

  const verifyExtracted = useCallback(
    (text: string) => {
      const cleaned = text.trim();
      if (cleaned.length < 3) {
        Alert.alert('No text found', 'Point at clearer text, or paste the quote on Home.');
        return;
      }
      mutation.mutate(cleaned);
    },
    [mutation]
  );

  const onCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const result = await captureAndRecognizeText(cameraRef.current, {
        language: TextRecognitionScript.LATIN,
      });
      const text = result?.text?.trim() || liveText;
      verifyExtracted(text);
    } catch (error) {
      // Fallback: use last live OCR frame if capture helper fails
      if (liveText.trim()) {
        verifyExtracted(liveText);
      } else {
        Alert.alert(
          'OCR unavailable',
          error instanceof Error ? error.message : 'Could not read text from camera.'
        );
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const onPickGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to scan screenshots.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;

    try {
      setIsCapturing(true);
      const result = await recognizeTextFromImage({
        uri: picked.assets[0].uri,
        language: TextRecognitionScript.LATIN,
      });
      verifyExtracted(result?.text || '');
    } catch (error) {
      Alert.alert(
        'OCR failed',
        error instanceof Error
          ? error.message
          : 'On-device OCR requires a development build (not Expo Go).'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-4 text-center font-sans text-base text-muted">
          Camera permission is required to scan quotes from books or screenshots.
        </Text>
        <AppButton label="Grant Camera Access" onPress={requestPermission} />
      </View>
    );
  }

  if (!device) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-4 text-center font-sans text-base text-muted">
          No camera device found. You can still upload a screenshot.
        </Text>
        <AppButton label="Upload Screenshot" onPress={onPickGallery} loading={isCapturing} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        device={device}
        isActive
        photo
        frameProcessor={Platform.OS === 'web' ? undefined : frameProcessor}
        onInitialized={() => setCameraReady(true)}
      />

      <View className="absolute bottom-0 left-0 right-0 gap-3 border-t border-border bg-background/95 px-5 pb-8 pt-4">
        {liveText ? (
          <Text className="font-sans text-xs text-muted" numberOfLines={3}>
            Live OCR: {liveText}
          </Text>
        ) : (
          <Text className="font-sans text-xs text-slate-500">
            Point at English text for live OCR. Arabic quotes work best via Paste Text.
          </Text>
        )}
        <AppButton
          label="Capture & Verify"
          onPress={onCapture}
          loading={isCapturing || mutation.isPending}
          disabled={!cameraReady}
        />
        <AppButton
          label="Upload Screenshot"
          onPress={onPickGallery}
          variant="secondary"
          loading={isCapturing || mutation.isPending}
        />
      </View>
    </View>
  );
}
