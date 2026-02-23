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
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
    const { register } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
  if (!fullName || !email || !password) {
    Alert.alert('Campos requeridos', 'Completa todos los campos');
    return;
  }
  if (password.length < 6) {
    Alert.alert('Contraseña débil', 'Mínimo 6 caracteres');
    return;
  }

  setLoading(true);
  try {
    console.log('🚀 Intentando registro con:', email);
    console.log('🔗 URL Supabase:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    
    await register(email.trim().toLowerCase(), password, fullName.trim());
    
    console.log('✅ Registro exitoso');
  } catch (err: any) {
    // Log completo del error
    console.error('❌ Error completo:', JSON.stringify(err, null, 2));
    console.error('❌ Response data:', err?.response?.data);
    console.error('❌ Message:', err?.message);
    console.error('❌ Status:', err?.response?.status);

    // Extraer mensaje legible
    const errorMsg =
      err?.response?.data?.error_description ||
      err?.response?.data?.msg ||
      err?.response?.data?.message ||
      err?.message ||
      'Error desconocido — revisa la consola de Expo';

    Alert.alert('Error al registrarse', errorMsg);
  } finally {
    setLoading(false);
  }
};

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Empieza gratis — hasta 15 recibos/mes</Text>

            {[
            { label: 'Nombre completo', value: fullName, setter: setFullName, icon: 'person-outline', placeholder: 'Tu nombre', type: 'default' },
            { label: 'Email', value: email, setter: setEmail, icon: 'mail-outline', placeholder: 'tu@email.com', type: 'email-address' },
            { label: 'Contraseña', value: password, setter: setPassword, icon: 'lock-closed-outline', placeholder: '••••••••', type: 'default', secure: true },
            ].map((field) => (
            <View key={field.label}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputContainer}>
                <Ionicons name={field.icon as any} size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.type as any}
                    autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                    secureTextEntry={field.secure}
                />
                </View>
            </View>
            ))}

            <Button title="Crear cuenta" onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: Spacing.xl }} />

            <Text style={styles.terms}>
            Al registrarte aceptas nuestros{' '}
            <Text style={styles.link}>Términos de Servicio</Text> y{' '}
            <Text style={styles.link}>Política de Privacidad</Text>
            </Text>
        </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flexGrow: 1, padding: Spacing.xl },
    back: { marginBottom: Spacing.lg, marginTop: Spacing.lg },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
    label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.md },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary },
    terms: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xl, lineHeight: 20 },
    link: { color: Colors.primary, fontWeight: '600' },
});