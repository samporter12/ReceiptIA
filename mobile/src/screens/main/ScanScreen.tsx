import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Alert, ActivityIndicator, Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { receiptService } from '../../services/api';
import { Colors, FontSize, Spacing, BorderRadius } from '../../utils/theme';

type ScanStep = 'camera' | 'preview' | 'processing';

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [step, setStep] = useState<ScanStep>('camera');
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [facing] = useState<CameraType>('back');
    const cameraRef = useRef<CameraView>(null);
    const navigation = useNavigation<any>();

    const takePicture = useCallback(async () => {
        if (!cameraRef.current) return;
        try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
        if (photo) {
            setCapturedUri(photo.uri);
            setStep('preview');
        }
        } catch (err) {
        Alert.alert('Error', 'No se pudo tomar la foto');
        }
    }, []);

    const pickFromGallery = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
        setStep('preview');
        }
    }, []);

    const processImage = useCallback(async () => {
    if (!capturedUri) return;
    setStep('processing');

    try {
        console.log('📤 Iniciando subida de imagen...');

        // 1. Obtener URL prefirmada de S3
        const { upload_url, image_key } = await receiptService.getUploadUrl('jpg');
        console.log('✅ URL prefirmada obtenida:', image_key);

        // 2. Subir imagen directamente a S3
        const imageResponse = await fetch(capturedUri);
        const blob = await imageResponse.blob();

        const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
        });

        if (!uploadResponse.ok) {
        throw new Error(`Error subiendo imagen: ${uploadResponse.status}`);
        }
        console.log('✅ Imagen subida a S3');

        // 3. Iniciar procesamiento en backend
        const { receipt_id } = await receiptService.processReceipt(image_key);
        console.log('✅ Procesamiento iniciado:', receipt_id);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Alert.alert(
        '¡Recibo enviado! 🎉',
        'Tu recibo se está analizando con IA. Tarda entre 5-10 segundos.',
        [
            {
            text: 'Ver recibos',
            onPress: () => {
                navigation.navigate('Receipts');
                setStep('camera');
                setCapturedUri(null);
            },
            },
            {
            text: 'Escanear otro',
            onPress: () => {
                setStep('camera');
                setCapturedUri(null);
            },
            },
        ]
        );
    } catch (err: any) {
        console.error('❌ Error procesando imagen:', err);
        setStep('preview');
        const isNetworkError = !err?.response && err?.message;
        const message = err?.response?.data?.error || err?.message || 'Intenta de nuevo';
        Alert.alert(
        isNetworkError ? 'Sin conexión' : 'Error al procesar',
        message,
        [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Reintentar', onPress: processImage },
        ]
        );
    }
}, [capturedUri, navigation]);

    // Sin permisos
    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
        <View style={[styles.container, styles.centered]}>
            <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.permissionTitle}>Necesitamos acceso a la cámara</Text>
            <Text style={styles.permissionText}>Para escanear tus recibos necesitamos permiso de cámara</Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Permitir acceso</Text>
            </TouchableOpacity>
        </View>
        );
    }

    // Vista de procesamiento
    if (step === 'processing') {
        return (
        <View style={[styles.container, styles.centered, { backgroundColor: Colors.primaryDark }]}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.processingTitle}>Analizando recibo...</Text>
            <Text style={styles.processingSubtitle}>La IA está extrayendo los datos</Text>
        </View>
        );
    }

    // Vista de preview
    if (step === 'preview' && capturedUri) {
        return (
        <View style={styles.container}>
            <Image source={{ uri: capturedUri }} style={styles.preview} resizeMode="contain" />

            <View style={styles.previewControls}>
            <Text style={styles.previewTitle}>¿Se ve bien el recibo?</Text>
            <Text style={styles.previewSubtitle}>Asegúrate que el texto sea legible</Text>

            <View style={styles.previewButtons}>
                <TouchableOpacity
                style={[styles.previewBtn, styles.retakeBtn]}
                onPress={() => { setStep('camera'); setCapturedUri(null); }}
                >
                <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
                <Text style={styles.retakeBtnText}>Repetir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.previewBtn, styles.confirmBtn]}
                onPress={processImage}
                >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.confirmBtnText}>Procesar</Text>
                </TouchableOpacity>
            </View>
            </View>
        </View>
        );
    }

    // Vista de cámara
    return (
        <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            {/* Overlay de guía */}
            <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.cameraHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>Escanear Recibo</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Marco guía */}
            <View style={styles.frameContainer}>
                <View style={styles.frame}>
                {/* Esquinas del marco */}
                {[
                    { top: 0, left: 0 }, { top: 0, right: 0 },
                    { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
                ].map((pos, i) => (
                    <View key={i} style={[styles.corner, pos]} />
                ))}
                </View>
                <Text style={styles.frameHint}>Centra el recibo dentro del marco</Text>
            </View>

            {/* Controles inferiores */}
            <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
                <Ionicons name="images-outline" size={26} color="white" />
                <Text style={styles.galleryBtnText}>Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
                <View style={styles.shutterInner} />
                </TouchableOpacity>

                <View style={{ width: 70 }} />
            </View>
            </View>
        </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'space-between' },
    cameraHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: Spacing.lg,
    },
    closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    cameraTitle: { color: 'white', fontSize: FontSize.lg, fontWeight: '700' },
    frameContainer: { alignItems: 'center' },
    frame: {
        width: 280, height: 400,
        borderRadius: BorderRadius.lg, position: 'relative',
    },
    corner: {
        position: 'absolute', width: 30, height: 30,
        borderColor: 'white', borderWidth: 3,
    },
    frameHint: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: Spacing.md, textAlign: 'center' },
    cameraControls: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl, paddingBottom: 48,
    },
    galleryBtn: { alignItems: 'center', width: 70 },
    galleryBtnText: { color: 'white', fontSize: FontSize.xs, marginTop: 4 },
    shutterBtn: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 4, borderColor: 'white',
        justifyContent: 'center', alignItems: 'center',
    },
    shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'white' },
    preview: { flex: 1, backgroundColor: '#000' },
    previewControls: {
        backgroundColor: Colors.surface, padding: Spacing.xl,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
    },
    previewTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    previewSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.lg },
    previewButtons: { flexDirection: 'row', gap: 12 },
    previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md, borderRadius: BorderRadius.md },
    retakeBtn: { backgroundColor: Colors.border },
    retakeBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
    confirmBtn: { backgroundColor: Colors.primary },
    confirmBtnText: { fontSize: FontSize.md, fontWeight: '700', color: 'white' },
    processingTitle: { color: 'white', fontSize: FontSize.xl, fontWeight: '800', marginTop: Spacing.lg },
    processingSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.md, marginTop: 4 },
    permissionTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginTop: Spacing.lg },
    permissionText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: Spacing.xl },
    permissionBtn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: BorderRadius.md },
    permissionBtnText: { color: 'white', fontWeight: '700', fontSize: FontSize.md },
});