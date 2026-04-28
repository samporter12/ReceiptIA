import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { analyticsService } from '../../services/api';
import { DashboardData } from '../../types';
import { useAuth } from '../../store/AuthContext';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../utils/theme';
import { Card } from '../../components/ui/card';

export default function DashboardScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const loadData = useCallback(async () => {
        try {
        setError(false);
        const dashboard = await analyticsService.getDashboard();
        setData(dashboard);
        } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(true);
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = () => { setRefreshing(true); loadData(); };

    const changeIcon = (data?.percentage_change ?? 0) >= 0 ? 'trending-up' : 'trending-down';
    const changeColor = (data?.percentage_change ?? 0) >= 0 ? Colors.error : Colors.success;

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );

    if (error) return (
        <View style={styles.centered}>
            <Ionicons name="wifi-outline" size={64} color={Colors.border} />
            <Text style={styles.errorTitle}>Sin conexión</Text>
            <Text style={styles.errorText}>No se pudieron cargar los datos</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
            <View style={styles.headerTop}>
            <View>
                <Text style={styles.greeting}>Hola, {user?.full_name?.split(' ')[0] || 'Usuario'} 👋</Text>
                <Text style={styles.headerSubtitle}>Aquí está tu resumen del mes</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
                {(data?.pending_review ?? 0) > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{data?.pending_review}</Text>
                </View>
                )}
                <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
            </View>

            {/* Card principal de gasto */}
            <View style={styles.mainCard}>
            <Text style={styles.mainCardLabel}>Gasto total este mes</Text>
            <Text style={styles.mainCardAmount}>
                ${data?.current_month.total.toFixed(2) ?? '0.00'}
            </Text>
            <View style={styles.changeRow}>
                <Ionicons name={changeIcon as any} size={16} color={changeColor} />
                <Text style={[styles.changeText, { color: changeColor }]}>
                {Math.abs(data?.percentage_change ?? 0)}% vs mes anterior
                </Text>
            </View>
            </View>
        </LinearGradient>

        <View style={styles.body}>
            {/* Banner 80% plan Free */}
        {data?.plan_usage?.limit && data.plan_usage.count >= Math.floor(data.plan_usage.limit * 0.8) && (
            <View style={styles.usageWarning}>
            <Ionicons name="alert-circle" size={18} color={Colors.warning} />
            <Text style={styles.usageWarningText}>
                Usaste {data.plan_usage.count}/{data.plan_usage.limit} recibos del mes.{' '}
                {data.plan_usage.count >= data.plan_usage.limit
                ? '¡Límite alcanzado! Actualiza a Pro.'
                : 'Considera actualizar a Pro.'}
            </Text>
            </View>
        )}

        {/* Stats rápidas */}
            <View style={styles.statsRow}>
            {[
                { label: 'Recibos', value: data?.current_month.receipt_count ?? 0, icon: 'receipt-outline', color: Colors.primary },
                { label: 'IVA recuperable', value: `$${(data?.current_month.tax_recoverable ?? 0).toFixed(0)}`, icon: 'cash-outline', color: Colors.success },
                { label: 'Por revisar', value: data?.pending_review ?? 0, icon: 'alert-circle-outline', color: Colors.warning },
            ].map((stat) => (
                <Card key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                </Card>
            ))}
            </View>

            {/* Top categorías */}
            {(data?.top_categories?.length ?? 0) > 0 && (
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Top categorías</Text>
                {data!.top_categories.map((cat, i) => {
                const color = Colors.categories[cat.category] || Colors.textMuted;
                const maxTotal = data!.top_categories[0].total;
                const pct = (cat.total / maxTotal) * 100;
                return (
                    <View key={cat.category} style={styles.catRow}>
                    <View style={styles.catInfo}>
                        <View style={[styles.catDot, { backgroundColor: color }]} />
                        <Text style={styles.catName}>{cat.category}</Text>
                    </View>
                    <View style={styles.catBarContainer}>
                        <View style={[styles.catBar, { width: `${pct}%` as any, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.catAmount}>${cat.total.toFixed(0)}</Text>
                    </View>
                );
                })}
            </Card>
            )}

            {/* Botón escanear */}
            <TouchableOpacity
            style={styles.scanCta}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.85}
            >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.scanCtaInner}>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.scanCtaText}>Escanear nuevo recibo</Text>
            </LinearGradient>
            </TouchableOpacity>
        </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: 32 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
    greeting: { fontSize: FontSize.xl, fontWeight: '800', color: 'white' },
    headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    notifBtn: { padding: 4 },
    badge: {
        position: 'absolute', top: -4, right: -4, zIndex: 1,
        backgroundColor: Colors.error, borderRadius: 10,
        width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    },
    badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
    mainCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BorderRadius.xl, padding: Spacing.lg,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    mainCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginBottom: 4 },
    mainCardAmount: { color: 'white', fontSize: 40, fontWeight: '900', marginBottom: 8 },
    changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    changeText: { fontSize: FontSize.sm, fontWeight: '600' },
    body: { padding: Spacing.lg },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
    statCard: { flex: 1, alignItems: 'center', padding: 12 },
    statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
    statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    catInfo: { flexDirection: 'row', alignItems: 'center', width: 110 },
    catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    catName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
    catBarContainer: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
    catBar: { height: '100%', borderRadius: 4 },
    catAmount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, width: 50, textAlign: 'right' },
    scanCta: { borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.medium },
    scanCtaInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: Spacing.lg },
    scanCtaText: { color: 'white', fontSize: FontSize.lg, fontWeight: '700' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
    errorTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
    errorText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
    retryBtn: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: BorderRadius.md },
    retryBtnText: { color: 'white', fontWeight: '700', fontSize: FontSize.md },
    usageWarning: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.warning + '18', marginBottom: Spacing.md,
        padding: Spacing.md, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.warning + '40',
    },
    usageWarningText: { flex: 1, fontSize: FontSize.sm, color: Colors.warning, fontWeight: '600' },
});