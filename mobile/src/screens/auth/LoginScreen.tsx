import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../store/AuthContext';
import { AuthStackParamList } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../utils/theme';
import { Button } from '../../components/ui/Button';

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
        Alert.alert('Campos requeridos', 'Ingresa tu email y contraseña');
        return;
        }
        setLoading(true);
        try {
        await login(email.trim().toLowerCase(), password);
        } catch (err: any) {
        Alert.alert(
            'Error al iniciar sesión',
            err?.response?.data?.error_description || 'Credenciales incorrectas'
        );
        } finally {
        setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <View style={styles.header}>
            <View style={styles.logoContainer}>
                <Ionicons name="scan" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.title}>ReceiptAI</Text>
            <Text style={styles.subtitle}>Gestión de gastos inteligente</Text>
            </View>

            {/* Formulario */}
            <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20} color={Colors.textMuted}
                />
                </TouchableOpacity>
            </View>

            <Button
                title="Iniciar Sesión"
                onPress={handleLogin}
                loading={loading}
                size="lg"
                style={{ marginTop: Spacing.lg }}
            />

            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>¿No tienes cuenta?</Text>
                <View style={styles.dividerLine} />
            </View>

            <Button
                title="Crear cuenta gratis"
                onPress={() => navigation.navigate('Register')}
                variant="secondary"
                size="lg"
            />
            </View>
        </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flexGrow: 1, padding: Spacing.xl },
    header: { alignItems: 'center', paddingVertical: Spacing.xxl },
    logoContainer: {
        width: 80, height: 80, borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
    form: { flex: 1 },
    label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.md },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary },
    eyeIcon: { padding: 4 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: { marginHorizontal: Spacing.sm, color: Colors.textSecondary, fontSize: FontSize.sm },
});