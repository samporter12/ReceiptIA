import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { Colors, FontSize, Spacing, BorderRadius } from '../../utils/theme';
import { Card } from '../../components/ui/card';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Cerrar sesión', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', onPress: logout, style: 'destructive' },
        ]);
    };

    const menuItems = [
        { icon: 'star-outline', label: 'Actualizar a Pro', color: Colors.warning, action: () => {} },
        { icon: 'download-outline', label: 'Exportar datos', color: Colors.primary, action: () => {} },
        { icon: 'shield-outline', label: 'Privacidad y seguridad', color: Colors.success, action: () => {} },
        { icon: 'help-circle-outline', label: 'Ayuda y soporte', color: Colors.info, action: () => {} },
        { icon: 'log-out-outline', label: 'Cerrar sesión', color: Colors.error, action: handleLogout },
    ];

    return (
        <ScrollView style={styles.container}>
        {/* Avatar y nombre */}
        <View style={styles.header}>
            <View style={styles.avatar}>
            <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
            </View>
            <Text style={styles.name}>{user?.full_name || 'Usuario'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={[styles.planBadge, user?.plan === 'pro' && styles.planBadgePro]}>
            <Ionicons name={user?.plan === 'pro' ? 'star' : 'person'} size={12} color={user?.plan === 'pro' ? '#fff' : Colors.primary} />
            <Text style={[styles.planText, user?.plan === 'pro' && styles.planTextPro]}>
                Plan {user?.plan === 'pro' ? 'Pro' : 'Gratuito'}
            </Text>
            </View>
        </View>

        {/* Uso del mes */}
        {user?.plan === 'free' && (
            <Card style={styles.usageCard}>
            <View style={styles.usageHeader}>
                <Text style={styles.usageTitle}>Uso este mes</Text>
                <Text style={styles.usageCount}>{user.receipts_count_this_month}/15</Text>
            </View>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(user.receipts_count_this_month / 15) * 100}%` as any }]} />
            </View>
            <Text style={styles.usageHint}>Actualiza a Pro para recibos ilimitados</Text>
            </Card>
        )}

      {/* Menú */}
        <Card style={styles.menu}>
            {menuItems.map((item, i) => (
            <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
                onPress={item.action}
            >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.menuLabel, item.color === Colors.error && { color: Colors.error }]}>
                {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            ))}
        </Card>

        <Text style={styles.version}>ReceiptAI v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { alignItems: 'center', paddingTop: 64, paddingBottom: Spacing.xl, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    avatarText: { fontSize: 36, fontWeight: '800', color: 'white' },
    name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
    email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },
    planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary },
    planBadgePro: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    planText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
    planTextPro: { color: 'white' },
    usageCard: { margin: Spacing.lg },
    usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    usageTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
    usageCount: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
    progressBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
    usageHint: { fontSize: FontSize.sm, color: Colors.textSecondary },
    menu: { margin: Spacing.lg, padding: 0, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    menuLabel: { flex: 1, fontSize: FontSize.md, fontWeight: '500', color: Colors.textPrimary },
    version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.xxl },
});