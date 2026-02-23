import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Dimensions,
    TouchableOpacity, ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, FontSize, Spacing } from '../../utils/theme';
import { Button } from '../../components/ui/Button';

const { width } = Dimensions.get('window');

interface Slide {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    gradient: [string, string];
}

const SLIDES: Slide[] = [
    {
        id: '1',
        icon: 'camera',
        title: 'Escanea en segundos',
        subtitle: 'Fotografía cualquier recibo y nuestra IA extrae todos los datos automáticamente.',
        gradient: ['#6C63FF', '#9C95FF'],
    },
    {
        id: '2',
        icon: 'sparkles',
        title: 'IA que entiende el contexto',
        subtitle: 'No solo lee números — categoriza tus gastos inteligentemente para tus impuestos.',
        gradient: ['#FF6B6B', '#FF8E8E'],
    },
    {
        id: '3',
        icon: 'bar-chart',
        title: 'Control financiero total',
        subtitle: 'Reportes instantáneos y exportación a Excel para tu contador.',
        gradient: ['#22C55E', '#4ADE80'],
    },
];

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

export default function OnboardingScreen({ navigation }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const renderSlide: ListRenderItem<Slide> = ({ item }) => (
        <LinearGradient colors={item.gradient} style={styles.slide}>
        <View style={styles.iconContainer}>
            <Ionicons name={item.icon as any} size={80} color="white" />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </LinearGradient>
    );

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        setCurrentIndex(currentIndex + 1);
        } else {
        navigation.navigate('Login');
        }
    };

    return (
        <View style={styles.container}>
        <FlatList
            ref={flatListRef}
            data={SLIDES}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
            setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
        />

        {/* Controles */}
        <View style={styles.controls}>
            {/* Dots */}
            <View style={styles.dots}>
            {SLIDES.map((_, i) => (
                <View
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
                />
            ))}
            </View>

            <Button
            title={currentIndex === SLIDES.length - 1 ? 'Empezar' : 'Siguiente'}
            onPress={handleNext}
            size="lg"
            style={styles.button}
            />

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.skip}>
            <Text style={styles.skipText}>Iniciar sesión</Text>
            </TouchableOpacity>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    iconContainer: {
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    slideTitle: {
        fontSize: FontSize.xxxl, fontWeight: '800',
        color: 'white', textAlign: 'center', marginBottom: Spacing.md,
    },
    slideSubtitle: {
        fontSize: FontSize.lg, color: 'rgba(255,255,255,0.85)',
        textAlign: 'center', lineHeight: 26,
    },
    controls: {
        padding: Spacing.xl, paddingBottom: Spacing.xxl,
        backgroundColor: Colors.background, alignItems: 'center',
    },
    dots: { flexDirection: 'row', marginBottom: Spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border, marginHorizontal: 4 },
    dotActive: { width: 24, backgroundColor: Colors.primary },
    button: { width: '100%', marginBottom: Spacing.md },
    skip: { padding: Spacing.sm },
    skipText: { color: Colors.textSecondary, fontSize: FontSize.md },
});