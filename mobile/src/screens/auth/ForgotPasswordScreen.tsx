import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/api';
import { Colors, FontSize, Spacing, BorderRadius } from '../../utils/theme';
import { Button } from '../../components/ui/Button';

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!email.trim()) {
            Alert.alert('Campo requerido', 'Ingresa tu email');
            return;
        }
        setLoading(true);
        try {
            await authService.forgotPassword(email.trim().toLowerCase());
            setSent(true);
        } catch {
            Alert.alert('Error', 'No se pudo enviar el correo. Verifica tu email e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-open-outline" size={36} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>Recuperar contraseña</Text>
                    <Text style={styles.subtitle}>
                        Te enviaremos un enlace para restablecer tu contraseña
                    </Text>
                </View>

                {sent ? (
                    <View style={styles.successBox}>
                        <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
                        <Text style={styles.successTitle}>¡Correo enviado!</Text>
                        <Text style={styles.successText}>
                            Revisa tu bandeja de entrada y sigue las instrucciones
                        </Text>
                        <Button
                            title="Volver al inicio de sesión"
                            onPress={() => navigation.navigate('Login')}
                            style={{ marginTop: Spacing.xl }}
                        />
                    </View>
                ) : (
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
                        <Button
                            title="Enviar enlace"
                            onPress={handleSend}
                            loading={loading}
                            size="lg"
                            style={{ marginTop: Spacing.lg }}
                        />
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl },
    backBtn: { marginTop: Spacing.lg, marginBottom: Spacing.md, alignSelf: 'flex-start' },
    header: { alignItems: 'center', paddingVertical: Spacing.xl },
    iconContainer: {
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
    form: {},
    label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary },
    successBox: { alignItems: 'center', paddingTop: Spacing.lg },
    successTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.md },
    successText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
