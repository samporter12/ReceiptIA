import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { receiptService } from '../../services/api';
import { Receipt, CATEGORIES } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../utils/theme';
import { ReceiptCard } from '../../components/ui/ReceiptCard';
import { useReceiptPolling } from '../../hooks/useReceiptPolling';



export default function ReceiptsScreen() {
    const navigation = useNavigation<any>();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadReceipts = useCallback(async (reset = false) => {
        try {
        const currentPage = reset ? 1 : page;
        const res = await receiptService.getReceipts({
            page: currentPage, limit: 20,
            search: search || undefined,
            category: activeCategory || undefined,
        });

        const newReceipts = res.data || [];
        if (reset) {
            setReceipts(newReceipts);
            setPage(2);
        } else {
            setReceipts(prev => [...prev, ...newReceipts]);
            setPage(prev => prev + 1);
        }
        setHasMore(newReceipts.length === 20);
        } catch (err) {
        console.error('Error loading receipts:', err);
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
    }, [search, activeCategory, page]);

    useEffect(() => { loadReceipts(true); }, [search, activeCategory]);
    useReceiptPolling(() => loadReceipts(true), true);


    const onRefresh = () => { setRefreshing(true); loadReceipts(true); };

    return (
        <View style={styles.container}>
        {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Mis Recibos</Text>

        {/* Buscador */}
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar por comercio, categoría..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
            />
            {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
            )}
        </View>

        {/* Filtros de categoría */}
        <FlatList
            data={['Todos', ...CATEGORIES]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            style={styles.filterList}
            renderItem={({ item }) => {
                const isActive = item === 'Todos' ? !activeCategory : activeCategory === item;
                return (
                <TouchableOpacity
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setActiveCategory(item === 'Todos' ? null : item)}
                >
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {item}
                    </Text>
                </TouchableOpacity>
                );
            }}
            />
        </View>

        {/* Lista */}
        {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <FlatList
            data={receipts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ReceiptCard
                receipt={item}
                onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
                />
            )}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            onEndReached={() => { if (hasMore) loadReceipts(); }}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
                <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={64} color={Colors.border} />
                <Text style={styles.emptyTitle}>Sin recibos</Text>
                <Text style={styles.emptyText}>
                    {search ? 'No encontramos resultados para tu búsqueda' : 'Escanea tu primer recibo'}
                </Text>
                </View>
            }
            />
        )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.surface, paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
        borderRadius: BorderRadius.md, paddingHorizontal: 12, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: FontSize.md, color: Colors.textPrimary },
    filterList: { marginBottom: 4 },
    filterChip: {
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
        backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
        marginRight: 8,
    },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    filterTextActive: { color: 'white' },
    list: { padding: Spacing.lg },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
    emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
});