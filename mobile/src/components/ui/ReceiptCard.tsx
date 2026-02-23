import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt } from '../../types';
import { Colors, BorderRadius, Shadow, FontSize } from '../../utils/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReceiptCardProps {
    receipt: Receipt;
    onPress: () => void;
}

export const ReceiptCard = ({ receipt, onPress }: ReceiptCardProps) => {
    const categoryColor = Colors.categories[receipt.category || 'Otro'] || Colors.textMuted;

    const statusConfig = {
        completed: { icon: 'checkmark-circle', color: Colors.success, label: 'Listo' },
        review: { icon: 'alert-circle', color: Colors.warning, label: 'Revisar' },
        processing: { icon: 'time', color: Colors.info, label: 'Procesando' },
        failed: { icon: 'close-circle', color: Colors.error, label: 'Error' },
        pending: { icon: 'ellipse', color: Colors.textMuted, label: 'Pendiente' },
    };

    const status = statusConfig[receipt.processing_status] || statusConfig.pending;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
        {/* Imagen del recibo */}
        <View style={styles.imageContainer}>
            {receipt.image_url ? (
            <Image source={{ uri: receipt.image_url }} style={styles.image} />
            ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: categoryColor + '20' }]}>
                <Ionicons name="receipt-outline" size={24} color={categoryColor} />
            </View>
            )}
        </View>

        {/* Información */}
        <View style={styles.info}>
            <View style={styles.topRow}>
            <Text style={styles.merchant} numberOfLines={1}>
                {receipt.merchant_name || 'Sin nombre'}
            </Text>
            <Text style={styles.amount}>
                {receipt.total_amount != null
                ? `${receipt.currency} ${receipt.total_amount.toFixed(2)}`
                : '—'}
            </Text>
            </View>

            <View style={styles.bottomRow}>
            {/* Categoría */}
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                {receipt.category || 'Sin categoría'}
                </Text>
            </View>

            {/* Fecha y estado */}
            <View style={styles.metaRow}>
                {receipt.receipt_date && (
                <Text style={styles.date}>
                    {format(new Date(receipt.receipt_date), 'd MMM', { locale: es })}
                </Text>
                )}
                <Ionicons name={status.icon as any} size={16} color={status.color} />
            </View>
            </View>
        </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.small,
    },
    imageContainer: { marginRight: 12 },
    image: { width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: Colors.border },
    imagePlaceholder: {
        width: 56, height: 56, borderRadius: BorderRadius.md,
        justifyContent: 'center', alignItems: 'center',
    },
    info: { flex: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    merchant: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: 8 },
    amount: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
    categoryDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    categoryText: { fontSize: FontSize.xs, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    date: { fontSize: FontSize.xs, color: Colors.textSecondary },
});